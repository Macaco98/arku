import { addressInputSchema, FIXTURE_COVERAGE_ZONES, OutOfCoverageError, type Address } from '@arku/domain';
import { color, space } from '@arku/ui';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AddressFields } from '../../components/AddressFields';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { EmptyState } from '../../components/EmptyState';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { PrimaryButton } from '../../components/PrimaryButton';
import { SecondaryButton } from '../../components/SecondaryButton';
import { StatusBanner } from '../../components/StatusBanner';
import { useCustomer, useServices } from '../../services';
import { setFlash } from '../../services/flash';
import type { NewAddressDraft } from '../../services/registro';
import { useLeaveGuard } from '../../services/useLeaveGuard';

const EMPTY: NewAddressDraft = { label: 'Casa', line: '', reference: '', arrivalInstructions: '' };

function toDraft(a: Address): NewAddressDraft {
  return {
    label: a.label,
    line: a.line,
    reference: a.reference ?? '',
    arrivalInstructions: a.arrivalInstructions ?? '',
    coordinates: a.coordinates,
    zoneName: FIXTURE_COVERAGE_ZONES.find((z) => z.id === a.coverageZoneId)?.name ?? 'Cobertura',
  };
}

function sameDraft(a: NewAddressDraft, b: NewAddressDraft) {
  return (
    a.label === b.label &&
    a.line.trim() === b.line.trim() &&
    a.reference.trim() === b.reference.trim() &&
    a.arrivalInstructions.trim() === b.arrivalInstructions.trim() &&
    a.coordinates?.lat === b.coordinates?.lat &&
    a.coordinates?.lng === b.coordinates?.lng
  );
}

/** P01 › Mis direcciones › Editar o Agregar dirección. Sin `id`, agrega una nueva. */
export default function EditarDireccion() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const customer = useCustomer();
  const { gardens: service } = useServices();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isNew = !id;
  const [original, setOriginal] = useState<NewAddressDraft | undefined>(isNew ? EMPTY : undefined);
  const [draft, setDraft] = useState<NewAddressDraft | undefined>(isNew ? EMPTY : undefined);
  const [gardenCount, setGardenCount] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(isNew ? 'ready' : 'loading');
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>();

  const load = useCallback(async () => {
    if (!id) return;
    setStatus('loading');
    try {
      const [addresses, gardens] = await Promise.all([service.listAddresses(customer.id), service.listGardens(customer.id)]);
      const address = addresses.find((a) => a.id === id);
      if (!address) throw new Error('Dirección no encontrada');
      setOriginal(toDraft(address));
      setDraft(toDraft(address));
      setGardenCount(gardens.filter((g) => g.addressId === id).length);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [service, customer.id, id]);

  useEffect(() => {
    load();
  }, [load]);

  const dirty = !!draft && !!original && !sameDraft(draft, original);
  const guard = useLeaveGuard(dirty, () => router.replace('/perfil/direcciones'));
  const onChange = useCallback((changes: Partial<NewAddressDraft>) => {
    setSaveError(undefined);
    setDraft((d) => (d ? { ...d, ...changes } : d));
  }, []);

  const header = <Stack.Screen options={{ title: isNew ? 'Agregar dirección' : 'Editar dirección' }} />;

  if (!draft) {
    return (
      <View style={styles.content}>
        {header}
        {status === 'error' ? (
          <EmptyState tone="peligro" icon="alert" title="No pudimos cargar esta dirección" message="Inténtalo de nuevo en un momento." actionLabel="Reintentar" onAction={load} />
        ) : (
          <LoadingSkeleton count={3} />
        )}
      </View>
    );
  }

  const line = addressInputSchema.shape.line.safeParse(draft.line);
  const located = !!draft.coordinates && !!draft.zoneName;

  const save = async () => {
    setSubmitted(true);
    if (!line.success || !draft.coordinates || !draft.zoneName) {
      setSaveError(line.success ? 'Ubica la dirección con «Usar mi ubicación» o escribiéndola, y revisa que esté dentro de cobertura.' : undefined);
      return;
    }
    setSaving(true);
    setSaveError(undefined);
    const input = {
      label: draft.label,
      line: draft.line,
      reference: draft.reference,
      arrivalInstructions: draft.arrivalInstructions,
      coordinates: draft.coordinates,
    };
    try {
      if (id) await service.updateAddress(customer.id, id, input);
      else await service.addAddress(customer.id, input);
      setFlash(isNew ? 'Dirección agregada' : 'Dirección actualizada');
      guard.leave();
    } catch (e) {
      setSaveError(e instanceof OutOfCoverageError ? e.message : 'Revisa tu conexión e inténtalo de nuevo.');
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {header}
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {!isNew && gardenCount > 0 ? (
          <StatusBanner
            tipo="Info"
            title={gardenCount === 1 ? 'Aplica a 1 jardín' : `Aplica a ${gardenCount} jardines`}
            message="Las próximas cotizaciones usarán la dirección corregida. Las que ya tienes no cambian."
          />
        ) : null}
        <AddressFields address={draft} onChange={onChange} showErrors={submitted} onBusyChange={setBusy} />
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.lg) }]}>
        {saveError ? <StatusBanner tipo="Error" title="No se pudo guardar la dirección" message={saveError} /> : null}
        <PrimaryButton
          label={saving ? 'Guardando…' : isNew ? 'Guardar dirección' : 'Guardar cambios'}
          onPress={save}
          loading={saving}
          disabled={busy || (!isNew && !dirty) || (submitted && !located)}
        />
        <SecondaryButton tipo="Texto" label="Cancelar" onPress={guard.cancel} />
      </View>
      <ConfirmDialog
        visible={guard.asking}
        title="¿Descartar los cambios?"
        message="Si sales ahora, perderás lo que escribiste en esta dirección."
        confirmLabel="Seguir editando"
        onConfirm={guard.keepEditing}
        destructiveLabel="Descartar cambios"
        onDestructive={guard.discard}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: space.lg, paddingTop: space.sm, gap: space.lg },
  footer: {
    gap: space.xs,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    borderTopWidth: 1,
    borderTopColor: color['border/default'],
    backgroundColor: color['bg/canvas'],
  },
});
