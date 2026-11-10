import type { Cents } from './types';

export function assertCents(value: number): asserts value is Cents {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`Importe inválido: ${value}. Use centavos enteros no negativos.`);
  }
}

/** Formato de Ecuador (USD): 3500 → "$35,00"; 123456 → "$1.234,56". */
export function formatUSD(cents: Cents): string {
  assertCents(cents);
  const dollars = Math.floor(cents / 100)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const rest = (cents % 100).toString().padStart(2, '0');
  return `$${dollars},${rest}`;
}
