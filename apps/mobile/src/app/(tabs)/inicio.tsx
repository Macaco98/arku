import { color, elevation, radius, space } from '@arku/ui';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppText } from '../../components/AppText';
import { Chip } from '../../components/Chip';
import { EmptyState } from '../../components/EmptyState';
import { GardenCard } from '../../components/GardenCard';
import { Icon } from '../../components/Icon';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useCustomer } from '../../services';
import { describeAddress, useGardenList } from '../../services/useGardenList';

function greeting(now = new Date()) {
  const h = now.getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

/** S01 · Inicio: con jardines, sin jardines y cargando. */
export default function Inicio() {
  const router = useRouter();
  const customer = useCustomer();
  const { status, gardens, addresses, locationOf, retry } = useGardenList();
  const soon = (pantalla: string) => router.push({ pathname: '/proximamente', params: { pantalla } });

  const latest = gardens[0];
  const currentAddress = latest ? addresses.find((a) => a.id === latest.addressId) : addresses[0];
  const hasGardens = gardens.length > 0;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <AppText variant="Heading/24" tone="primary" accessibilityRole="header">
        {greeting()}, {customer.firstName}
      </AppText>

      <Pressable
        onPress={() => soon('Elegir dirección')}
        accessibilityRole="button"
        accessibilityLabel={currentAddress ? `Dirección actual: ${describeAddress(currentAddress)}` : 'Agrega la dirección de tu jardín'}
        style={({ pressed }) => [styles.address, pressed && { backgroundColor: color['bg/subtle'] }]}
      >
        <View style={styles.addressIcon}>
          <Icon name="pin" size={20} color={color['text/primary']} />
        </View>
        <View style={styles.flex}>
          <AppText variant="Caption/12" tone="secondary">
            Dirección actual
          </AppText>
          <AppText variant="Label/14" tone="primary" numberOfLines={2}>
            {currentAddress ? describeAddress(currentAddress) : 'Agrega la dirección de tu jardín'}
          </AppText>
        </View>
        <Icon name="chevron-right" size={20} color={color['text/secondary']} />
      </Pressable>

      <View style={styles.hero}>
        <View style={styles.heroLeaf} pointerEvents="none">
          <Icon name="leaf" size={120} color={color['action/primary']} />
        </View>
        <Chip label="Precio garantizado" tone="marca" />
        <AppText variant="Title/20" tone="on-brand">
          Mantenimiento de jardín
        </AppText>
        <AppText variant="Body/14" tone="on-brand" style={styles.heroText}>
          Corte de césped, bordes y limpieza. Cotiza en minutos según el tamaño de tu jardín.
        </AppText>
        <View style={styles.heroAction}>
          <PrimaryButton
            tone="acento"
            label="Cotizar mi jardín"
            onPress={() => soon(hasGardens ? 'Elegir jardín' : 'Registrar jardín')}
          />
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <AppText variant="Title/20" tone="primary" accessibilityRole="header">
          Tus jardines
        </AppText>
        {hasGardens ? (
          <Pressable onPress={() => router.navigate('/jardines')} accessibilityRole="link" hitSlop={12}>
            <AppText variant="Label/14" tone="brand">
              Ver todos
            </AppText>
          </Pressable>
        ) : null}
      </View>

      {status === 'loading' ? <LoadingSkeleton count={2} /> : null}
      {status === 'error' ? (
        <EmptyState
          compact
          tone="peligro"
          icon="alert"
          title="No pudimos cargar tus jardines"
          message="Inténtalo de nuevo en un momento."
          actionLabel="Reintentar"
          onAction={retry}
        />
      ) : null}
      {status === 'ready' && !hasGardens ? (
        <EmptyState
          compact
          icon="leaf"
          title="Aún no tienes jardines"
          message="Regístralo una vez y úsalo cada vez que pidas el servicio."
          actionLabel="Registrar jardín"
          onAction={() => soon('Registrar jardín')}
        />
      ) : null}
      {status === 'ready' && hasGardens ? (
        <View style={styles.list}>
          {gardens.slice(0, 2).map((g) => (
            <GardenCard
              key={g.id}
              garden={g}
              location={locationOf(g)}
              onPress={() => soon('Detalle de jardín')}
              onEdit={() => soon('Editar jardín')}
            />
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, paddingTop: space.sm, gap: space.lg },
  flex: { flex: 1 },
  address: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color['border/default'],
    backgroundColor: color['bg/surface'],
    boxShadow: elevation[1],
  },
  addressIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: color['bg/brand-soft'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    gap: space.sm,
    padding: space.lg,
    borderRadius: radius.xl,
    backgroundColor: color['bg/brand'],
    overflow: 'hidden',
    boxShadow: elevation[2],
  },
  heroLeaf: { position: 'absolute', right: -24, top: -20, opacity: 0.5 },
  heroText: { opacity: 0.9 },
  heroAction: { marginTop: space.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.sm },
  list: { gap: space.md },
});
