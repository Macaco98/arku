import { createRemoteGardenService, type ArkuResponse, type GardenApi } from '@arku/api';
import { createDevRepositories, DEMO_PRICING, FixtureCoverageService, GardenService } from '@arku/domain';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, FunctionsHttpError, type SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_KEY;

/**
 * 'supabase' cuando la app tiene configurado el proyecto (archivo .env), si no 'demo':
 * MOCK de desarrollo con datos en el dispositivo, cobertura de fixtures y código SMS fijo.
 */
export const backend: 'supabase' | 'demo' = url && key ? 'supabase' : 'demo';

/** Cliente de Supabase con la sesión guardada en el teléfono. null en modo demostración. */
export const supabase: SupabaseClient | null =
  url && key
    ? createClient(url, key, {
        auth: {
          storage: AsyncStorage,
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: Platform.OS === 'web',
        },
      })
    : null;

function createDemoGardens(): GardenApi {
  let seq = 0;
  return new GardenService({
    repos: createDevRepositories(AsyncStorage),
    coverage: new FixtureCoverageService(),
    pricing: DEMO_PRICING,
    newId: () => `${Date.now().toString(36)}-${(seq++).toString(36)}`,
    now: () => new Date(),
  });
}

/** Llama a la función `arku`, que aplica las reglas de @arku/domain en el servidor. */
async function invokeArku(client: SupabaseClient, method: string, args: unknown[]): Promise<ArkuResponse> {
  const { data, error } = await client.functions.invoke<ArkuResponse>('arku', { body: { method, args } });
  if (!error && data) return data;
  if (error instanceof FunctionsHttpError) {
    try {
      const body = (await (error.context as Response).json()) as ArkuResponse;
      if (body && body.ok === false) return body;
    } catch {
      // Respuesta sin JSON: se informa como error de conexión.
    }
  }
  return { ok: false, error: { name: 'NetworkError', message: 'Revisa tu conexión e inténtalo de nuevo.' } };
}

export function createGardens(): GardenApi {
  const client = supabase;
  if (!client) return createDemoGardens();
  return createRemoteGardenService((method, args) => invokeArku(client, method, args));
}
