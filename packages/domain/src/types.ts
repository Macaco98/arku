/** Banda de tamaño del jardín. Los umbrales en m² son hipótesis configurables (doc maestro §7). */
export type SizeBand = 'S' | 'M' | 'L' | 'XL';
export const SIZE_BANDS: readonly SizeBand[] = ['S', 'M', 'L', 'XL'];

export type QuoteRoute = 'automatic' | 'manual_review';

export type ISODate = string;
export type Cents = number;

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  /** Cédula ecuatoriana validada (10 dígitos). */
  idNumber: string;
  /** Celular verificado por SMS, formato 09XXXXXXXX. */
  phone: string;
  createdAt: ISODate;
}

export type AddressLabel = 'Casa' | 'Trabajo' | 'Familia' | 'Otra';
export const ADDRESS_LABELS: readonly AddressLabel[] = ['Casa', 'Trabajo', 'Familia', 'Otra'];

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Address {
  id: string;
  customerId: string;
  label: AddressLabel;
  line: string;
  reference?: string;
  /** Qué hacer al llegar: guardia, timbre, portón. Sirve para todos los jardines de esta dirección. */
  arrivalInstructions?: string;
  coordinates: Coordinates;
  /** Zona de cobertura que validó la dirección. */
  coverageZoneId: string;
  createdAt: ISODate;
}

export interface GardenPhoto {
  id: string;
  gardenId: string;
  /** Clave de almacenamiento privado. Nunca una URL pública. */
  storageKey: string;
  createdAt: ISODate;
}

export interface Garden {
  id: string;
  customerId: string;
  name: string;
  addressId: string;
  sizeBand: SizeBand;
  photos: GardenPhoto[];
  /** Notas propias de este jardín: mascotas, plantas delicadas, acceso al jardín. */
  accessNotes: string;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface CoverageZone {
  id: string;
  name: string;
  /** Polígono en pares [lng, lat]. */
  polygon: [number, number][];
}

export interface ProviderTariff {
  sizeBand: SizeBand;
  amountCents: Cents;
}

/** Configuración de precios versionada. */
export interface PricingRule {
  version: string;
  arkuMinimumCents: Cents;
  /** Tarifa del profesional por banda. En Sprint 01 es simulada. */
  tariffs: ProviderTariff[];
  /** true mientras los precios sean de demostración. */
  isDemo: boolean;
}

export type QuoteStatus =
  | 'automatic' // precio calculado, listo para aceptar
  | 'pending_review' // en revisión manual de Arku
  | 'ready' // revisión manual terminada, precio listo
  | 'expired'
  | 'accepted'
  | 'declined';

/** Copia congelada del jardín al momento de cotizar. Editar el jardín no la cambia. */
export interface GardenSnapshot {
  gardenName: string;
  addressLine: string;
  sizeBand: SizeBand;
  photoCount: number;
  accessNotes: string;
  arrivalInstructions: string;
}

export interface QuotePrice {
  tariffCents: Cents;
  minimumCents: Cents;
  baseCents: Cents;
  pricingVersion: string;
  isDemo: boolean;
}

export interface Quote {
  id: string;
  gardenId: string;
  customerId: string;
  route: QuoteRoute;
  status: QuoteStatus;
  snapshot: GardenSnapshot;
  price?: QuotePrice;
  createdAt: ISODate;
  expiresAt?: ISODate;
}
