/**
 * Función `arku` de Supabase (Edge Function, Deno). Se compila a un solo archivo con
 * `pnpm --filter @arku/api build:function` → supabase/functions/arku/index.ts.
 *
 * Toma el usuario del token de la sesión, arma GardenService con los repositorios de
 * Supabase (clave de servicio, que Supabase pone sola en las variables del servidor) y
 * ejecuta el caso de uso pedido. Las reglas son las mismas de @arku/domain.
 */
import { DEMO_PRICING, FixtureCoverageService, GardenService } from '@arku/domain';
import { createClient } from '@supabase/supabase-js';
import { serializeError, type ArkuRequest, type ArkuResponse } from './protocol';
import { handleArkuCall } from './server';
import { createSupabaseRepositories } from './supabase-repositories';

declare const Deno: {
  env: { get(name: string): string | undefined };
  serve(handler: (req: Request) => Promise<Response>): void;
};

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: ArkuResponse, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ ok: false, error: { name: 'Error', message: 'Usa POST.' } }, 405);

  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) return json({ ok: false, error: { name: 'Error', message: 'Servidor sin configurar.' } }, 500);
  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return json({ ok: false, error: { name: 'AuthError', message: 'Inicia sesión de nuevo.' } }, 401);

  try {
    const request = (await req.json()) as ArkuRequest;
    const service = new GardenService({
      repos: createSupabaseRepositories(admin),
      coverage: new FixtureCoverageService(),
      pricing: DEMO_PRICING,
      newId: () => crypto.randomUUID(),
      now: () => new Date(),
    });
    const result = await handleArkuCall(service, { id: data.user.id, phone: data.user.phone }, request);
    return json({ ok: true, result: result ?? null });
  } catch (e) {
    return json({ ok: false, error: serializeError(e) });
  }
});
