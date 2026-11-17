import { DEMO_REVIEW_TARIFFS, MAX_PHOTOS_PER_GARDEN, type Garden, type Quote } from '@arku/domain';
import { color, elevation, radius, space } from '@arku/ui';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../../components/AppText';
import { BottomSheet } from '../../components/BottomSheet';
import { EmptyState } from '../../components/EmptyState';
import { GardenCard } from '../../components/GardenCard';
import { Icon } from '../../components/Icon';
import { InfoList } from '../../components/InfoList';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { PriceSummary } from '../../components/PriceSummary';
import { PrimaryButton } from '../../components/PrimaryButton';
import { QuoteStatusCard } from '../../components/QuoteStatusCard';
import { SecondaryButton } from '../../components/SecondaryButton';
import { StatusBanner } from '../../components/StatusBanner';
import { useCustomer, useServices } from '../../services';
import { pickGardenPhotos } from '../../services/photos';
import { describeAddress } from '../../services/useGardenList';

/** Alcance propuesto en Figma. Pendiente de validar con jardineros. */
const INCLUYE = [
  'Corte de césped, si tu jardín lo tiene',
  'Poda ligera de arbustos y plantas',
  'Deshierbe superficial',
  'Limpieza del área trabajada',
  'El jardinero se lleva los residuos vegetales',
  'Herramientas y materiales de uso común',
];
const NO_INCLUYE = [
  'Tala o poda en altura',
  'Paisajismo o instalación de riego',
  'Fumigación o fertilizantes especiales',
  'Compra de plantas o uso de maquinaria especializada',
];
const PASOS = [
  'Un especialista revisa los datos de tu jardín.',
  'La verás en Mis jardines cuando esté lista.',
  'Podrás revisarla y continuar con la reserva.',
];

interface Loaded {
  quote: Quote;
  garden?: Garden;
  location: string;
}

/** S07 · Cotización automática y S08 · Revisión manual, lista o vencida. */
export default function Cotizacion() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const customer = useCustomer();
  const { gardens: service, backend } = useServices();
  const { id, guardado } = useLocalSearchParams<{ id: string; guardado?: string }>();
  const [data, setData] = useState<Loaded>();
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [busy, setBusy] = useState<'accept' | 'decline' | 'photos' | 'requote' | 'demo'>();
  const [actionError, setActionError] = useState<string>();
  const [sheet, setSheet] = useState(false);

  const load = useCallback(async () => {
    try {
      const quote = await service.getQuote(customer.id, id);
      const [gardens, addresses] = await Promise.all([service.listGardens(customer.id), service.listAddresses(customer.id)]);
      const garden = gardens.find((g) => g.id === quote.gardenId);
      const address = addresses.find((a) => a.id === garden?.addressId);
      setData({ quote, garden, location: describeAddress(address) });
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [service, customer.id, id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const run = async (kind: NonNullable<typeof busy>, action: () => Promise<void>) => {
    setBusy(kind);
    setActionError(undefined);
    try {
      await action();
    } catch (e) {
      setActionError(e instanceof Error && e.message ? e.message : 'Algo salió mal. Inténtalo de nuevo.');
    } finally {
      setBusy(undefined);
    }
  };

  const goToGardens = () => router.navigate('/jardines');
  const openQuote = (quote: Quote) => router.replace({ pathname: '/cotizacion/[id]', params: { id: quote.id } });

  const accept = () =>
    run('accept', async () => {
      await service.respondToQuote(customer.id, id, 'accepted');
      await load();
      setSheet(true);
    });
  const decline = () =>
    run('decline', async () => {
      await service.respondToQuote(customer.id, id, 'declined');
      goToGardens();
    });
  const requote = () =>
    run('requote', async () => {
      if (!data) return;
      openQuote(await service.requestQuote(customer.id, data.quote.gardenId));
    });
  const addPhotos = () =>
    run('photos', async () => {
      if (!data?.garden) return;
      const picked = await pickGardenPhotos(MAX_PHOTOS_PER_GARDEN - data.garden.photos.length);
      if (picked.status === 'denied') throw new Error('Activa el acceso a tus fotos en los ajustes del teléfono.');
      if (picked.status === 'error') throw new Error('No se pudo subir la foto. Inténtalo de nuevo.');
      if (picked.status !== 'ok') return;
      for (const p of picked.photos) await service.addPhoto(customer.id, data.garden.id, p.storageKey);
      openQuote(await service.requestQuote(customer.id, data.garden.id));
    });
  // DEMO: mientras no exista el panel de Arku, el cliente puede simular el fin de la revisión.
  const simulateReview = () =>
    run('demo', async () => {
      if (!data) return;
      await service.completeReview(data.quote.id, DEMO_REVIEW_TARIFFS[data.quote.snapshot.sizeBand]);
      await load();
    });

  if (status === 'loading' || !data) {
    return (
      <View style={styles.content}>
        {status === 'error' ? (
          <EmptyState
            tone="peligro"
            icon="alert"
            title="No pudimos cargar la cotización"
            message="Inténtalo de nuevo en un momento."
            actionLabel="Reintentar"
            onAction={() => {
              setStatus('loading');
              load();
            }}
          />
        ) : (
          <>
            <AppText variant="Body/14" tone="secondary" accessibilityLiveRegion="polite">
              Calculando tu cotización…
            </AppText>
            <LoadingSkeleton count={1} />
            <View style={styles.skeletonPrice} />
          </>
        )}
      </View>
    );
  }

  const { quote, garden, location } = data;
  const s = quote.snapshot;

  const footer = (() => {
    switch (quote.status) {
      case 'automatic':
        return (
          <>
            <PrimaryButton label="Continuar con la reserva" onPress={accept} loading={busy === 'accept'} disabled={!!busy} />
            <AppText variant="Caption/12" tone="secondary" style={styles.center}>
              No se realizará ningún cobro en este paso.
            </AppText>
          </>
        );
      case 'ready':
        return (
          <>
            <PrimaryButton label="Aceptar precio" onPress={accept} loading={busy === 'accept'} disabled={!!busy} />
            <SecondaryButton tipo="Texto" label="No me conviene" onPress={decline} disabled={!!busy} />
          </>
        );
      case 'expired':
      case 'declined':
        return <PrimaryButton label="Solicitar nueva cotización" onPress={requote} loading={busy === 'requote'} disabled={!!busy} />;
      default:
        return <PrimaryButton label="Ir a Mis jardines" onPress={goToGardens} />;
    }
  })();

  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={styles.content}>
        {guardado ? (
          <View style={styles.saved} accessibilityRole="alert">
            <View style={styles.savedIcon}>
              <Icon name="check" size={16} color={color['text/primary']} />
            </View>
            <AppText variant="Label/14" tone="on-brand" style={styles.flex}>
              Jardín guardado en Mis jardines
            </AppText>
          </View>
        ) : null}

        {garden ? (
          <GardenCard
            garden={garden}
            location={location}
            onPress={() => router.push({ pathname: '/jardin/[id]', params: { id: garden.id } })}
            onEdit={() => router.push({ pathname: '/jardin/[id]/editar', params: { id: garden.id } })}
          />
        ) : null}

        {quote.status === 'pending_review' ? <QuoteStatusCard estado="revision" /> : null}
        {quote.status === 'expired' ? <QuoteStatusCard estado="vencida" /> : null}
        {quote.price && quote.status !== 'expired' ? <PriceSummary quote={quote} /> : null}

        {quote.status === 'pending_review' && s.sizeBand === 'L' && s.photoCount === 0 ? (
          <>
            <StatusBanner
              tipo="Advertencia"
              title="Tu jardín es L y no tiene fotos"
              message="Si agregas al menos 1 foto, te damos el precio garantizado al instante."
            />
            <SecondaryButton label={busy === 'photos' ? 'Subiendo…' : 'Agregar fotos ahora'} onPress={addPhotos} disabled={!!busy || !garden} />
          </>
        ) : null}
        {quote.status === 'pending_review' && s.sizeBand === 'XL' ? (
          <StatusBanner
            tipo="Info"
            title="Los jardines XL siempre se revisan"
            message="Por su tamaño, un especialista confirma el alcance y el precio."
          />
        ) : null}
        {quote.status === 'ready' ? (
          <StatusBanner
            tipo="Éxito"
            title="Tu cotización está lista"
            message="Revísala y acéptala para continuar. No se confirma nada hasta que aceptes."
          />
        ) : null}
        {quote.status === 'accepted' ? (
          <StatusBanner
            tipo="Éxito"
            title="Aceptaste este precio"
            message="La reserva llegará pronto. No se agendó ninguna visita ni se hizo ningún cobro."
          />
        ) : null}
        {quote.status === 'declined' ? (
          <StatusBanner tipo="Info" title="No aceptaste este precio" message="Puedes pedir una nueva cotización cuando quieras." />
        ) : null}
        {actionError ? <StatusBanner tipo="Error" title="No se pudo completar" message={actionError} /> : null}

        {quote.status === 'automatic' || quote.status === 'ready' || quote.status === 'accepted' ? (
          <InfoList
            sections={[
              { title: 'Qué incluye', kind: 'check', items: INCLUYE },
              { title: 'No incluye', kind: 'close', items: NO_INCLUYE },
            ]}
            note="Propuesta de alcance por validar con jardineros. Se muestra antes de confirmar la reserva."
          />
        ) : null}
        {quote.status === 'pending_review' ? (
          <>
            <InfoList sections={[{ title: 'Qué pasa ahora', kind: 'number', items: PASOS }]} />
            {/* Solo en modo demostración: con Supabase, la revisión la termina Arku. */}
            {backend === 'demo' ? (
              <StatusBanner
                tipo="Info"
                title="Demo: aún no existe el panel de Arku"
                message="Simula que un especialista terminó la revisión con un precio de demostración."
                actionLabel={busy === 'demo' ? 'Simulando…' : 'Simular revisión de Arku'}
                onAction={simulateReview}
              />
            ) : null}
          </>
        ) : null}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.lg) }]}>{footer}</View>
      <BottomSheet
        visible={sheet}
        icon="clock"
        title="La reserva llegará pronto"
        message={`En esta versión de prueba no se agendan visitas ni se procesan pagos. Tu cotización quedó guardada en ${s.gardenName}.`}
        actionLabel="Entendido"
        onClose={() => setSheet(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: space.xl, paddingTop: space.sm, gap: space.xl },
  center: { textAlign: 'center' },
  saved: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderRadius: radius.md,
    backgroundColor: color['bg/brand'],
    boxShadow: elevation[3],
  },
  savedIcon: { width: 28, height: 28, borderRadius: radius.full, backgroundColor: color['bg/sage'], alignItems: 'center', justifyContent: 'center' },
  skeletonPrice: { height: 220, borderRadius: radius.xl, backgroundColor: color['bg/subtle'] },
  footer: {
    gap: space.sm,
    paddingHorizontal: space.xl,
    paddingTop: space.lg,
    borderTopWidth: 1,
    borderTopColor: color['border/default'],
    backgroundColor: color['bg/canvas'],
  },
});
