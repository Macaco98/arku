import type { Coordinates } from '@arku/domain';
import * as Location from 'expo-location';
import { Platform } from 'react-native';

/**
 * Punto de ejemplo en Cumbayá para la vista previa web, donde la geocodificación
 * del sistema no existe. Solo para desarrollo.
 */
export const DEV_SAMPLE_LOCATION = {
  coordinates: { lat: -0.2015, lng: -78.4335 },
  line: 'Av. Interoceánica km 12, Cumbayá',
};

export type LocateResult =
  | { status: 'ok'; coordinates: Coordinates; line?: string }
  | { status: 'denied' }
  | { status: 'error' };

function lineFrom(a: Location.LocationGeocodedAddress | undefined) {
  if (!a) return undefined;
  const street = [a.street, a.streetNumber].filter(Boolean).join(' ');
  const place = a.district ?? a.subregion ?? a.city;
  const parts = [street || a.name, place].filter(Boolean);
  return parts.length ? parts.join(', ') : (a.formattedAddress ?? undefined);
}

/** S03 · "Usar mi ubicación": GPS y, si se puede, la dirección escrita de ese punto. */
export async function locateMe(): Promise<LocateResult> {
  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) return { status: 'denied' };
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    const coordinates = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    if (Platform.OS === 'web') return { status: 'ok', coordinates };
    try {
      const [address] = await Location.reverseGeocodeAsync({ latitude: coordinates.lat, longitude: coordinates.lng });
      return { status: 'ok', coordinates, line: lineFrom(address) };
    } catch {
      return { status: 'ok', coordinates };
    }
  } catch {
    return { status: 'error' };
  }
}

/** true si el dispositivo puede convertir una dirección escrita en coordenadas. */
export const canGeocode = Platform.OS !== 'web';

/**
 * S03: ubica la dirección escrita con la geocodificación gratuita del sistema
 * (iOS/Android). Devuelve null si no la encuentra.
 */
export async function geocodeLine(line: string): Promise<Coordinates | null> {
  if (!canGeocode) return null;
  if (Platform.OS === 'android') {
    const permission = await Location.getForegroundPermissionsAsync();
    if (!permission.granted) {
      const asked = await Location.requestForegroundPermissionsAsync();
      if (!asked.granted) return null;
    }
  }
  // El contexto ayuda al geocodificador a no confundir calles de otras ciudades.
  const query = /ecuador/i.test(line) ? line : `${line}, Quito, Ecuador`;
  const [first] = await Location.geocodeAsync(query);
  return first ? { lat: first.latitude, lng: first.longitude } : null;
}
