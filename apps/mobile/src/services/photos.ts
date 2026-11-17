import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

/** Foto lista para guardar: la clave privada y una URI local para mostrarla. */
export interface PickedPhoto {
  storageKey: string;
  uri: string;
}

const FOLDER = 'jardines';

/**
 * En web (vista previa) no hay almacenamiento de archivos: las fotos viven
 * solo en memoria durante la sesión del navegador.
 */
const webMemory = new Map<string, string>();

function newKey(ext: string) {
  return `${FOLDER}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
}

/**
 * MOCK DE DESARROLLO del almacenamiento privado: copia la foto a la carpeta
 * de documentos de la app (no es pública) y devuelve su clave relativa.
 * En producción se sube a un bucket privado y se guarda la misma clave.
 */
async function storePrivately(asset: ImagePicker.ImagePickerAsset): Promise<PickedPhoto> {
  const ext = (asset.fileName?.split('.').pop() ?? asset.mimeType?.split('/').pop() ?? 'jpg').toLowerCase();
  const storageKey = newKey(ext);
  if (Platform.OS === 'web') {
    webMemory.set(storageKey, asset.uri);
    return { storageKey, uri: asset.uri };
  }
  const dir = new Directory(Paths.document, FOLDER);
  if (!dir.exists) dir.create({ intermediates: true });
  const dest = new File(Paths.document, storageKey);
  new File(asset.uri).copy(dest);
  return { storageKey, uri: dest.uri };
}

export type PickResult =
  | { status: 'ok'; photos: PickedPhoto[] }
  | { status: 'cancelled' }
  | { status: 'denied' }
  | { status: 'error' };

/** S05: elige hasta `limit` fotos de la galería y las guarda en privado. */
export async function pickGardenPhotos(limit: number): Promise<PickResult> {
  if (limit <= 0) return { status: 'cancelled' };
  try {
    if (Platform.OS !== 'web') {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) return { status: 'denied' };
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: limit > 1,
      selectionLimit: limit,
      quality: 0.7,
    });
    if (result.canceled) return { status: 'cancelled' };
    const photos = await Promise.all(result.assets.slice(0, limit).map(storePrivately));
    return { status: 'ok', photos };
  } catch {
    return { status: 'error' };
  }
}

/** URI local para mostrar una foto guardada, o undefined si no está en este dispositivo. */
export function photoUri(storageKey: string): string | undefined {
  if (Platform.OS === 'web') return webMemory.get(storageKey);
  try {
    const file = new File(Paths.document, storageKey);
    return file.exists ? file.uri : undefined;
  } catch {
    return undefined;
  }
}

/** Borra una foto que se quitó antes de guardar el jardín. */
export function discardPhoto(storageKey: string) {
  if (Platform.OS === 'web') {
    webMemory.delete(storageKey);
    return;
  }
  try {
    const file = new File(Paths.document, storageKey);
    if (file.exists) file.delete();
  } catch {
    // Si no se puede borrar, queda huérfana en la carpeta privada; no afecta al cliente.
  }
}
