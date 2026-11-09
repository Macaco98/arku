import type { Address, Customer, Garden, Quote } from './types';

/**
 * Interfaces de repositorio (doc maestro §14). La app depende de estas interfaces,
 * no de la implementación. En Sprint 01 la implementación es un MOCK de desarrollo
 * persistente; un backend real (p. ej. Supabase) la reemplazará sin tocar pantallas.
 */
export interface Repository<T extends { id: string }> {
  get(id: string): Promise<T | undefined>;
  list(filter?: (item: T) => boolean): Promise<T[]>;
  save(item: T): Promise<T>;
  remove(id: string): Promise<void>;
}

export type CustomerRepository = Repository<Customer>;
export type AddressRepository = Repository<Address>;
export type GardenRepository = Repository<Garden>;
export type QuoteRepository = Repository<Quote>;

/** Compatible con AsyncStorage de React Native y con un Map en pruebas. */
export interface KeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

export class MemoryStorage implements KeyValueStorage {
  private readonly data = new Map<string, string>();
  async getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  async setItem(key: string, value: string) {
    this.data.set(key, value);
  }
}

/** MOCK de desarrollo: guarda una colección como JSON en un KeyValueStorage. */
export class StorageRepository<T extends { id: string }> implements Repository<T> {
  constructor(
    private readonly storage: KeyValueStorage,
    private readonly key: string,
  ) {}

  private async readAll(): Promise<T[]> {
    const raw = await this.storage.getItem(this.key);
    if (!raw) return [];
    try {
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      throw new Error(`Datos de desarrollo dañados en "${this.key}"`);
    }
  }

  private async writeAll(items: T[]) {
    await this.storage.setItem(this.key, JSON.stringify(items));
  }

  async get(id: string) {
    return (await this.readAll()).find((item) => item.id === id);
  }

  async list(filter?: (item: T) => boolean) {
    const items = await this.readAll();
    return filter ? items.filter(filter) : items;
  }

  async save(item: T) {
    const items = await this.readAll();
    const index = items.findIndex((i) => i.id === item.id);
    if (index === -1) items.push(item);
    else items[index] = item;
    await this.writeAll(items);
    return item;
  }

  async remove(id: string) {
    await this.writeAll((await this.readAll()).filter((i) => i.id !== id));
  }
}

export interface Repositories {
  customers: CustomerRepository;
  addresses: AddressRepository;
  gardens: GardenRepository;
  quotes: QuoteRepository;
}

const PREFIX = 'arku.dev.v1';

export function createDevRepositories(storage: KeyValueStorage): Repositories {
  return {
    customers: new StorageRepository<Customer>(storage, `${PREFIX}.customers`),
    addresses: new StorageRepository<Address>(storage, `${PREFIX}.addresses`),
    gardens: new StorageRepository<Garden>(storage, `${PREFIX}.gardens`),
    quotes: new StorageRepository<Quote>(storage, `${PREFIX}.quotes`),
  };
}
