import type { GardenApi } from '@arku/api';
import type { Customer, CustomerProfileInput } from '@arku/domain';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createAuth, type AuthService, type AuthSession } from './auth';
import { backend, createGardens, supabase } from './backend';
import { setPhotoOwner } from './photos';

interface ServicesValue {
  gardens: GardenApi;
  auth: AuthService;
  /** 'demo' = datos de prueba en el dispositivo; 'supabase' = backend real. */
  backend: typeof backend;
  /** 'loading' mientras se lee la sesión guardada. */
  sessionStatus: 'loading' | 'ready';
  /** Celular verificado por SMS (A02), aunque todavía no complete sus datos (A03). */
  session: AuthSession | null;
  customer: Customer | null;
  /** A02: abre la sesión y devuelve el cliente si ya estaba registrado. */
  verifyCode: (phone: string, code: string) => Promise<Customer | null>;
  /** A03: registra nombre, apellido y cédula del celular verificado. */
  completeProfile: (profile: CustomerProfileInput) => Promise<Customer>;
  /** Actualiza el cliente de la sesión, p. ej. después de editar Datos personales. */
  updateCustomer: (c: Customer) => void;
  signOut: () => Promise<void>;
}

const ServicesContext = createContext<ServicesValue | null>(null);

export function ServicesProvider({ children }: { children: ReactNode }) {
  const gardens = useMemo(createGardens, []);
  const auth = useMemo(createAuth, []);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [sessionStatus, setSessionStatus] = useState<'loading' | 'ready'>('loading');

  const openSession = useCallback(
    async (s: AuthSession) => {
      setPhotoOwner(s.userId);
      setSession(s);
      const c = (await gardens.getCustomer(s.userId)) ?? null;
      setCustomer(c);
      return c;
    },
    [gardens],
  );

  useEffect(() => {
    (async () => {
      try {
        const s = await auth.restore();
        if (s) await openSession(s);
      } catch {
        // Sin conexión o sesión vencida: se pide ingresar de nuevo.
      } finally {
        setSessionStatus('ready');
      }
    })();
  }, [auth, openSession]);

  // Si Supabase cierra la sesión (token vencido o revocado), la app vuelve a A00.
  useEffect(() => {
    if (!supabase) return;
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setCustomer(null);
        setPhotoOwner(null);
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const verifyCode = useCallback(async (phone: string, code: string) => openSession(await auth.verifyCode(phone, code)), [auth, openSession]);

  const completeProfile = useCallback(
    async (profile: CustomerProfileInput) => {
      if (!session) throw new Error('Verifica tu celular primero.');
      const c = await gardens.registerCustomer(session.phone, profile, session.userId);
      setCustomer(c);
      return c;
    },
    [gardens, session],
  );

  const signOut = useCallback(async () => {
    await auth.signOut();
    setPhotoOwner(null);
    setSession(null);
    setCustomer(null);
  }, [auth]);

  const value = useMemo(
    () => ({ gardens, auth, backend, sessionStatus, session, customer, verifyCode, completeProfile, updateCustomer: setCustomer, signOut }),
    [gardens, auth, sessionStatus, session, customer, verifyCode, completeProfile, signOut],
  );
  return <ServicesContext.Provider value={value}>{children}</ServicesContext.Provider>;
}

export function useServices() {
  const value = useContext(ServicesContext);
  if (!value) throw new Error('useServices debe usarse dentro de ServicesProvider');
  return value;
}

/** Cliente con sesión iniciada. Solo para pantallas detrás del registro. */
export function useCustomer(): Customer {
  const { customer } = useServices();
  if (!customer) throw new Error('No hay un cliente con sesión iniciada');
  return customer;
}

export function initialsOf(c: Pick<Customer, 'firstName' | 'lastName'>) {
  return `${c.firstName.charAt(0)}${c.lastName.charAt(0)}`.toUpperCase();
}
