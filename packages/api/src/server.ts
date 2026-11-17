import type { GardenService } from '@arku/domain';
import { CUSTOMER_METHODS, type ArkuRequest } from './protocol';

export interface SessionUser {
  /** auth.users.id: también es el id del cliente. */
  id: string;
  /** Celular verificado por SMS, como lo guarda Supabase Auth (p. ej. "593991234567"). */
  phone: string | undefined;
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ForbiddenError';
  }
}

/** "593991234567" o "+593 99 123 4567" → "0991234567". */
export function localPhone(phone: string | undefined) {
  const digits = (phone ?? '').replace(/\D/g, '');
  return digits.startsWith('593') ? `0${digits.slice(3)}` : digits;
}

const CUSTOMER_SET = new Set<string>(CUSTOMER_METHODS);
const KEY_PATTERN = /^[0-9a-f-]{36}\/[A-Za-z0-9._-]{1,80}$/;

/** Las fotos solo pueden venir de la carpeta privada del propio cliente en el bucket. */
function assertOwnKeys(user: SessionUser, keys: unknown) {
  if (keys === undefined) return;
  if (!Array.isArray(keys)) throw new ForbiddenError('Fotos inválidas.');
  for (const key of keys) {
    if (typeof key !== 'string' || !KEY_PATTERN.test(key) || !key.startsWith(`${user.id}/`)) {
      throw new ForbiddenError('Esa foto no pertenece a tu cuenta.');
    }
  }
}

/**
 * Ejecuta un caso de uso en nombre del usuario de la sesión. Nunca confía en el
 * cliente, el celular ni las fotos que manda la app: los toma de la sesión.
 */
export async function handleArkuCall(service: GardenService, user: SessionUser, request: ArkuRequest): Promise<unknown> {
  const { method } = request;
  const args = Array.isArray(request.args) ? [...request.args] : [];

  if (method === 'checkCoverage') return service.checkCoverage(args[0] as never);
  if (method === 'registerCustomer') {
    if (!user.phone) throw new ForbiddenError('Verifica tu celular antes de registrarte.');
    if (await service.getCustomer(user.id)) throw new ForbiddenError('Ya tienes una cuenta registrada.');
    return service.registerCustomer(localPhone(user.phone), args[1] as never, user.id);
  }
  if (method === 'completeReview') throw new ForbiddenError('Solo Arku puede terminar una revisión.');
  if (!CUSTOMER_SET.has(method)) throw new ForbiddenError('Operación no permitida.');

  args[0] = user.id;
  if (method === 'addPhoto') assertOwnKeys(user, [args[2]]);
  if (method === 'registerGarden') assertOwnKeys(user, (args[1] as { photoKeys?: unknown } | undefined)?.photoKeys ?? []);
  if (method === 'editGarden') assertOwnKeys(user, (args[2] as { addPhotoKeys?: unknown } | undefined)?.addPhotoKeys);

  const fn = service[method] as (...a: unknown[]) => Promise<unknown>;
  return fn.apply(service, args);
}
