import type { Coordinates, CoverageZone } from './types';

export type CoverageResult =
  | { covered: true; zone: CoverageZone }
  | { covered: false };

/** La cobertura se valida con zonas administrables, nunca con texto libre (doc maestro §6). */
export interface CoverageService {
  check(point: Coordinates): Promise<CoverageResult>;
}

/** Punto dentro de polígono (ray casting). Polígono en pares [lng, lat]. */
export function pointInPolygon(point: Coordinates, polygon: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i]!;
    const [xj, yj] = polygon[j]!;
    const crosses =
      yi > point.lat !== yj > point.lat &&
      point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi;
    if (crosses) inside = !inside;
  }
  return inside;
}

/**
 * FIXTURES DE DESARROLLO. Rectángulos aproximados, no son los polígonos oficiales.
 * Los polígonos reales siguen pendientes (doc maestro §15, punto 9).
 */
export const FIXTURE_COVERAGE_ZONES: CoverageZone[] = [
  {
    id: 'zone-cumbaya',
    name: 'Cumbayá',
    polygon: [
      [-78.45, -0.225],
      [-78.415, -0.225],
      [-78.415, -0.18],
      [-78.45, -0.18],
    ],
  },
  {
    id: 'zone-tumbaco',
    name: 'Tumbaco',
    polygon: [
      [-78.415, -0.24],
      [-78.37, -0.24],
      [-78.37, -0.19],
      [-78.415, -0.19],
    ],
  },
];

export class FixtureCoverageService implements CoverageService {
  constructor(private readonly zones: CoverageZone[] = FIXTURE_COVERAGE_ZONES) {}

  async check(point: Coordinates): Promise<CoverageResult> {
    const zone = this.zones.find((z) => pointInPolygon(point, z.polygon));
    return zone ? { covered: true, zone } : { covered: false };
  }
}
