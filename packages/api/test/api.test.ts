import {
  createDevRepositories,
  DEMO_PRICING,
  FixtureCoverageService,
  GardenService,
  MemoryStorage,
  OutOfCoverageError,
  type Address,
  type Garden,
  type Quote,
} from '@arku/domain';
import { describe, expect, it } from 'vitest';
import { createRemoteGardenService } from '../src/client';
import { serializeError, type ArkuResponse } from '../src/protocol';
import { addressMapper, customerMapper, gardenMapper, quoteMapper } from '../src/rows';
import { handleArkuCall, localPhone, type SessionUser } from '../src/server';

const ANA = '11111111-1111-4111-8111-111111111111';
const LUIS = '22222222-2222-4222-8222-222222222222';
const CUMBAYA = { lat: -0.2, lng: -78.43 };

function makeService() {
  let n = 0;
  return new GardenService({
    repos: createDevRepositories(new MemoryStorage()),
    coverage: new FixtureCoverageService(),
    pricing: DEMO_PRICING,
    newId: () => `0000000${++n}-0000-4000-8000-000000000000`.slice(-36),
    now: () => new Date('2026-11-17T12:00:00.000Z'),
  });
}

/** La app hablando con la función, pasando por JSON como en la red. */
function remoteFor(service: GardenService, user: SessionUser) {
  return createRemoteGardenService(async (method, args) => {
    let body: ArkuResponse;
    try {
      body = { ok: true, result: (await handleArkuCall(service, user, JSON.parse(JSON.stringify({ method, args })))) ?? null };
    } catch (e) {
      body = { ok: false, error: serializeError(e) };
    }
    return JSON.parse(JSON.stringify(body)) as ArkuResponse;
  });
}

describe('filas de Postgres', () => {
  it('ida y vuelta sin perder datos', () => {
    const address: Address = {
      id: 'a1',
      customerId: ANA,
      label: 'Casa',
      line: 'Av. Interoceánica km 12',
      arrivalInstructions: 'Tocar timbre',
      coordinates: CUMBAYA,
      coverageZoneId: 'cumbaya',
      createdAt: '2026-11-17T12:00:00.000Z',
    };
    expect(addressMapper.fromRow(addressMapper.toRow(address))).toEqual(address);
    expect(addressMapper.toRow(address).reference).toBeNull();

    const garden: Garden = {
      id: 'g1',
      customerId: ANA,
      name: 'Frontal',
      addressId: 'a1',
      sizeBand: 'L',
      accessNotes: '',
      photos: [
        { id: 'p2', gardenId: 'g1', storageKey: `${ANA}/b.jpg`, createdAt: '2026-11-17T12:00:02.000Z' },
        { id: 'p1', gardenId: 'g1', storageKey: `${ANA}/a.jpg`, createdAt: '2026-11-17T12:00:01.000Z' },
      ],
      createdAt: '2026-11-17T12:00:00.000Z',
      updatedAt: '2026-11-17T12:00:02.000Z',
    };
    const row = { ...gardenMapper.toRow(garden), garden_photos: [] as never[] };
    expect(gardenMapper.fromRow(row).photos).toEqual([]);

    const quote: Quote = {
      id: 'q1',
      gardenId: 'g1',
      customerId: ANA,
      route: 'automatic',
      status: 'automatic',
      snapshot: { gardenName: 'Frontal', addressLine: 'x', sizeBand: 'M', photoCount: 0, accessNotes: '', arrivalInstructions: '' },
      price: { tariffCents: 2500, minimumCents: 2000, baseCents: 2500, pricingVersion: 'demo', isDemo: true },
      createdAt: '2026-11-17T12:00:00.000Z',
      expiresAt: '2026-11-20T12:00:00.000Z',
    };
    expect(quoteMapper.fromRow(quoteMapper.toRow(quote))).toEqual(quote);
    // Postgres devuelve otro formato de fecha.
    expect(
      customerMapper.fromRow({ id: ANA, phone: '0991234567', first_name: 'Ana', last_name: 'Pérez', id_number: '1710034065', created_at: '2026-11-17 12:00:00+00' })
        .createdAt,
    ).toBe('2026-11-17T12:00:00.000Z');
  });
});

describe('función arku', () => {
  it('registra con el celular verificado de la sesión, no con el que manda la app', async () => {
    const service = makeService();
    const app = remoteFor(service, { id: ANA, phone: '593991234567' });
    const customer = await app.registerCustomer('0990000000', { firstName: 'Ana', lastName: 'Pérez', idNumber: '1710034065' });
    expect(customer).toMatchObject({ id: ANA, phone: '0991234567' });
    await expect(app.registerCustomer('0990000000', { firstName: 'Ana', lastName: 'Pérez', idNumber: '1710034065' })).rejects.toThrow('Ya tienes');
    expect(localPhone('+593 99 123 4567')).toBe('0991234567');
  });

  it('cada cliente solo ve y edita lo suyo, aunque mande otro id', async () => {
    const service = makeService();
    const ana = remoteFor(service, { id: ANA, phone: '593991234567' });
    const luis = remoteFor(service, { id: LUIS, phone: '593997654321' });
    const casa = await ana.addAddress('cualquiera', { label: 'Casa', line: 'Av. Interoceánica km 12', coordinates: CUMBAYA });
    expect(casa.customerId).toBe(ANA);
    const garden = await ana.createGarden(LUIS, { name: 'Frontal', addressId: casa.id, sizeBand: 'M' });
    expect(garden.customerId).toBe(ANA);
    expect(await luis.listGardens(ANA)).toEqual([]);
    await expect(luis.getGarden(ANA, garden.id)).rejects.toThrow('no encontrado');
    await expect(luis.requestQuote(LUIS, garden.id)).rejects.toThrow('no encontrado');
  });

  it('rechaza fotos que no están en la carpeta del cliente', async () => {
    const service = makeService();
    const ana = remoteFor(service, { id: ANA, phone: '593991234567' });
    const casa = await ana.addAddress(ANA, { label: 'Casa', line: 'Av. Interoceánica km 12', coordinates: CUMBAYA });
    const garden = await ana.createGarden(ANA, { name: 'Frontal', addressId: casa.id, sizeBand: 'L' });
    await expect(ana.addPhoto(ANA, garden.id, `${LUIS}/ajena.jpg`)).rejects.toThrow('no pertenece');
    await expect(ana.editGarden(ANA, garden.id, { addPhotoKeys: ['jardines/x.jpg'] })).rejects.toThrow('no pertenece');
    await expect(
      ana.registerGarden(ANA, { address: { addressId: casa.id }, garden: { name: 'Otro', sizeBand: 'S' }, photoKeys: [`${ANA}/../${LUIS}/x.jpg`] }),
    ).rejects.toThrow('no pertenece');
    const withPhoto = await ana.addPhoto(ANA, garden.id, `${ANA}/foto-1.jpg`);
    expect(withPhoto.photos).toHaveLength(1);
    expect((await ana.requestQuote(ANA, garden.id)).route).toBe('automatic');
  });

  it('mantiene los errores del dominio y no deja terminar revisiones', async () => {
    const service = makeService();
    const ana = remoteFor(service, { id: ANA, phone: '593991234567' });
    const outside = ana.addAddress(ANA, { label: 'Casa', line: 'Av. Amazonas 100', coordinates: { lat: -0.18, lng: -78.48 } });
    await expect(outside).rejects.toBeInstanceOf(OutOfCoverageError);
    await expect(ana.addAddress(ANA, { label: 'Casa', line: 'x', coordinates: CUMBAYA })).rejects.toThrow('Escribe la dirección.');
    await expect(ana.completeReview('q', 5000)).rejects.toThrow('Solo Arku');
    expect(await ana.latestQuote(ANA, 'nada')).toBeUndefined();
    expect((await ana.checkCoverage(CUMBAYA)).covered).toBe(true);
  });
});
