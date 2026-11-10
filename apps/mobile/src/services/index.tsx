import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createDevRepositories,
  DEMO_PRICING,
  FixtureCoverageService,
  GardenService,
  type Customer,
} from '@arku/domain';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

/**
 * MOCK DE DESARROLLO. Los datos viven en AsyncStorage del dispositivo,
 * la cobertura usa fixtures y los precios son de demostración.
 * Para producción se reemplaza esta fábrica por repositorios con backend.
 */
function createDevServices() {
  let seq = 0;
  return new GardenService({
    repos: createDevRepositories(AsyncStorage),
    coverage: new FixtureCoverageService(),
    pricing: DEMO_PRICING,
    newId: () => `${Date.now().toString(36)}-${(seq++).toString(36)}`,
    now: () => new Date(),
  });
}

/** Sesión de desarrollo: recuerda qué cliente está usando la app en este dispositivo. */
const SESSION_KEY = 'arku.dev.v1.session';

interface ServicesValue {
  gardens: GardenService;
  /** 'loading' mientras se lee la sesión guardada. */
  sessionStatus: 'loading' | 'ready';
  customer: Customer | null;
  signIn: (c: Customer) => Promise<void>;
  signOut: () => Promise<void>;
}

const ServicesContext = createContext<ServicesValue | null>(null);

export function ServicesProvider({ children }: { children: ReactNode }) {
  const gardens = useMemo(createDevServices, []);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [sessionStatus, setSessionStatus] = useState<'loading' | 'ready'>('loading');

  useEffect(() => {
    (async () => {
      try {
        const id = await AsyncStorage.getItem(SESSION_KEY);
        if (id) setCustomer((await gardens.getCustomer(id)) ?? null);
      } finally {
        setSessionStatus('ready');
      }
    })();
  }, [gardens]);

  const signIn = useCallback(async (c: Customer) => {
    await AsyncStorage.setItem(SESSION_KEY, c.id);
    setCustomer(c);
  }, []);

  const signOut = useCallback(async () => {
    await AsyncStorage.setItem(SESSION_KEY, '');
    setCustomer(null);
  }, []);

  const value = useMemo(
    () => ({ gardens, sessionStatus, customer, signIn, signOut }),
    [gardens, sessionStatus, customer, signIn, signOut],
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
