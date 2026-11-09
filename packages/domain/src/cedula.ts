/**
 * Validación de cédula de ciudadanía ecuatoriana.
 * Reglas: 10 dígitos; provincia 01–24 (o 30 para ecuatorianos en el exterior);
 * tercer dígito menor que 6; dígito verificador por módulo 10.
 */
export type CedulaStatus = 'empty' | 'incomplete' | 'invalid' | 'valid';

export interface CedulaResult {
  status: CedulaStatus;
  /** Solo los dígitos, como los escribió el usuario. */
  digits: string;
  /** Mensaje para el campo, en español de Ecuador. Vacío cuando no hace falta. */
  message: string;
}

const COEFFICIENTS = [2, 1, 2, 1, 2, 1, 2, 1, 2];

export function cedulaChecksumOk(digits: string): boolean {
  if (!/^\d{10}$/.test(digits)) return false;
  const sum = COEFFICIENTS.reduce((acc, coef, i) => {
    const product = Number(digits[i]) * coef;
    return acc + (product > 9 ? product - 9 : product);
  }, 0);
  const check = (10 - (sum % 10)) % 10;
  return check === Number(digits[9]);
}

export function validateCedula(input: string): CedulaResult {
  const digits = input.replace(/\D/g, '');
  if (digits.length === 0) return { status: 'empty', digits, message: '' };
  if (digits.length < 10) {
    const missing = 10 - digits.length;
    return {
      status: 'incomplete',
      digits,
      message: `Faltan ${missing} ${missing === 1 ? 'dígito' : 'dígitos'}. La cédula tiene 10.`,
    };
  }
  const province = Number(digits.slice(0, 2));
  const third = Number(digits[2]);
  const provinceOk = (province >= 1 && province <= 24) || province === 30;
  if (digits.length > 10 || !provinceOk || third >= 6 || !cedulaChecksumOk(digits)) {
    return { status: 'invalid', digits, message: 'Esta cédula no es válida. Revisa los números.' };
  }
  return { status: 'valid', digits, message: 'Cédula válida' };
}

export const isValidCedula = (input: string) => validateCedula(input).status === 'valid';
