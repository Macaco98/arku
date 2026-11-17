import type { CoverageService } from './coverage';
import { buildQuote, withExpiry } from './quote';
import type { Repositories } from './repositories';
import {
  addressInputSchema,
  customerProfileSchema,
  gardenInputSchema,
  gardenUpdateSchema,
  MAX_PHOTOS_PER_GARDEN,
  phoneSchema,
  type AddressInput,
  type CustomerProfileInput,
  type GardenInput,
  type GardenUpdate,
} from './schemas';
import type { Address, AddressLabel, Coordinates, Customer, Garden, PricingRule, Quote, SizeBand } from './types';

export interface RegisterGardenInput {
  /** Dirección guardada o una nueva. */
  address: { addressId: string } | AddressInput;
  garden: Omit<GardenInput, 'addressId'>;
  /** Claves de almacenamiento privado de las fotos ya subidas. */
  photoKeys: string[];
}

export class OutOfCoverageError extends Error {
  constructor() {
    super('Por ahora atendemos solo en Cumbayá y Tumbaco.');
    this.name = 'OutOfCoverageError';
  }
}

export class NotFoundError extends Error {
  constructor(what: string) {
    super(`${what} no encontrado`);
    this.name = 'NotFoundError';
  }
}

export interface ServiceDeps {
  repos: Repositories;
  coverage: CoverageService;
  pricing: PricingRule;
  newId: () => string;
  now: () => Date;
}

/** Casos de uso de Sprint 01: registrar, guardar, editar, reutilizar y cotizar jardines. */
export class GardenService {
  constructor(private readonly deps: ServiceDeps) {}

  async registerCustomer(phoneInput: string, profile: CustomerProfileInput): Promise<Customer> {
    const phone = phoneSchema.parse(phoneInput);
    const data = customerProfileSchema.parse(profile);
    const customer: Customer = { id: this.deps.newId(), phone, ...data, createdAt: this.deps.now().toISOString() };
    return this.deps.repos.customers.save(customer);
  }

  getCustomer(customerId: string) {
    return this.deps.repos.customers.get(customerId);
  }

  /** S03: aviso en vivo de cobertura mientras el cliente escribe o usa su ubicación. */
  checkCoverage(point: Coordinates) {
    return this.deps.coverage.check(point);
  }

  /** S03: la dirección solo se guarda si cae en una zona de cobertura. */
  async addAddress(customerId: string, input: AddressInput): Promise<Address> {
    const data = addressInputSchema.parse(input);
    const coverage = await this.deps.coverage.check(data.coordinates);
    if (!coverage.covered) throw new OutOfCoverageError();
    const address: Address = {
      id: this.deps.newId(),
      customerId,
      label: data.label as AddressLabel,
      line: data.line,
      ...(data.reference ? { reference: data.reference } : {}),
      ...(data.arrivalInstructions ? { arrivalInstructions: data.arrivalInstructions } : {}),
      coordinates: data.coordinates,
      coverageZoneId: coverage.zone.id,
      createdAt: this.deps.now().toISOString(),
    };
    return this.deps.repos.addresses.save(address);
  }

  listAddresses(customerId: string) {
    return this.deps.repos.addresses.list((a) => a.customerId === customerId);
  }

  /** S06: guardar nunca exige fotos, en ningún tamaño. */
  async createGarden(customerId: string, input: GardenInput): Promise<Garden> {
    const data = gardenInputSchema.parse(input);
    await this.requireAddress(customerId, data.addressId);
    const now = this.deps.now().toISOString();
    const garden: Garden = {
      id: this.deps.newId(),
      customerId,
      name: data.name,
      addressId: data.addressId,
      sizeBand: data.sizeBand as SizeBand,
      accessNotes: data.accessNotes,
      photos: [],
      createdAt: now,
      updatedAt: now,
    };
    return this.deps.repos.gardens.save(garden);
  }

  /** S06 · Guardar jardín: usa una dirección guardada o crea una nueva, y adjunta las fotos. */
  async registerGarden(customerId: string, input: RegisterGardenInput): Promise<Garden> {
    if (input.photoKeys.length > MAX_PHOTOS_PER_GARDEN) {
      throw new Error(`Puedes subir hasta ${MAX_PHOTOS_PER_GARDEN} fotos por jardín.`);
    }
    // Valida el jardín antes de crear la dirección, para no dejar direcciones huérfanas.
    gardenInputSchema.parse({ ...input.garden, addressId: 'pendiente' });
    const addressId =
      'addressId' in input.address
        ? (await this.requireAddress(customerId, input.address.addressId)).id
        : (await this.addAddress(customerId, input.address)).id;
    let garden = await this.createGarden(customerId, { ...input.garden, addressId });
    for (const key of input.photoKeys) garden = await this.addPhoto(customerId, garden.id, key);
    return garden;
  }

  /** Jardines del cliente, del más reciente al más antiguo. */
  async listGardens(customerId: string) {
    const gardens = await this.deps.repos.gardens.list((g) => g.customerId === customerId);
    return gardens.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  /** D02: editar cambia cotizaciones futuras, nunca las existentes. */
  async updateGarden(customerId: string, gardenId: string, changes: GardenUpdate): Promise<Garden> {
    const garden = await this.requireGarden(customerId, gardenId);
    const data = gardenUpdateSchema.parse(changes);
    if (data.addressId) await this.requireAddress(customerId, data.addressId);
    const updated: Garden = {
      ...garden,
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.addressId !== undefined ? { addressId: data.addressId } : {}),
      ...(data.sizeBand !== undefined ? { sizeBand: data.sizeBand as SizeBand } : {}),
      ...(changes.accessNotes !== undefined ? { accessNotes: changes.accessNotes.trim() } : {}),
      updatedAt: this.deps.now().toISOString(),
    };
    return this.deps.repos.gardens.save(updated);
  }

  /** S05: la subida real a almacenamiento privado ocurre antes; aquí solo se registra la clave. */
  async addPhoto(customerId: string, gardenId: string, storageKey: string): Promise<Garden> {
    const garden = await this.requireGarden(customerId, gardenId);
    if (garden.photos.length >= MAX_PHOTOS_PER_GARDEN) {
      throw new Error(`Puedes subir hasta ${MAX_PHOTOS_PER_GARDEN} fotos por jardín.`);
    }
    const now = this.deps.now().toISOString();
    const photo = { id: this.deps.newId(), gardenId, storageKey, createdAt: now };
    return this.deps.repos.gardens.save({ ...garden, photos: [...garden.photos, photo], updatedAt: now });
  }

  async removePhoto(customerId: string, gardenId: string, photoId: string): Promise<Garden> {
    const garden = await this.requireGarden(customerId, gardenId);
    const photos = garden.photos.filter((p) => p.id !== photoId);
    return this.deps.repos.gardens.save({ ...garden, photos, updatedAt: this.deps.now().toISOString() });
  }

  /** S07/S08 y R02: cotizar (o volver a cotizar) un jardín guardado. */
  async requestQuote(customerId: string, gardenId: string): Promise<Quote> {
    const garden = await this.requireGarden(customerId, gardenId);
    const address = await this.requireAddress(customerId, garden.addressId);
    const quote = buildQuote({ id: this.deps.newId(), garden, address, pricing: this.deps.pricing, now: this.deps.now() });
    return this.deps.repos.quotes.save(quote);
  }

  async listQuotes(customerId: string, gardenId: string): Promise<Quote[]> {
    const now = this.deps.now();
    const quotes = await this.deps.repos.quotes.list((q) => q.customerId === customerId && q.gardenId === gardenId);
    return quotes.map((q) => withExpiry(q, now));
  }

  private async requireGarden(customerId: string, gardenId: string) {
    const garden = await this.deps.repos.gardens.get(gardenId);
    if (!garden || garden.customerId !== customerId) throw new NotFoundError('Jardín');
    return garden;
  }

  private async requireAddress(customerId: string, addressId: string) {
    const address = await this.deps.repos.addresses.get(addressId);
    if (!address || address.customerId !== customerId) throw new NotFoundError('Dirección');
    return address;
  }
}
