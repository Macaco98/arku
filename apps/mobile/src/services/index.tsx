import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createDevRepositories,
  DEMO_PRICING,
  FixtureCoverageService,
  GardenService,
  type Customer,
} from '@arku/domain';
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

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

interface ServicesValue {
  gardens: GardenService;
  customer: Customer | null;
  setCustomer: (c: Customer | null) => void;
}

const ServicesContext = createContext<ServicesValue | null>(null);

export function ServicesProvider({ children }: { children: ReactNode }) {
  const gardens = useMemo(createDevServices, []);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const value = useMemo(() => ({ gardens, customer, setCustomer }), [gardens, customer]);
  return <ServicesContext.Provider value={value}>{children}</ServicesContext.Provider>;
}

export function useServices() {
  const value = useContext(ServicesContext);
  if (!value) throw new Error('useServices debe usarse dentro de ServicesProvider');
  return value;
}
