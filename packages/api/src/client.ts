import { CUSTOMER_METHODS, deserializeError, OTHER_METHODS, type ArkuMethod, type ArkuResponse, type GardenApi } from './protocol';

export type Invoke = (method: ArkuMethod, args: unknown[]) => Promise<ArkuResponse>;

/**
 * Servicio de jardines remoto: cada método llama a la función `arku` en Supabase.
 * Tiene la misma forma que GardenService, así que las pantallas no cambian.
 */
export function createRemoteGardenService(invoke: Invoke): GardenApi {
  const api: Record<string, (...args: unknown[]) => Promise<unknown>> = {};
  for (const method of [...CUSTOMER_METHODS, ...OTHER_METHODS]) {
    api[method] = async (...args: unknown[]) => {
      const response = await invoke(method, args);
      if (!response.ok) throw deserializeError(response.error);
      return response.result ?? undefined;
    };
  }
  return api as unknown as GardenApi;
}
