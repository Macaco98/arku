import { FIXTURE_COVERAGE_ZONES, type Address, type Garden } from '@arku/domain';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useCustomer, useServices } from './index';

export type ListStatus = 'loading' | 'ready' | 'error';

/** "Cumbayá · Av. Interoceánica km 12" */
export function describeAddress(address: Address | undefined) {
  if (!address) return 'Dirección no disponible';
  const zone = FIXTURE_COVERAGE_ZONES.find((z) => z.id === address.coverageZoneId);
  return zone ? `${zone.name} · ${address.line}` : address.line;
}

/** Jardines y direcciones del cliente, recargados cada vez que la pantalla vuelve a verse. */
export function useGardenList() {
  const { gardens: service } = useServices();
  const customer = useCustomer();
  const [status, setStatus] = useState<ListStatus>('loading');
  const [gardens, setGardens] = useState<Garden[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);

  const load = useCallback(async () => {
    setStatus((s) => (s === 'ready' ? s : 'loading'));
    try {
      const [g, a] = await Promise.all([service.listGardens(customer.id), service.listAddresses(customer.id)]);
      setGardens(g);
      setAddresses(a);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [service, customer.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const retry = useCallback(() => {
    setStatus('loading');
    load();
  }, [load]);

  const locationOf = useCallback(
    (garden: Garden) => describeAddress(addresses.find((a) => a.id === garden.addressId)),
    [addresses],
  );

  return { status, gardens, addresses, locationOf, retry };
}
