import { gardenInputSchema, MAX_ACCESS_NOTES, MAX_PHOTOS_PER_GARDEN, SIZE_BAND_LABELS, SIZE_BANDS, determineQuoteRoute, type Address, type Garden, type SizeBand } from '@arku/domain';
import { color, radius, space, touchMin } from '@arku/ui';
import { useLocalSearchParams, useNavigation, usePreventRemove, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AddressOption } from '../../../components/AddressOption';
import { AppText } from '../../../components/AppText';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { EmptyState } from '../../../components/EmptyState';
import { LoadingSkeleton } from '../../../components/LoadingSkeleton';
import { PhotoUploader } from '../../../components/PhotoUploader';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { SecondaryButton } from '../../../components/SecondaryButton';
import { SIZE_NAMES } from '../../../components/SizeOption';
import { StatusBanner } from '../../../components/StatusBanner';
import { TextField } from '../../../components/TextField';
import { useCustomer, useServices } from '../../../services';
import { setFlash } from '../../../services/flash';
import { discardPhoto, photoUri, pickGardenPhotos } from '../../../services/photos';

interface EditPhoto {
  /** id de la foto ya guardada; las nuevas no tienen. */
  id?: string;
  storageKey: string;
  uri?: string;
}

interface Form {
  name: string;
  addressId: string;
  sizeBand: SizeBand;
  accessNotes: string;
  photos: EditPhoto[];
}

function toForm(g: Garden): Form {
  return {
    name: g.name,
    addressId: g.addressId,
    sizeBand: g.sizeBand,
    accessNotes: g.accessNotes,
    photos: g.photos.map((p) => ({ id: p.id, storageKey: p.storageKey, uri: photoUri(p.storageKey) })),
  };
}

function sameForm(a: Form, b: Form) {
  return (
    a.name.trim() === b.name.trim() &&
    a.addressId === b.addressId &&
    a.sizeBand === b.sizeBand &&
    a.accessNotes.trim() === b.accessNotes.trim() &&
    a.photos.map((p) => p.storageKey).join() === b.photos.map((p) => p.storageKey).join()
  );
}

/** D02 · Editar jardín, con D03 descartar cambios y D04 guardando. */
export default function EditarJardin() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const customer = useCustomer();
  const { gardens: service } = useServices();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [original, setOriginal] = useState<Form>();
  const [form, setForm] = useState<Form>();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>();
  const [uploading, setUploading] = useState(false);
  const [photoProblem, setPhotoProblem] = useState<string>();
  const [asking, setAsking] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const repeat = useRef<() => void>(undefined);

  const load = useCallback(async () => {
    try {
      const [{ garden }, list] = await Promise.all([service.getGarden(customer.id, id), service.listAddresses(customer.id)]);
      setOriginal(toForm(garden));
      setForm(toForm(garden));
      setAddresses(list);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [service, customer.id, id]);

  useEffect(() => {
    load();
  }, [load]);

  const dirty = !!form && !!original && !sameForm(form, original);

  // D03: volver con cambios sin guardar pregunta antes de salir.
  usePreventRemove(dirty && !leaving, ({ repeat: again }) => {
    repeat.current = again;
    setAsking(true);
  });

  useEffect(() => {
    if (leaving && repeat.current) {
      const again = repeat.current;
      repeat.current = undefined;
      again();
    } else if (leaving) {
      if (navigation.canGoBack()) navigation.goBack();
      else router.replace({ pathname: '/jardin/[id]', params: { id } });
    }
  }, [leaving, navigation, router, id]);

  const discardNewPhotos = () => {
    if (!form || !original) return;
    const kept = new Set(original.photos.map((p) => p.storageKey));
    form.photos.filter((p) => !kept.has(p.storageKey)).forEach((p) => discardPhoto(p.storageKey));
  };

  if (!form || !original) {
    return (
      <View style={styles.content}>
        {status === 'error' ? (
          <EmptyState tone="peligro" icon="alert" title="No pudimos cargar este jardín" message="Inténtalo de nuevo en un momento." actionLabel="Reintentar" onAction={load} />
        ) : (
          <LoadingSkeleton count={3} />
        )}
      </View>
    );
  }

  const set = (changes: Partial<Form>) => setForm((f) => (f ? { ...f, ...changes } : f));
  const name = gardenInputSchema.shape.name.safeParse(form.name);
  const notesTooLong = form.accessNotes.length > MAX_ACCESS_NOTES;
  const automatic = determineQuoteRoute(form.sizeBand, form.photos.length) === 'automatic';

  const addPhotos = async () => {
    setPhotoProblem(undefined);
    setUploading(true);
    const result = await pickGardenPhotos(MAX_PHOTOS_PER_GARDEN - form.photos.length);
    setUploading(false);
    if (result.status === 'ok') set({ photos: [...form.photos, ...result.photos].slice(0, MAX_PHOTOS_PER_GARDEN) });
    if (result.status === 'denied') setPhotoProblem('Activa el acceso a tus fotos en los ajustes del teléfono.');
    if (result.status === 'error') setPhotoProblem('No se pudo subir la foto. Inténtalo de nuevo.');
  };

  const removePhoto = (photo: EditPhoto) => {
    if (!photo.id) discardPhoto(photo.storageKey);
    set({ photos: form.photos.filter((p) => p.storageKey !== photo.storageKey) });
  };

  const save = async () => {
    if (!name.success || notesTooLong) return;
    setSaving(true);
    setSaveError(undefined);
    try {
      const keptIds = new Set(form.photos.map((p) => p.id).filter(Boolean));
      await service.editGarden(customer.id, id, {
        name: form.name,
        addressId: form.addressId,
        sizeBand: form.sizeBand,
        accessNotes: form.accessNotes,
        removePhotoIds: original.photos.filter((p) => p.id && !keptIds.has(p.id)).map((p) => p.id!),
        addPhotoKeys: form.photos.filter((p) => !p.id).map((p) => p.storageKey),
      });
      original.photos.filter((p) => p.id && !keptIds.has(p.id)).forEach((p) => discardPhoto(p.storageKey));
      setFlash('Cambios guardados');
      setLeaving(true);
    } catch (e) {
      setSaveError(e instanceof Error && e.message ? e.message : 'Inténtalo de nuevo.');
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <StatusBanner tipo="Info" title="Los cambios aplican a futuras cotizaciones" message="Las cotizaciones y reservas que ya existan no se modifican." />

        <TextField
          label="Nombre del jardín"
          value={form.name}
          onChangeText={(v) => set({ name: v })}
          maxLength={40}
          error={!name.success ? name.error.issues[0]?.message : undefined}
          helper="Así lo verás en Mis jardines."
        />

        <View style={styles.group}>
          <AppText variant="Label/14" tone="primary">
            Dirección
          </AppText>
          <View style={styles.group} accessibilityRole="radiogroup">
            {addresses.map((a) => (
              <AddressOption
                key={a.id}
                label={a.label}
                line={a.line}
                gardenCount={-1}
                selected={form.addressId === a.id}
                onPress={() => set({ addressId: a.id })}
              />
            ))}
          </View>
          <AppText variant="Caption/12" tone="secondary">
            Elige otra de tus direcciones guardadas.
          </AppText>
        </View>

        <View style={styles.group}>
          <AppText variant="Label/14" tone="primary">
            Tamaño
          </AppText>
          <View style={styles.sizes} accessibilityRole="radiogroup">
            {SIZE_BANDS.map((s) => {
              const selected = form.sizeBand === s;
              return (
                <Pressable
                  key={s}
                  onPress={() => set({ sizeBand: s })}
                  accessibilityRole="radio"
                  accessibilityState={{ selected, checked: selected }}
                  accessibilityLabel={`${s}, ${SIZE_NAMES[s]}, ${SIZE_BAND_LABELS[s]}`}
                  style={[
                    styles.size,
                    selected
                      ? { backgroundColor: color['bg/brand-soft'], borderColor: color['action/primary'], borderWidth: 2 }
                      : { backgroundColor: color['bg/surface'], borderColor: color['border/default'], borderWidth: 1 },
                  ]}
                >
                  <AppText variant="Body/16 Strong" tone="primary">
                    {s}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
          <AppText variant="Caption/12" tone="secondary">
            {form.sizeBand} · {SIZE_NAMES[form.sizeBand]} · {SIZE_BAND_LABELS[form.sizeBand]} · {automatic ? 'Precio inmediato' : 'Revisión manual'}
          </AppText>
        </View>

        <View style={styles.group}>
          <AppText variant="Label/14" tone="primary">
            Fotos
          </AppText>
          <PhotoUploader photos={form.photos} max={MAX_PHOTOS_PER_GARDEN} uploading={uploading} onAdd={addPhotos} onRemove={removePhoto} />
          <AppText variant="Caption/12" tone="secondary">
            {form.photos.length} de {MAX_PHOTOS_PER_GARDEN} fotos
          </AppText>
          {photoProblem ? <StatusBanner tipo="Error" title="Fotos" message={photoProblem} /> : null}
        </View>

        <TextField
          label="Notas sobre el jardín (opcional)"
          placeholder="Mascotas, plantas delicadas, por dónde se entra al jardín…"
          value={form.accessNotes}
          onChangeText={(v) => set({ accessNotes: v })}
          multiline
          maxLength={MAX_ACCESS_NOTES}
          error={notesTooLong ? `Máximo ${MAX_ACCESS_NOTES} caracteres.` : undefined}
          helper={`Opcional · ${form.accessNotes.length}/${MAX_ACCESS_NOTES} caracteres`}
        />
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.lg) }]}>
        {saveError ? <StatusBanner tipo="Error" title="No se pudieron guardar los cambios" message={saveError} /> : null}
        <PrimaryButton
          label={saving ? 'Guardando…' : 'Guardar cambios'}
          onPress={save}
          loading={saving}
          disabled={!dirty || !name.success || notesTooLong || uploading}
        />
        <SecondaryButton tipo="Texto" label="Cancelar" onPress={() => (dirty ? setAsking(true) : setLeaving(true))} />
      </View>
      <ConfirmDialog
        visible={asking}
        title="¿Descartar los cambios?"
        message="Si sales ahora, perderás lo que editaste en este jardín."
        confirmLabel="Seguir editando"
        onConfirm={() => {
          repeat.current = undefined;
          setAsking(false);
        }}
        destructiveLabel="Descartar cambios"
        onDestructive={() => {
          setAsking(false);
          discardNewPhotos();
          setLeaving(true);
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: space.xl, paddingTop: space.sm, gap: space.xl },
  group: { gap: space.sm },
  sizes: { flexDirection: 'row', gap: space.sm },
  size: { flex: 1, minHeight: touchMin + 8, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  footer: {
    gap: space.xs,
    paddingHorizontal: space.xl,
    paddingTop: space.lg,
    borderTopWidth: 1,
    borderTopColor: color['border/default'],
    backgroundColor: color['bg/canvas'],
  },
});
