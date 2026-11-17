import { DEMO_PRICING, FixtureCoverageService, GardenService } from '@arku/domain';
import { createClient } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';
import { createSupabaseRepositories } from '../src/supabase-repositories';
import { createFakePostgrest } from './fake-postgrest';

const ANA = '11111111-1111-4111-8111-111111111111';
const CUMBAYA = { lat: -0.2, lng: -78.43 };

function setup() {
  const pg = createFakePostgrest();
  const db = createClient('http://localhost:54321', 'clave-de-prueba', {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: pg.fetch as typeof fetch },
  });
  let n = 0;
  const service = new GardenService({
    repos: createSupabaseRepositories(db),
    coverage: new FixtureCoverageService(),
    pricing: DEMO_PRICING,
    newId: () => `00000000-0000-4000-8000-${String(++n).padStart(12, '0')}`,
    now: () => new Date(Date.UTC(2026, 10, 17, 12, 0, n)),
  });
  return { pg, service };
}

describe('repositorios de Supabase', () => {
  it('guardan y leen el flujo completo con filas de Postgres', async () => {
    const { pg, service } = setup();
    await service.registerCustomer('0991234567', { firstName: 'Ana', lastName: 'Pérez', idNumber: '1710034065' }, ANA);
    expect(pg.tables.customers![0]).toMatchObject({ id: ANA, first_name: 'Ana', id_number: '1710034065' });

    const garden = await service.registerGarden(ANA, {
      address: { label: 'Casa', line: 'Av. Interoceánica km 12', arrivalInstructions: 'Tocar timbre', coordinates: CUMBAYA },
      garden: { name: 'Frontal', sizeBand: 'L' },
      photoKeys: [`${ANA}/a.jpg`, `${ANA}/b.jpg`],
    });
    expect(pg.tables.addresses![0]).toMatchObject({ customer_id: ANA, arrival_instructions: 'Tocar timbre', lat: -0.2 });
    expect(pg.tables.garden_photos).toHaveLength(2);
    expect(garden.photos.map((p) => p.storageKey)).toEqual([`${ANA}/a.jpg`, `${ANA}/b.jpg`]);

    const read = await service.getGarden(ANA, garden.id);
    expect(read.garden).toEqual(garden);
    expect(read.address.arrivalInstructions).toBe('Tocar timbre');
    expect(await service.listGardens(ANA)).toHaveLength(1);

    // Quitar una foto borra solo esa fila.
    const edited = await service.editGarden(ANA, garden.id, { removePhotoIds: [garden.photos[0]!.id], name: 'Jardín frontal' });
    expect(edited.photos).toHaveLength(1);
    expect(pg.tables.garden_photos!.map((p) => p.storage_key)).toEqual([`${ANA}/b.jpg`]);
    expect(pg.requests.some((r) => r.startsWith('DELETE garden_photos?garden_id=eq.') && r.includes('id=not.in.('))).toBe(true);

    // Quitar todas las fotos.
    await service.editGarden(ANA, garden.id, { removePhotoIds: edited.photos.map((p) => p.id) });
    expect(pg.tables.garden_photos).toHaveLength(0);

    const quote = await service.requestQuote(ANA, garden.id);
    expect(quote.route).toBe('manual_review');
    expect(pg.tables.quotes![0]).toMatchObject({ customer_id: ANA, status: 'pending_review', price: null });
    expect(await service.latestQuote(ANA, garden.id)).toEqual(quote);
    expect(await service.listQuotes(ANA, garden.id)).toHaveLength(1);
    expect(pg.requests).toContain(`GET quotes?select=*&customer_id=eq.${ANA}&garden_id=eq.${garden.id}`);

    expect(await service.getCustomer(ANA)).toMatchObject({ firstName: 'Ana', phone: '0991234567' });
    expect(await service.getCustomer('00000000-0000-4000-8000-999999999999')).toBeUndefined();
  });
});
