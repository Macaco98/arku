import type { Address, AddressLabel, Customer, Garden, GardenPhoto, Quote, SizeBand } from '@arku/domain';

/** Filas tal como están en Postgres (supabase/migrations). */
export interface CustomerRow {
  id: string;
  phone: string;
  first_name: string;
  last_name: string;
  id_number: string;
  created_at: string;
}

export interface AddressRow {
  id: string;
  customer_id: string;
  label: string;
  line: string;
  reference: string | null;
  arrival_instructions: string | null;
  lat: number;
  lng: number;
  coverage_zone_id: string;
  created_at: string;
}

export interface GardenPhotoRow {
  id: string;
  garden_id: string;
  customer_id: string;
  storage_key: string;
  created_at: string;
}

export interface GardenRow {
  id: string;
  customer_id: string;
  address_id: string;
  name: string;
  size_band: string;
  access_notes: string;
  created_at: string;
  updated_at: string;
  /** Fotos embebidas con `select('*, garden_photos(*)')`. */
  garden_photos?: GardenPhotoRow[];
}

export interface QuoteRow {
  id: string;
  customer_id: string;
  garden_id: string;
  route: string;
  status: string;
  snapshot: Quote['snapshot'];
  price: Quote['price'] | null;
  created_at: string;
  expires_at: string | null;
  responded_at: string | null;
}

/** Postgres devuelve timestamptz como "2026-11-17 12:00:00+00"; el dominio usa ISO con Z. */
const iso = (value: string) => new Date(value).toISOString();
const optional = <K extends string, V>(key: K, value: V | null | undefined) =>
  (value === null || value === undefined ? {} : { [key]: value }) as Partial<Record<K, V>>;

export const customerMapper = {
  toRow: (c: Customer): CustomerRow => ({
    id: c.id,
    phone: c.phone,
    first_name: c.firstName,
    last_name: c.lastName,
    id_number: c.idNumber,
    created_at: c.createdAt,
  }),
  fromRow: (r: CustomerRow): Customer => ({
    id: r.id,
    phone: r.phone,
    firstName: r.first_name,
    lastName: r.last_name,
    idNumber: r.id_number,
    createdAt: iso(r.created_at),
  }),
};

export const addressMapper = {
  toRow: (a: Address): AddressRow => ({
    id: a.id,
    customer_id: a.customerId,
    label: a.label,
    line: a.line,
    reference: a.reference ?? null,
    arrival_instructions: a.arrivalInstructions ?? null,
    lat: a.coordinates.lat,
    lng: a.coordinates.lng,
    coverage_zone_id: a.coverageZoneId,
    created_at: a.createdAt,
  }),
  fromRow: (r: AddressRow): Address => ({
    id: r.id,
    customerId: r.customer_id,
    label: r.label as AddressLabel,
    line: r.line,
    ...optional('reference', r.reference),
    ...optional('arrivalInstructions', r.arrival_instructions),
    coordinates: { lat: r.lat, lng: r.lng },
    coverageZoneId: r.coverage_zone_id,
    createdAt: iso(r.created_at),
  }),
};

export const photoMapper = {
  toRow: (p: GardenPhoto, customerId: string): GardenPhotoRow => ({
    id: p.id,
    garden_id: p.gardenId,
    customer_id: customerId,
    storage_key: p.storageKey,
    created_at: p.createdAt,
  }),
  fromRow: (r: GardenPhotoRow): GardenPhoto => ({
    id: r.id,
    gardenId: r.garden_id,
    storageKey: r.storage_key,
    createdAt: iso(r.created_at),
  }),
};

export const gardenMapper = {
  /** Sin las fotos: van en su propia tabla. */
  toRow: (g: Garden): Omit<GardenRow, 'garden_photos'> => ({
    id: g.id,
    customer_id: g.customerId,
    address_id: g.addressId,
    name: g.name,
    size_band: g.sizeBand,
    access_notes: g.accessNotes,
    created_at: g.createdAt,
    updated_at: g.updatedAt,
  }),
  fromRow: (r: GardenRow): Garden => ({
    id: r.id,
    customerId: r.customer_id,
    addressId: r.address_id,
    name: r.name,
    sizeBand: r.size_band as SizeBand,
    accessNotes: r.access_notes,
    // Mismo orden en que se agregaron.
    photos: (r.garden_photos ?? []).map(photoMapper.fromRow).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
  }),
};

export const quoteMapper = {
  toRow: (q: Quote): QuoteRow => ({
    id: q.id,
    customer_id: q.customerId,
    garden_id: q.gardenId,
    route: q.route,
    status: q.status,
    snapshot: q.snapshot,
    price: q.price ?? null,
    created_at: q.createdAt,
    expires_at: q.expiresAt ?? null,
    responded_at: q.respondedAt ?? null,
  }),
  fromRow: (r: QuoteRow): Quote => ({
    id: r.id,
    customerId: r.customer_id,
    gardenId: r.garden_id,
    route: r.route as Quote['route'],
    status: r.status as Quote['status'],
    snapshot: r.snapshot,
    ...optional('price', r.price),
    createdAt: iso(r.created_at),
    ...optional('expiresAt', r.expires_at ? iso(r.expires_at) : null),
    ...optional('respondedAt', r.responded_at ? iso(r.responded_at) : null),
  }),
};

/** customerId → customer_id, para los filtros `list({ customerId })`. */
export const toColumn = (field: string) => field.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
