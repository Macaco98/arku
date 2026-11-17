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

describe('registrar jardín (S03–S06)', () => {
  it('crea dirección nueva con indicaciones al llegar, jardín y fotos en un solo paso', async () => {
    const { service } = makeService(new MemoryStorage());
    const garden = await service.registerGarden('c1', {
      address: { label: 'Casa', line: 'Av. Interoceánica km 12', reference: 'Portón negro', arrivalInstructions: 'Avisar al guardia', coordinates: CUMBAYA },
      garden: { name: 'Casa Cumbayá', sizeBand: 'L', accessNotes: 'Perro amigable' },
      photoKeys: ['k1', 'k2'],
    });
    expect(garden.photos).toHaveLength(2);
    const [address] = await service.listAddresses('c1');
    expect(address).toMatchObject({ arrivalInstructions: 'Avisar al guardia', coverageZoneId: 'zone-cumbaya' });
    const quote = await service.requestQuote('c1', garden.id);
    expect(quote.status).toBe('automatic');
    expect(quote.snapshot.arrivalInstructions).toBe('Avisar al guardia');
  });

  it('reutiliza una dirección guardada para un segundo jardín', async () => {
    const { service } = makeService(new MemoryStorage());
    const casa = await service.addAddress('c1', { label: 'Casa', line: 'Av. Interoceánica km 12', coordinates: CUMBAYA });
    await service.registerGarden('c1', { address: { addressId: casa.id }, garden: { name: 'Posterior', sizeBand: 'S' }, photoKeys: [] });
    expect(await service.listAddresses('c1')).toHaveLength(1);
    expect(await service.listGardens('c1')).toHaveLength(1);
  });

  it('no registra fuera de cobertura ni con la dirección de otro cliente', async () => {
    const { service } = makeService(new MemoryStorage());
    await expect(
      service.registerGarden('c1', { address: { label: 'Otra', line: 'San Rafael', coordinates: { lat: -0.3, lng: -78.45 } }, garden: { name: 'Jardín X', sizeBand: 'S' }, photoKeys: [] }),
    ).rejects.toBeInstanceOf(OutOfCoverageError);
    const ajena = await service.addAddress('c2', { label: 'Casa', line: 'Av. Interoceánica km 12', coordinates: CUMBAYA });
    await expect(
      service.registerGarden('c1', { address: { addressId: ajena.id }, garden: { name: 'Jardín X', sizeBand: 'S' }, photoKeys: [] }),
    ).rejects.toThrow('no encontrado');
  });

  it('avisa la cobertura en vivo', async () => {
    const { service } = makeService(new MemoryStorage());
    expect(await service.checkCoverage(CUMBAYA)).toMatchObject({ covered: true, zone: { name: 'Cumbayá' } });
    expect(await service.checkCoverage({ lat: -0.3, lng: -78.45 })).toEqual({ covered: false });
  });
});

describe('lista de jardines', () => {
  it('muestra primero el jardín más reciente y recupera al cliente', async () => {
    const { service, advance } = makeService(new MemoryStorage());
    const customer = await service.registerCustomer('0991234567', { firstName: 'Ana', lastName: 'Pérez', idNumber: '1712345675' });
    const casa = await service.addAddress(customer.id, { label: 'Casa', line: 'Av. Interoceánica km 12', coordinates: CUMBAYA });
    await service.createGarden(customer.id, { name: 'Primero', addressId: casa.id, sizeBand: 'S' });
    advance(1000);
    await service.createGarden(customer.id, { name: 'Segundo', addressId: casa.id, sizeBand: 'M' });
    expect((await service.listGardens(customer.id)).map((g) => g.name)).toEqual(['Segundo', 'Primero']);
    expect(await service.getCustomer(customer.id)).toMatchObject({ firstName: 'Ana' });
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
    expect(frozen.snapshot).toEqual({ gardenName: 'Casa Cumbayá', addressLine: 'Av. Interoceánica km 12', sizeBand: 'M', photoCount: 0, accessNotes: 'Timbre negro', arrivalInstructions: '' });
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

describe('cotización (S07/S08)', () => {
  const HOUR = 3_600_000;
  async function gardenWith(size: 'M' | 'L' | 'XL', photos: string[] = []) {
    const ctx = makeService(new MemoryStorage());
    const garden = await ctx.service.registerGarden('c1', {
      address: { label: 'Casa', line: 'Av. Interoceánica km 12', coordinates: CUMBAYA },
      garden: { name: 'Casa Cumbayá', sizeBand: size },
      photoKeys: photos,
    });
    return { ...ctx, garden };
  }

  it('acepta un precio automático vigente y lo deja registrado', async () => {
    const { service, garden } = await gardenWith('M');
    const quote = await service.requestQuote('c1', garden.id);
    const accepted = await service.respondToQuote('c1', quote.id, 'accepted');
    expect(accepted.status).toBe('accepted');
    expect(accepted.respondedAt).toBeDefined();
    expect((await service.latestQuote('c1', garden.id))?.id).toBe(quote.id);
  });

  it('no deja aceptar una cotización en revisión ni una vencida', async () => {
    const { service, garden, advance } = await gardenWith('XL');
    const pending = await service.requestQuote('c1', garden.id);
    await expect(service.respondToQuote('c1', pending.id, 'accepted')).rejects.toThrow('todavía no tiene un precio');
    const ready = await service.completeReview(pending.id, 6000);
    expect(ready).toMatchObject({ status: 'ready', price: { baseCents: 6000 } });
    advance(73 * HOUR);
    expect((await service.getQuote('c1', pending.id)).status).toBe('expired');
    await expect(service.respondToQuote('c1', pending.id, 'accepted')).rejects.toThrow('ya no está vigente');
  });

  it('L sin fotos pasa a precio inmediato al agregar una foto y volver a cotizar', async () => {
    const { service, garden } = await gardenWith('L');
    expect((await service.requestQuote('c1', garden.id)).status).toBe('pending_review');
    await service.addPhoto('c1', garden.id, 'jardines/k1.jpg');
    const again = await service.requestQuote('c1', garden.id);
    expect(again).toMatchObject({ status: 'automatic', price: { baseCents: 5000 } });
    expect((await service.latestQuote('c1', garden.id))?.id).toBe(again.id);
  });

  it('no muestra cotizaciones de otro cliente', async () => {
    const { service, garden } = await gardenWith('M');
    const quote = await service.requestQuote('c1', garden.id);
    await expect(service.getQuote('c2', quote.id)).rejects.toThrow('no encontrado');
  });
});

describe('editar jardín (D02)', () => {
  async function setup() {
    const ctx = makeService(new MemoryStorage());
    const garden = await ctx.service.registerGarden('c1', {
      address: { label: 'Casa', line: 'Av. Interoceánica km 12', coordinates: CUMBAYA },
      garden: { name: 'Casa Cumbayá', sizeBand: 'M', accessNotes: 'Perro' },
      photoKeys: ['a', 'b'],
    });
    return { ...ctx, garden };
  }

  it('guarda nombre, tamaño, notas y fotos sin tocar la cotización existente', async () => {
    const { service, garden } = await setup();
    const quote = await service.requestQuote('c1', garden.id);
    const edited = await service.editGarden('c1', garden.id, {
      name: 'Jardín frontal',
      sizeBand: 'L',
      accessNotes: '  Sin perro  ',
      removePhotoIds: [garden.photos[0]!.id],
      addPhotoKeys: ['c', 'd'],
    });
    expect(edited).toMatchObject({ name: 'Jardín frontal', sizeBand: 'L', accessNotes: 'Sin perro' });
    expect(edited.photos.map((p) => p.storageKey)).toEqual(['b', 'c', 'd']);
    const old = await service.getQuote('c1', quote.id);
    expect(old.snapshot).toMatchObject({ gardenName: 'Casa Cumbayá', sizeBand: 'M', photoCount: 2 });
  });

  it('no pasa de 6 fotos ni edita jardines de otro cliente', async () => {
    const { service, garden } = await setup();
    await expect(service.editGarden('c1', garden.id, { addPhotoKeys: ['1', '2', '3', '4', '5'] })).rejects.toThrow('hasta 6 fotos');
    await expect(service.editGarden('c2', garden.id, { name: 'Otro' })).rejects.toThrow('no encontrado');
  });
});
