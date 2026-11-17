import type { Address, Customer, Garden, Quote, Repositories, Repository, Where } from '@arku/domain';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  addressMapper,
  customerMapper,
  gardenMapper,
  photoMapper,
  quoteMapper,
  toColumn,
  type AddressRow,
  type CustomerRow,
  type GardenRow,
  type QuoteRow,
} from './rows';

function check<T>(result: { data: T; error: { message: string } | null }, what: string): T {
  if (result.error) throw new Error(`No se pudo ${what}: ${result.error.message}`);
  return result.data;
}

function columns(where: Record<string, unknown> = {}) {
  return Object.fromEntries(Object.entries(where).map(([k, v]) => [toColumn(k), v]));
}

/** Repositorio de una tabla simple: una entidad = una fila. */
class TableRepository<T extends { id: string }, R> implements Repository<T> {
  constructor(
    private readonly db: SupabaseClient,
    private readonly table: string,
    private readonly map: { toRow: (item: T) => R; fromRow: (row: R) => T },
  ) {}

  async get(id: string) {
    const row = check(await this.db.from(this.table).select('*').eq('id', id).maybeSingle(), `leer ${this.table}`);
    return row ? this.map.fromRow(row as R) : undefined;
  }

  async list(where?: Where<T>) {
    const rows = check(await this.db.from(this.table).select('*').match(columns(where)), `listar ${this.table}`);
    return (rows as R[]).map(this.map.fromRow);
  }

  async save(item: T) {
    check(await this.db.from(this.table).upsert(this.map.toRow(item) as object), `guardar en ${this.table}`);
    return item;
  }

  async remove(id: string) {
    check(await this.db.from(this.table).delete().eq('id', id), `borrar de ${this.table}`);
  }
}

/** Jardines: la fila del jardín más sus fotos en garden_photos. */
class GardenTableRepository implements Repository<Garden> {
  constructor(private readonly db: SupabaseClient) {}

  async get(id: string) {
    const row = check(await this.db.from('gardens').select('*, garden_photos(*)').eq('id', id).maybeSingle(), 'leer el jardín');
    return row ? gardenMapper.fromRow(row as GardenRow) : undefined;
  }

  async list(where?: Where<Garden>) {
    const rows = check(await this.db.from('gardens').select('*, garden_photos(*)').match(columns(where)), 'listar jardines');
    return (rows as GardenRow[]).map(gardenMapper.fromRow);
  }

  async save(garden: Garden) {
    check(await this.db.from('gardens').upsert(gardenMapper.toRow(garden)), 'guardar el jardín');
    const keep = garden.photos.map((p) => p.id);
    let stale = this.db.from('garden_photos').delete().eq('garden_id', garden.id);
    if (keep.length) stale = stale.not('id', 'in', `(${keep.join(',')})`);
    check(await stale, 'quitar fotos del jardín');
    if (keep.length) {
      check(
        await this.db.from('garden_photos').upsert(garden.photos.map((p) => photoMapper.toRow(p, garden.customerId))),
        'guardar las fotos del jardín',
      );
    }
    return garden;
  }

  async remove(id: string) {
    check(await this.db.from('gardens').delete().eq('id', id), 'borrar el jardín');
  }
}

/**
 * Repositorios de producción sobre Supabase. Se usan SOLO en el servidor (función `arku`)
 * con la clave de servicio: la app no escribe directo en las tablas.
 */
export function createSupabaseRepositories(db: SupabaseClient): Repositories {
  return {
    customers: new TableRepository<Customer, CustomerRow>(db, 'customers', customerMapper),
    addresses: new TableRepository<Address, AddressRow>(db, 'addresses', addressMapper),
    gardens: new GardenTableRepository(db),
    quotes: new TableRepository<Quote, QuoteRow>(db, 'quotes', quoteMapper),
  };
}
