import { SIZE_BAND_LABELS, type Address, type Garden } from '@arku/domain';
import { color, radius, space } from '@arku/ui';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../../components/AppText';
import { EmptyState } from '../../components/EmptyState';
import { photoCountLabel } from '../../components/GardenCard';
import { Icon, type IconName } from '../../components/Icon';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { PrimaryButton } from '../../components/PrimaryButton';
import { SecondaryButton } from '../../components/SecondaryButton';
import { StatusBanner } from '../../components/StatusBanner';
import { useCustomer, useServices } from '../../services';
import { shortDate } from '../../services/format';

/** R02 · ¿Tu jardín sigue igual? Confirma los datos antes de volver a cotizar. */
export default function SigueIgual() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const customer = useCustomer();
  const { gardens: service } = useServices();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data, setData] = useState<{ garden: Garden; address: Address }>();
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [quoting, setQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await service.getGarden(customer.id, id));
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [service, customer.id, id]);

  // Al volver de "Algo cambió · Actualizar" se muestran los datos nuevos.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const quote = async () => {
    setQuoting(true);
    setQuoteError(false);
    try {
      const q = await service.requestQuote(customer.id, id);
      router.replace({ pathname: '/cotizacion/[id]', params: { id: q.id } });
    } catch {
      setQuoteError(true);
      setQuoting(false);
    }
  };

  if (!data) {
    return (
      <View style={styles.content}>
        {status === 'error' ? (
          <EmptyState tone="peligro" icon="alert" title="No pudimos cargar este jardín" message="Inténtalo de nuevo en un momento." actionLabel="Reintentar" onAction={load} />
        ) : (
          <LoadingSkeleton count={2} />
        )}
      </View>
    );
  }

  const { garden, address } = data;
  const last = garden.photos.at(-1);
  const access = [address.arrivalInstructions, garden.accessNotes].filter(Boolean).join(' · ');

  return (
    <View style={styles.flex}>
      <Stack.Screen options={{ title: garden.name }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heading}>
          <AppText variant="Heading/24" tone="primary" accessibilityRole="header">
            ¿Tu jardín sigue igual?
          </AppText>
          <AppText variant="Body/14" tone="secondary">
            Cotizaremos con estos datos. Si algo cambió, actualízalo antes para que el precio sea justo.
          </AppText>
        </View>
        <View style={styles.card}>
          <Row icon="pin" label="Dirección" value={`${address.label} · ${address.line}`} />
          <Row icon="ruler" label="Tamaño" value={`${garden.sizeBand} · ${SIZE_BAND_LABELS[garden.sizeBand]}`} />
          <Row
            icon="camera"
            label="Fotos"
            value={last ? `${photoCountLabel(garden.photos.length)} · última del ${shortDate(last.createdAt)}` : 'Sin fotos'}
          />
          <Row icon="key" label="Acceso" value={access || 'Sin indicaciones'} last />
        </View>
        {quoteError ? <StatusBanner tipo="Error" title="No pudimos cotizar" message="Inténtalo de nuevo en un momento." /> : null}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.lg) }]}>
        <PrimaryButton label="Sí, sigue igual · Cotizar" onPress={quote} loading={quoting} />
        <SecondaryButton
          label="Algo cambió · Actualizar"
          disabled={quoting}
          onPress={() => router.push({ pathname: '/jardin/[id]/editar', params: { id } })}
        />
      </View>
    </View>
  );
}

function Row({ icon, label, value, last = false }: { icon: IconName; label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.row, !last && styles.divider]}>
      <Icon name={icon} size={20} color={color['text/brand']} />
      <View style={styles.flex}>
        <AppText variant="Caption/12" tone="secondary">
          {label}
        </AppText>
        <AppText variant="Body/16" tone="primary">
          {value}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: space.xl, paddingTop: space.sm, gap: space.lg },
  heading: { gap: space.xs },
  card: { borderRadius: radius.lg, borderWidth: 1, borderColor: color['border/default'], backgroundColor: color['bg/surface'] },
  row: { flexDirection: 'row', gap: space.md, padding: space.lg, alignItems: 'flex-start' },
  divider: { borderBottomWidth: 1, borderBottomColor: color['border/default'] },
  footer: {
    gap: space.sm,
    paddingHorizontal: space.xl,
    paddingTop: space.lg,
    borderTopWidth: 1,
    borderTopColor: color['border/default'],
    backgroundColor: color['bg/canvas'],
  },
});
