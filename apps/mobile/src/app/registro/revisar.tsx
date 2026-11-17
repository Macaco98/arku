import { SIZE_BAND_LABELS } from '@arku/domain';
import { color, radius, space, touchMin } from '@arku/ui';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../components/AppText';
import { PrimaryButton } from '../../components/PrimaryButton';
import { quoteHint, SIZE_NAMES } from '../../components/SizeOption';
import { StatusBanner } from '../../components/StatusBanner';
import { StepLayout } from '../../components/StepLayout';
import { useCustomer, useServices } from '../../services';
import { useRegistro, useRegistroExit } from '../../services/registro';
import { useGardenList } from '../../services/useGardenList';

/** S06 · Confirmar jardín: resumen con "Editar" por sección y "Guardar jardín". */
export default function Revisar() {
  const router = useRouter();
  const customer = useCustomer();
  const { gardens: service } = useServices();
  const { draft } = useRegistro();
  const { exit } = useRegistroExit();
  const { addresses } = useGardenList();
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle');

  const saved = draft.savedAddressId ? addresses.find((a) => a.id === draft.savedAddressId) : undefined;
  const address = saved ?? draft.newAddress;
  const zone = saved ? undefined : draft.newAddress.zoneName;
  const addressStep = draft.savedAddressId ? '/registro' : '/registro/direccion';
  const size = draft.sizeBand;
  const photos = draft.photos;
  const hint = size ? quoteHint(size) : undefined;
  const lNoPhotos = size === 'L' && photos.length === 0;

  const save = async () => {
    if (!size) return;
    setStatus('saving');
    try {
      const n = draft.newAddress;
      const garden = await service.registerGarden(customer.id, {
        address: draft.savedAddressId
          ? { addressId: draft.savedAddressId }
          : {
              label: n.label,
              line: n.line,
              reference: n.reference.trim() || undefined,
              arrivalInstructions: n.arrivalInstructions.trim() || undefined,
              coordinates: n.coordinates ?? { lat: NaN, lng: NaN },
            },
        garden: { name: draft.name, sizeBand: size, accessNotes: draft.accessNotes },
        photoKeys: photos.map((p) => p.storageKey),
      });
      exit({ keepPhotos: true });
      router.navigate({ pathname: '/jardines', params: { guardado: garden.name } });
    } catch {
      setStatus('error');
    }
  };

  return (
    <StepLayout
      step={4}
      stepLabel="Confirmar"
      title="Revisa tu jardín"
      subtitle="Confirma los datos antes de guardarlo. Podrás editarlo cuando quieras."
      footer={
        <>
          {status === 'error' ? (
            <StatusBanner tipo="Error" title="No se pudo guardar" message="Inténtalo de nuevo. Tus datos siguen aquí." />
          ) : null}
          <PrimaryButton
            label={status === 'saving' ? 'Guardando…' : status === 'error' ? 'Reintentar' : 'Guardar jardín'}
            onPress={save}
            loading={status === 'saving'}
            disabled={!size}
          />
        </>
      }
    >
      <View style={styles.card}>
        <Row label="Nombre" value={draft.name.trim()} onEdit={() => router.navigate(addressStep)} />
        <Row
          label="Dirección"
          value={zone ? `${address.line}, ${zone}` : address.line}
          detail={[address.reference ? `Ref.: ${address.reference}` : '', address.arrivalInstructions ? `Al llegar: ${address.arrivalInstructions}` : '']
            .filter(Boolean)
            .join('\n')}
          onEdit={() => router.navigate(addressStep)}
        />
        <Row
          label="Tamaño"
          value={size ? `${size} · ${SIZE_BAND_LABELS[size]}` : 'Sin elegir'}
          detail={size && hint ? `${SIZE_NAMES[size]} · ${lNoPhotos ? 'Revisión manual (sin fotos)' : hint.text}` : undefined}
          onEdit={() => router.navigate('/registro/tamano')}
        />
        <Row label="Fotos" value={photos.length ? `${photos.length} ${photos.length === 1 ? 'foto' : 'fotos'}` : 'Sin fotos'} onEdit={() => router.navigate('/registro/fotos')}>
          {photos.length ? (
            <View style={styles.thumbs}>
              {photos.slice(0, 3).map((p) => (
                <Image key={p.storageKey} source={{ uri: p.uri }} style={styles.thumb} contentFit="cover" accessible={false} />
              ))}
              {photos.length > 3 ? (
                <View style={[styles.thumb, styles.more]}>
                  <AppText variant="Label/14" tone="primary">
                    +{photos.length - 3}
                  </AppText>
                </View>
              ) : null}
            </View>
          ) : null}
        </Row>
        <Row label="Notas del jardín" value={draft.accessNotes.trim() || 'Sin notas'} onEdit={() => router.navigate('/registro/fotos')} last />
      </View>
    </StepLayout>
  );
}

function Row({
  label,
  value,
  detail,
  children,
  onEdit,
  last = false,
}: {
  label: string;
  value: string;
  detail?: string;
  children?: ReactNode;
  onEdit: () => void;
  last?: boolean;
}) {
  return (
    <View style={[styles.row, !last && styles.divider]}>
      <View style={styles.texts}>
        <AppText variant="Caption/12" tone="secondary">
          {label}
        </AppText>
        <AppText variant="Body/16 Strong" tone="primary">
          {value}
        </AppText>
        {detail ? (
          <AppText variant="Body/14" tone="secondary">
            {detail}
          </AppText>
        ) : null}
        {children}
      </View>
      <Pressable onPress={onEdit} accessibilityRole="button" accessibilityLabel={`Editar ${label.toLowerCase()}`} style={styles.edit}>
        <AppText variant="Label/14" tone="brand">
          Editar
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, borderWidth: 1, borderColor: color['border/default'], backgroundColor: color['bg/surface'] },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg },
  divider: { borderBottomWidth: 1, borderBottomColor: color['border/default'] },
  texts: { flex: 1, gap: 2 },
  edit: { minHeight: touchMin, minWidth: touchMin, alignItems: 'flex-end', justifyContent: 'center' },
  thumbs: { flexDirection: 'row', gap: space.sm, marginTop: space.sm },
  thumb: { width: 60, height: 60, borderRadius: radius.md, backgroundColor: color['bg/subtle'] },
  more: { alignItems: 'center', justifyContent: 'center' },
});
