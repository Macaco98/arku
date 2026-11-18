import { useEffect, useState } from 'react';
import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import { supabase } from './backend';

/** Foto lista para guardar: la clave privada y una URI local para mostrarla. */
export interface PickedPhoto {
  storageKey: string;
  uri: string;
}

const FOLDER = 'jardines';
/** Bucket privado de Supabase (supabase/migrations). */
const BUCKET = 'jardines';

/** Con Supabase, las fotos van a la carpeta del cliente en el bucket: `<uid>/archivo.jpg`. */
let owner: string | null = null;
export function setPhotoOwner(userId: string | null) {
  owner = userId;
}

/**
 * En web (vista previa) no hay almacenamiento de archivos: las fotos viven
 * solo en memoria durante la sesión del navegador.
 */
const webMemory = new Map<string, string>();

function newKey(ext: string) {
  const folder = supabase && owner ? owner : FOLDER;
  return `${folder}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
}

/** Sube la foto al bucket privado. Solo se guarda la clave, nunca una URL pública. */
async function uploadPrivately(storageKey: string, uri: string, mimeType: string | undefined) {
  if (!supabase) return;
  const body = await (await fetch(uri)).arrayBuffer();
  const { error } = await supabase.storage.from(BUCKET).upload(storageKey, body, { contentType: mimeType ?? 'image/jpeg', upsert: false });
  if (error) throw error;
}

/**
 * Guarda la foto en privado y devuelve su clave. Con Supabase la sube al bucket privado
 * y además deja una copia en el teléfono para mostrarla sin descargarla. En modo
 * demostración (MOCK) solo la copia a la carpeta de documentos de la app.
 */
async function storePrivately(asset: ImagePicker.ImagePickerAsset): Promise<PickedPhoto> {
  const ext = (asset.fileName?.split('.').pop() ?? asset.mimeType?.split('/').pop() ?? 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const storageKey = newKey(ext);
  await uploadPrivately(storageKey, asset.uri, asset.mimeType);
  if (Platform.OS === 'web') {
    webMemory.set(storageKey, asset.uri);
    return { storageKey, uri: asset.uri };
  }
  const dir = new Directory(Paths.document, storageKey.split('/')[0]!);
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

/** Borra una foto que se quitó (antes de guardar el jardín o al editarlo). */
export function discardPhoto(storageKey: string) {
  if (supabase && owner && storageKey.startsWith(`${owner}/`)) {
    // Si falla, la foto queda huérfana en la carpeta privada del cliente; no afecta al jardín.
    supabase.storage.from(BUCKET).remove([storageKey]).catch(() => undefined);
  }
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

/** URLs firmadas ya pedidas en esta sesión. Duran una hora y nunca se guardan. */
const signed = new Map<string, { url: string; expires: number }>();
const SIGNED_SECONDS = 3600;

async function signedUri(storageKey: string) {
  const cached = signed.get(storageKey);
  if (cached && cached.expires > Date.now() + 60_000) return cached.url;
  if (!supabase) return undefined;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(storageKey, SIGNED_SECONDS);
  if (error || !data) return undefined;
  signed.set(storageKey, { url: data.signedUrl, expires: Date.now() + SIGNED_SECONDS * 1000 });
  return data.signedUrl;
}

/**
 * URI para mostrar una foto privada: la copia del teléfono si existe; si no (p. ej. se
 * subió desde otro teléfono), un enlace temporal firmado del bucket privado.
 */
export function usePhotoUri(storageKey: string | undefined, localUri?: string): string | undefined {
  const local = localUri ?? (storageKey ? photoUri(storageKey) : undefined);
  const [remote, setRemote] = useState<string>();
  useEffect(() => {
    setRemote(undefined);
    if (local || !storageKey || !supabase) return;
    let alive = true;
    signedUri(storageKey).then((url) => alive && setRemote(url));
    return () => {
      alive = false;
    };
  }, [storageKey, local]);
  return local ?? remote;
}
