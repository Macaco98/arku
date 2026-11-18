import { determineQuoteRoute, formatUSD, SIZE_BAND_LABELS, type Address, type Garden, type Quote } from '@arku/domain';
import { color, radius, space, touchMin } from '@arku/ui';
import { Image } from 'expo-image';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../../../components/AppText';
import { Chip } from '../../../components/Chip';
import { EmptyState } from '../../../components/EmptyState';
import { GardenPhoto } from '../../../components/GardenPhoto';
import { photoCountLabel } from '../../../components/GardenCard';
import { Icon, type IconName } from '../../../components/Icon';
import { LoadingSkeleton } from '../../../components/LoadingSkeleton';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { SecondaryButton } from '../../../components/SecondaryButton';
import { SIZE_NAMES } from '../../../components/SizeOption';
import { Toast } from '../../../components/Toast';
import { useCustomer, useServices } from '../../../services';
import { takeFlash } from '../../../services/flash';
import { usePhotoUri } from '../../../services/photos';
import { describeAddress } from '../../../services/useGardenList';

interface Loaded {
  garden: Garden;
  address: Address;
  quote?: Quote;
}

function quoteSummary(q: Quote) {
  const price = q.price ? formatUSD(q.price.baseCents) : '';
  switch (q.status) {
    case 'automatic':
    case 'ready':
      return `${price} · Lista para aceptar`;
    case 'pending_review':
      return 'En revisión manual';
    case 'accepted':
      return `${price} · Aceptada`;
    case 'declined':
      return `${price} · No aceptada`;
    case 'expired':
      return 'Vencida';
  }
}

/** D01 · Detalle de jardín. */
export default function DetalleJardin() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const customer = useCustomer();
  const { gardens: service } = useServices();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data, setData] = useState<Loaded>();
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [toast, setToast] = useState<string>();
  const cover = usePhotoUri(data?.garden.photos[0]?.storageKey);

  const load = useCallback(async () => {
    try {
      const { garden, address } = await service.getGarden(customer.id, id);
      const quote = await service.latestQuote(customer.id, id);
      setData({ garden, address, quote });
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [service, customer.id, id]);

  useFocusEffect(
    useCallback(() => {
      load();
      const flash = takeFlash();
      if (flash) setToast(flash);
    }, [load]),
  );

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(undefined), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const edit = () => router.push({ pathname: '/jardin/[id]/editar', params: { id } });

  const header = (
    <Stack.Screen
      options={{
        title: data?.garden.name ?? 'Jardín',
        headerRight: () =>
          data ? (
            <Pressable onPress={edit} accessibilityRole="button" hitSlop={8} style={styles.headerAction}>
              <AppText variant="Label/14" tone="brand">
                Editar
              </AppText>
            </Pressable>
          ) : null,
      }}
    />
  );

  if (!data) {
    return (
      <View style={styles.content}>
        {header}
        {status === 'error' ? (
          <EmptyState
            tone="peligro"
            icon="alert"
            title="No pudimos cargar este jardín"
            message="Inténtalo de nuevo en un momento."
            actionLabel="Reintentar"
            onAction={() => {
              setStatus('loading');
              load();
            }}
          />
        ) : (
          <>
            <View style={styles.hero} />
            <LoadingSkeleton count={2} />
          </>
        )}
      </View>
    );
  }

  const { garden, address, quote } = data;
  const automatic = determineQuoteRoute(garden.sizeBand, garden.photos.length) === 'automatic';

  return (
    <View style={styles.flex}>
      {header}
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          {cover ? (
            <Image source={{ uri: cover }} style={styles.fill} contentFit="cover" accessibilityLabel={`Foto de ${garden.name}`} />
          ) : garden.photos.length > 0 ? (
            <View style={styles.fill}>
              <GardenPhoto width="100%" height="100%" />
            </View>
          ) : (
            <View style={[styles.fill, styles.noPhoto]}>
              <Icon name="image" size={32} color={color['text/secondary']} />
              <AppText variant="Body/14" tone="secondary">
                Sin fotos
              </AppText>
            </View>
          )}
          {garden.photos.length > 0 ? (
            <View style={styles.count}>
              <Icon name="camera" size={14} color={color['text/primary']} />
              <AppText variant="Caption/12" tone="primary">
                {photoCountLabel(garden.photos.length)}
              </AppText>
            </View>
          ) : null}
        </View>

        <View style={styles.chips}>
          <Chip tone="marca" label={`Tamaño ${garden.sizeBand} · ${SIZE_BAND_LABELS[garden.sizeBand]}`} />
          <Chip tone={automatic ? 'neutro' : 'acento'} label={automatic ? 'Precio inmediato' : 'Revisión manual'} />
        </View>

        <View style={styles.card}>
          <Row icon="pin" label="Dirección" value={describeAddress(address)} detail={address.reference ? `Ref.: ${address.reference}` : undefined} />
          <Row icon="ruler" label="Tamaño" value={`${garden.sizeBand} · ${SIZE_BAND_LABELS[garden.sizeBand]}`} detail={`${SIZE_NAMES[garden.sizeBand]} · rango aproximado, sin medida exacta`} />
          <Row icon="key" label="Indicaciones al llegar" value={address.arrivalInstructions || 'Sin indicaciones'} />
          <Row icon="note" label="Notas" value={garden.accessNotes || 'Sin notas'} last={!quote} />
          {quote ? (
            <Row
              icon="clock"
              label="Última cotización"
              value={quoteSummary(quote)}
              onPress={() => router.push({ pathname: '/cotizacion/[id]', params: { id: quote.id } })}
              last
            />
          ) : null}
        </View>
      </ScrollView>
      {toast ? <Toast icon="check" message={toast} bottom={170} /> : null}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.lg) }]}>
        <PrimaryButton label="Cotizar mantenimiento" onPress={() => router.push({ pathname: '/cotizar/[id]', params: { id } })} />
        <SecondaryButton tipo="Texto" label="Editar jardín" onPress={edit} />
      </View>
    </View>
  );
}

function Row({
  icon,
  label,
  value,
  detail,
  onPress,
  last = false,
}: {
  icon: IconName;
  label: string;
  value: string;
  detail?: string;
  onPress?: () => void;
  last?: boolean;
}) {
  const body: ReactNode = (
    <>
      <Icon name={icon} size={20} color={color['text/brand']} />
      <View style={styles.flex}>
        <AppText variant="Caption/12" tone="secondary">
          {label}
        </AppText>
        <AppText variant="Body/16" tone="primary">
          {value}
        </AppText>
        {detail ? (
          <AppText variant="Caption/12" tone="secondary">
            {detail}
          </AppText>
        ) : null}
      </View>
      {onPress ? <Icon name="chevron-right" size={20} color={color['text/secondary']} /> : null}
    </>
  );
  const style = [styles.row, !last && styles.divider];
  return onPress ? (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [...style, pressed && { backgroundColor: color['bg/subtle'] }]}>
      {body}
    </Pressable>
  ) : (
    <View style={style}>{body}</View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: space.xl, paddingTop: space.sm, gap: space.lg },
  headerAction: { minHeight: touchMin, justifyContent: 'center', paddingHorizontal: space.sm },
  hero: { height: 196, borderRadius: radius.xl, overflow: 'hidden', backgroundColor: color['bg/subtle'] },
  fill: { width: '100%', height: '100%' },
  noPhoto: { alignItems: 'center', justifyContent: 'center', gap: space.xs },
  count: {
    position: 'absolute',
    left: space.md,
    bottom: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    paddingHorizontal: space.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: color['bg/surface'],
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  card: { borderRadius: radius.lg, borderWidth: 1, borderColor: color['border/default'], backgroundColor: color['bg/surface'], overflow: 'hidden' },
  row: { flexDirection: 'row', gap: space.md, padding: space.lg, alignItems: 'flex-start' },
  divider: { borderBottomWidth: 1, borderBottomColor: color['border/default'] },
  footer: {
    gap: space.xs,
    paddingHorizontal: space.xl,
    paddingTop: space.lg,
    borderTopWidth: 1,
    borderTopColor: color['border/default'],
    backgroundColor: color['bg/canvas'],
  },
});
