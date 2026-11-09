import type { PricingRule, SizeBand } from './types';

/**
 * PRECIOS DE DEMOSTRACIÓN. No son tarifas oficiales (doc maestro §7).
 * Se mantienen hasta definir los profesionales y sus tarifas (decisión del 2026-11-09).
 * XL no tiene tarifa automática: siempre va a revisión manual.
 */
export const DEMO_PRICING: PricingRule = {
  version: 'demo-2026-11-09',
  arkuMinimumCents: 2500,
  isDemo: true,
  tariffs: [
    { sizeBand: 'S', amountCents: 2500 },
    { sizeBand: 'M', amountCents: 3500 },
    { sizeBand: 'L', amountCents: 5000 },
  ],
};

/** Texto orientativo por banda. Los umbrales son hipótesis configurables. */
export const SIZE_BAND_LABELS: Record<SizeBand, string> = {
  S: 'Hasta 50 m²',
  M: '51–100 m²',
  L: '101–200 m²',
  XL: 'Más de 200 m²',
};
