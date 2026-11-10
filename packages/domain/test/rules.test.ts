import { describe, expect, it } from 'vitest';
import {
  basePriceCents,
  buildQuote,
  completeManualReview,
  DEMO_PRICING,
  determineQuoteRoute,
  FixtureCoverageService,
  formatUSD,
  validateCedula,
  withExpiry,
  type Address,
  type Garden,
} from '../src';

describe('determineQuoteRoute', () => {
  it.each([
    ['S', 0, 'automatic'],
    ['S', 2, 'automatic'],
    ['M', 0, 'automatic'],
    ['M', 3, 'automatic'],
    ['L', 0, 'manual_review'],
    ['L', 1, 'automatic'],
    ['XL', 0, 'manual_review'],
    ['XL', 5, 'manual_review'],
  ] as const)('%s con %i fotos → %s', (size, photos, route) => {
    expect(determineQuoteRoute(size, photos)).toBe(route);
  });

  it('rechaza un número de fotos inválido', () => {
    expect(() => determineQuoteRoute('S', -1)).toThrow();
    expect(() => determineQuoteRoute('S', 1.5)).toThrow();
  });
});

describe('basePriceCents', () => {
  it('aplica el mínimo de Arku cuando la tarifa es menor', () => {
    expect(basePriceCents(1800, 2500)).toBe(2500);
  });
  it('usa la tarifa del profesional cuando es mayor', () => {
    expect(basePriceCents(3500, 2500)).toBe(3500);
  });
  it('rechaza importes que no son centavos enteros', () => {
    expect(() => basePriceCents(35.5, 2500)).toThrow();
    expect(() => basePriceCents(-1, 2500)).toThrow();
  });
});

describe('formatUSD', () => {
  it('formatea en estilo Ecuador', () => {
    expect(formatUSD(3500)).toBe('$35,00');
    expect(formatUSD(123456)).toBe('$1.234,56');
  });
});

describe('validateCedula', () => {
  it('acepta una cédula válida', () => {
    expect(validateCedula('1712345675')).toMatchObject({ status: 'valid', digits: '1712345675' });
  });
  it('ignora espacios y guiones', () => {
    expect(validateCedula('171234567-5').status).toBe('valid');
  });
  it('marca vacío e incompleto', () => {
    expect(validateCedula('').status).toBe('empty');
    expect(validateCedula('171234')).toMatchObject({ status: 'incomplete', message: 'Faltan 4 dígitos. La cédula tiene 10.' });
  });
  it('rechaza dígito verificador, provincia y tercer dígito incorrectos', () => {
    expect(validateCedula('1712345674').status).toBe('invalid'); // verificador
    expect(validateCedula('2512345678').status).toBe('invalid'); // provincia 25
    expect(validateCedula('1762345675').status).toBe('invalid'); // tercer dígito 6
    expect(validateCedula('17123456750').status).toBe('invalid'); // 11 dígitos
  });
});

describe('cobertura con fixtures', () => {
  const coverage = new FixtureCoverageService();
  it('acepta Cumbayá y Tumbaco', async () => {
    expect(await coverage.check({ lat: -0.2, lng: -78.43 })).toMatchObject({ covered: true, zone: { name: 'Cumbayá' } });
    expect(await coverage.check({ lat: -0.21, lng: -78.4 })).toMatchObject({ covered: true, zone: { name: 'Tumbaco' } });
  });
  it('rechaza el centro de Quito', async () => {
    expect(await coverage.check({ lat: -0.22, lng: -78.51 })).toEqual({ covered: false });
  });
});

describe('buildQuote', () => {
  const address: Address = {
    id: 'a1',
    customerId: 'c1',
    label: 'Casa',
    line: 'Av. Interoceánica km 12',
    coordinates: { lat: -0.2, lng: -78.43 },
    coverageZoneId: 'zone-cumbaya',
    createdAt: '2026-11-09T10:00:00.000Z',
  };
  const garden = (sizeBand: Garden['sizeBand'], photoCount = 0): Garden => ({
    id: 'g1',
    customerId: 'c1',
    name: 'Casa Cumbayá',
    addressId: 'a1',
    sizeBand,
    accessNotes: '',
    photos: Array.from({ length: photoCount }, (_, i) => ({ id: `p${i}`, gardenId: 'g1', storageKey: `k${i}`, createdAt: '' })),
    createdAt: '',
    updatedAt: '',
  });
  const now = new Date('2026-11-09T12:00:00.000Z');

  it('M automática con precio de demostración', () => {
    const q = buildQuote({ id: 'q1', garden: garden('M'), address, pricing: DEMO_PRICING, now });
    expect(q.status).toBe('automatic');
    expect(q.price).toMatchObject({ tariffCents: 3500, minimumCents: 2500, baseCents: 3500, isDemo: true });
  });

  it('L sin fotos queda en revisión manual y sin precio', () => {
    const q = buildQuote({ id: 'q1', garden: garden('L'), address, pricing: DEMO_PRICING, now });
    expect(q.status).toBe('pending_review');
    expect(q.price).toBeUndefined();
  });

  it('la revisión manual produce un precio que el cliente debe aceptar', () => {
    const pending = buildQuote({ id: 'q1', garden: garden('XL', 2), address, pricing: DEMO_PRICING, now });
    const ready = completeManualReview(pending, 6000, DEMO_PRICING, now);
    expect(ready.status).toBe('ready');
    expect(ready.price?.baseCents).toBe(6000);
  });

  it('vence cuando pasa la vigencia', () => {
    const q = buildQuote({ id: 'q1', garden: garden('S'), address, pricing: DEMO_PRICING, now, validityHours: 1 });
    expect(withExpiry(q, new Date('2026-11-09T12:30:00.000Z')).status).toBe('automatic');
    expect(withExpiry(q, new Date('2026-11-09T13:00:00.000Z')).status).toBe('expired');
  });
});
