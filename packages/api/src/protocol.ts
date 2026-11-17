import { NotFoundError, OutOfCoverageError, type GardenService } from '@arku/domain';

/**
 * Casos de uso que la app puede pedirle a la función `arku`. El primer argumento
 * es siempre el cliente; el servidor lo reemplaza por el usuario de la sesión.
 */
export const CUSTOMER_METHODS = [
  'getCustomer',
  'updateCustomerProfile',
  'listAddresses',
  'addAddress',
  'updateAddress',
  'createGarden',
  'registerGarden',
  'getGarden',
  'listGardens',
  'updateGarden',
  'editGarden',
  'addPhoto',
  'removePhoto',
  'requestQuote',
  'listQuotes',
  'getQuote',
  'latestQuote',
  'respondToQuote',
] as const satisfies readonly (keyof GardenService)[];

/** Sin cliente como primer argumento. */
export const OTHER_METHODS = ['registerCustomer', 'checkCoverage', 'completeReview'] as const satisfies readonly (keyof GardenService)[];

export type ArkuMethod = (typeof CUSTOMER_METHODS)[number] | (typeof OTHER_METHODS)[number];

/** Lo que la app usa del servicio de jardines, local (mock) o remoto (Supabase). */
export type GardenApi = Pick<GardenService, ArkuMethod>;

export interface ArkuRequest {
  method: ArkuMethod;
  args: unknown[];
}

export type ArkuResponse = { ok: true; result: unknown } | { ok: false; error: { name: string; message: string } };

/** Convierte cualquier error en algo que se puede mandar como JSON, con un mensaje legible. */
export function serializeError(error: unknown): { name: string; message: string } {
  if (error && typeof error === 'object' && 'issues' in error && Array.isArray(error.issues)) {
    const first = error.issues[0] as { message?: string } | undefined;
    return { name: 'ValidationError', message: first?.message ?? 'Revisa los datos.' };
  }
  if (error instanceof Error) return { name: error.name, message: error.message };
  return { name: 'Error', message: 'Algo salió mal. Inténtalo de nuevo.' };
}

/** Recrea en la app los errores del dominio, para que `instanceof` siga funcionando. */
export function deserializeError(error: { name: string; message: string }): Error {
  if (error.name === 'OutOfCoverageError') return new OutOfCoverageError();
  if (error.name === 'NotFoundError') {
    const e = new NotFoundError('');
    e.message = error.message;
    return e;
  }
  const e = new Error(error.message);
  e.name = error.name;
  return e;
}
