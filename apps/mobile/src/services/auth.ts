import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './backend';

/** Sesión verificada por SMS. El celular va como 09XXXXXXXX. */
export interface AuthSession {
  userId: string;
  phone: string;
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export interface AuthService {
  restore(): Promise<AuthSession | null>;
  /** A01: envía el código por SMS. */
  sendCode(phone: string): Promise<void>;
  /** A02: verifica el código y abre la sesión. */
  verifyCode(phone: string, code: string): Promise<AuthSession>;
  signOut(): Promise<void>;
}

/** Código fijo del modo demostración (no se envía ningún SMS). */
export const DEMO_CODE = '123456';
export const CODE_LENGTH = 6;

/** "0991234567" → "+593991234567" (E.164, como lo pide Supabase). */
export const toE164 = (phone: string) => `+593${phone.replace(/\D/g, '').replace(/^0/, '')}`;
/** "593991234567" → "0991234567". */
export const fromE164 = (phone: string | undefined) => {
  const digits = (phone ?? '').replace(/\D/g, '');
  return digits.startsWith('593') ? `0${digits.slice(3)}` : digits;
};

const DEMO_SESSION_KEY = 'arku.dev.v1.auth';

/** MOCK de desarrollo: sin SMS; el código es siempre 123456 y la sesión vive en el dispositivo. */
const demoAuth: AuthService = {
  async restore() {
    const raw = await AsyncStorage.getItem(DEMO_SESSION_KEY);
    try {
      return raw ? (JSON.parse(raw) as AuthSession) : null;
    } catch {
      return null;
    }
  },
  async sendCode() {
    await new Promise((r) => setTimeout(r, 400));
  },
  async verifyCode(phone, code) {
    await new Promise((r) => setTimeout(r, 400));
    if (code !== DEMO_CODE) throw new AuthError('El código no es correcto. Revisa el SMS e inténtalo de nuevo.');
    const session = { userId: `demo-${phone}`, phone };
    await AsyncStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session));
    return session;
  },
  async signOut() {
    await AsyncStorage.setItem(DEMO_SESSION_KEY, '');
  },
};

function friendly(error: { message?: string; status?: number; code?: string }) {
  const text = `${error.code ?? ''} ${error.message ?? ''}`.toLowerCase();
  if (error.status === 429 || text.includes('rate')) return 'Pediste muchos códigos seguidos. Espera un momento e inténtalo de nuevo.';
  if (text.includes('expired') || text.includes('invalid') || text.includes('otp')) return 'El código no es correcto o ya venció. Pide uno nuevo.';
  if (text.includes('fetch') || text.includes('network')) return 'Revisa tu conexión e inténtalo de nuevo.';
  return 'No pudimos verificar tu celular. Inténtalo de nuevo.';
}

export function createAuth(): AuthService {
  const client = supabase;
  if (!client) return demoAuth;
  return {
    async restore() {
      const { data } = await client.auth.getSession();
      const user = data.session?.user;
      return user ? { userId: user.id, phone: fromE164(user.phone) } : null;
    },
    async sendCode(phone) {
      const { error } = await client.auth.signInWithOtp({ phone: toE164(phone) });
      if (error) throw new AuthError(friendly(error));
    },
    async verifyCode(phone, code) {
      const { data, error } = await client.auth.verifyOtp({ phone: toE164(phone), token: code, type: 'sms' });
      if (error || !data.user) throw new AuthError(friendly(error ?? {}));
      return { userId: data.user.id, phone: fromE164(data.user.phone) || phone };
    },
    async signOut() {
      await client.auth.signOut();
    },
  };
}
