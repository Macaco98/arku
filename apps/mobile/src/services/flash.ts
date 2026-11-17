/**
 * Aviso breve para la siguiente pantalla que se muestre (p. ej. "Cambios guardados"
 * al volver de D02 a D01). Se lee una sola vez.
 */
let pending: string | undefined;

export function setFlash(message: string) {
  pending = message;
}

export function takeFlash() {
  const message = pending;
  pending = undefined;
  return message;
}
