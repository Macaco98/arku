import { describe, expect, it } from 'vitest';
import {
  createDevRepositories,
  DEMO_PRICING,
  FixtureCoverageService,
  GardenService,
  MemoryStorage,
  OutOfCoverageError,
  type KeyValueStorage,
} from '../src';

function makeService(storage: KeyValueStorage, start = '2026-11-09T12:00:00.000Z') {
  let counter = 0;
  let clock = new Date(start).getTime();
  const service = new GardenService({
    repos: createDevRepositories(storage),
    coverage: new FixtureCoverageService(),
    pricing: DEMO_PRICING,
    newId: () => `id-${++counter}-${Math.random().toString(36).slice(2, 6)}`,
    now: () => new Date(clock),
  });
  return { service, advance: (ms: number) => (clock += ms) };
}

const CUMBAYA = { lat: -0.2, lng: -78.43 };

describe('flujo crear → guardar → reutilizar', () => {
  it('registra cliente, guarda varios jardines en una dirección y los recupera en otra sesión', async () => {
    const storage = new MemoryStorage();
    const { service } = makeService(storage);

    const customer = await service.registerCustomer('099 123 4567', {
      firstName: 'Ana',
      lastName: 'Pérez',
      idNumber: '1712345675',
    });
    expect(customer.phone).toBe('0991234567');

    const casa = await service.addAddress(customer.id, { label: 'Casa', line: 'Av. Interoceánica km 12', coordinates: CUMBAYA });
    const frontal = await service.createGarden(customer.id, { name: 'Casa Cumbayá', addressId: casa.id, sizeBand: 'M' });
    await service.createGarden(customer.id, { name: 'Casa Cumbayá · Posterior', addressId: casa.id, sizeBand: 'S' });

    // Nueva "sesión": mismo almacenamiento, nuevas instancias.
    const { service: later } = makeService(storage);
    const gardens = await later.listGardens(customer.id);
    expect(gardens.map((g) => g.name).sort()).toEqual(['Casa Cumbayá', 'Casa Cumbayá · Posterior']);

    // Reutilizar sin volver a registrar.
    const quote = await later.requestQuote(customer.id, frontal.id);
    expect(quote).toMatchObject({ status: 'automatic', price: { baseCents: 3500, isDemo: true } });
  });

  it('rechaza la cédula inválida en el registro', async () => {
    const { service } = makeService(new MemoryStorage());
    await expect(
      service.registerCustomer('0991234567', { firstName: 'Ana', lastName: 'Pérez', idNumber: '1712345674' }),
    ).rejects.toThrow('Esta cédula no es válida');
  });

  it('no guarda direcciones fuera de cobertura', async () => {
    const { service } = makeService(new MemoryStorage());
    await expect(
      service.addAddress('c1', { label: 'Otra', line: 'Centro histórico, Quito', coordinates: { lat: -0.22, lng: -78.51 } }),
    ).rejects.toBeInstanceOf(OutOfCoverageError);
  });
});

describe('edición de jardines', () => {
  it('guarda sin fotos en cualquier tamaño, y L pasa a automática al agregar una foto', async () => {
    const { service } = makeService(new MemoryStorage());
    const casa = await service.addAddress('c1', { label: 'Casa', line: 'Calle Eugenio Espejo', coordinates: CUMBAYA });
    for (const sizeBand of ['S', 'M', 'L', 'XL'] as const) {
      await expect(service.createGarden('c1', { name: `Jardín ${sizeBand}`, addressId: casa.id, sizeBand })).resolves.toBeDefined();
    }
    const l = (await service.listGardens('c1')).find((g) => g.sizeBand === 'L')!;
    expect((await service.requestQuote('c1', l.id)).status).toBe('pending_review');

    const withPhoto = await service.addPhoto('c1', l.id, 'private/c1/l/1.jpg');
    expect((await service.requestQuote('c1', withPhoto.id)).status).toBe('automatic');

    const withoutPhoto = await service.removePhoto('c1', l.id, withPhoto.photos[0]!.id);
    expect(withoutPhoto.photos).toHaveLength(0);
  });

  it('editar un jardín no cambia cotizaciones existentes', async () => {
    const { service, advance } = makeService(new MemoryStorage());
    const casa = await service.addAddress('c1', { label: 'Casa', line: 'Av. Interoceánica km 12', coordinates: CUMBAYA });
    const garden = await service.createGarden('c1', { name: 'Casa Cumbayá', addressId: casa.id, sizeBand: 'M', accessNotes: 'Timbre negro' });
    const before = await service.requestQuote('c1', garden.id);

    advance(60_000);
    await service.updateGarden('c1', garden.id, { name: 'Jardín frontal', sizeBand: 'S', accessNotes: 'Portón verde' });
    const after = await service.requestQuote('c1', garden.id);

    const history = await service.listQuotes('c1', garden.id);
    const frozen = history.find((q) => q.id === before.id)!;
    expect(frozen.snapshot).toEqual({ gardenName: 'Casa Cumbayá', addressLine: 'Av. Interoceánica km 12', sizeBand: 'M', photoCount: 0, accessNotes: 'Timbre negro' });
    expect(frozen.price?.baseCents).toBe(3500);
    expect(after.snapshot.sizeBand).toBe('S');
    expect(after.price?.baseCents).toBe(2500);
  });

  it('un cliente no puede leer ni editar jardines de otro', async () => {
    const { service } = makeService(new MemoryStorage());
    const casa = await service.addAddress('c1', { label: 'Casa', line: 'Av. Interoceánica km 12', coordinates: CUMBAYA });
    const garden = await service.createGarden('c1', { name: 'Casa Cumbayá', addressId: casa.id, sizeBand: 'M' });
    await expect(service.updateGarden('c2', garden.id, { name: 'Ajeno' })).rejects.toThrow('no encontrado');
    await expect(service.requestQuote('c2', garden.id)).rejects.toThrow('no encontrado');
  });
});
