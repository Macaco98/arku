import { assertCents } from './money';
import type {
  Address,
  Cents,
  Garden,
  GardenSnapshot,
  PricingRule,
  Quote,
  QuoteRoute,
  SizeBand,
} from './types';

const HOUR_MS = 3_600_000;
/** Vigencia provisional de una cotización con precio. Pendiente de definir. */
export const DEFAULT_QUOTE_VALIDITY_HOURS = 72;

/** Doc maestro §7: S/M automáticas; L automática solo con ≥1 foto; XL siempre manual. */
export function determineQuoteRoute(size: SizeBand, photoCount: number): QuoteRoute {
  if (!Number.isInteger(photoCount) || photoCount < 0) {
    throw new Error(`Número de fotos inválido: ${photoCount}`);
  }
  if (size === 'XL') return 'manual_review';
  if (size === 'L' && photoCount === 0) return 'manual_review';
  return 'automatic';
}

/** base = máx(tarifa del profesional, mínimo de Arku). Nunca se multiplica por m². */
export function basePriceCents(providerBandTariffCents: Cents, arkuMinimumCents: Cents): Cents {
  assertCents(providerBandTariffCents);
  assertCents(arkuMinimumCents);
  return Math.max(providerBandTariffCents, arkuMinimumCents);
}

export function tariffFor(pricing: PricingRule, size: SizeBand): Cents {
  const tariff = pricing.tariffs.find((t) => t.sizeBand === size);
  if (!tariff) throw new Error(`No hay tarifa automática para la banda ${size}`);
  return tariff.amountCents;
}

export function snapshotGarden(garden: Garden, address: Address): GardenSnapshot {
  return {
    gardenName: garden.name,
    addressLine: address.line,
    sizeBand: garden.sizeBand,
    photoCount: garden.photos.length,
    accessNotes: garden.accessNotes,
  };
}

function priceFor(tariffCents: Cents, pricing: PricingRule) {
  return {
    tariffCents,
    minimumCents: pricing.arkuMinimumCents,
    baseCents: basePriceCents(tariffCents, pricing.arkuMinimumCents),
    pricingVersion: pricing.version,
    isDemo: pricing.isDemo,
  };
}

export interface BuildQuoteInput {
  id: string;
  garden: Garden;
  address: Address;
  pricing: PricingRule;
  now: Date;
  validityHours?: number;
}

/** Crea una cotización con una copia congelada del jardín. */
export function buildQuote({
  id,
  garden,
  address,
  pricing,
  now,
  validityHours = DEFAULT_QUOTE_VALIDITY_HOURS,
}: BuildQuoteInput): Quote {
  if (address.id !== garden.addressId) throw new Error('La dirección no corresponde al jardín');
  const snapshot = snapshotGarden(garden, address);
  const route = determineQuoteRoute(snapshot.sizeBand, snapshot.photoCount);
  const base = {
    id,
    gardenId: garden.id,
    customerId: garden.customerId,
    route,
    snapshot,
    createdAt: now.toISOString(),
  };

  if (route === 'manual_review') return { ...base, status: 'pending_review' };

  return {
    ...base,
    status: 'automatic',
    expiresAt: new Date(now.getTime() + validityHours * HOUR_MS).toISOString(),
    price: priceFor(tariffFor(pricing, snapshot.sizeBand), pricing),
  };
}

/** Arku termina la revisión manual con un importe que el cliente debe aceptar. */
export function completeManualReview(
  quote: Quote,
  reviewedTariffCents: Cents,
  pricing: PricingRule,
  now: Date,
  validityHours = DEFAULT_QUOTE_VALIDITY_HOURS,
): Quote {
  if (quote.status !== 'pending_review') throw new Error('La cotización no está en revisión manual');
  return {
    ...quote,
    status: 'ready',
    expiresAt: new Date(now.getTime() + validityHours * HOUR_MS).toISOString(),
    price: priceFor(reviewedTariffCents, pricing),
  };
}

/** Devuelve la cotización como vencida si su vigencia ya pasó. */
export function withExpiry(quote: Quote, now: Date): Quote {
  const open = quote.status === 'automatic' || quote.status === 'ready';
  if (open && quote.expiresAt && new Date(quote.expiresAt) <= now) {
    return { ...quote, status: 'expired' };
  }
  return quote;
}
