import { space } from '@arku/ui';
import { useRouter } from 'expo-router';
import { FlatList, StyleSheet, View } from 'react-native';
import { AppText } from '../../components/AppText';
import { EmptyState } from '../../components/EmptyState';
import { GardenCard } from '../../components/GardenCard';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { SecondaryButton } from '../../components/SecondaryButton';
import { StatusBanner } from '../../components/StatusBanner';
import { useGardenList } from '../../services/useGardenList';
import { useIsOffline } from '../../services/useIsOffline';

function subtitle(status: string, count: number, offline: boolean) {
  if (status === 'loading') return 'Cargando tus jardines…';
  if (status === 'error') return '';
  if (offline) return 'Mostrando la última versión guardada.';
  if (count === 0) return 'Aún no tienes jardines guardados.';
  return `${count} ${count === 1 ? 'jardín guardado' : 'jardines guardados'} · Úsalos para cotizar cuando quieras.`;
}

/** S02 · Mis jardines: lista, vacío, cargando, error y sin conexión. */
export default function MisJardines() {
  const router = useRouter();
  const { status, gardens, locationOf, retry } = useGardenList();
  const offline = useIsOffline();
  const soon = (pantalla: string) => router.push({ pathname: '/proximamente', params: { pantalla } });
  const sub = subtitle(status, gardens.length, offline);

  const header = (
    <View style={styles.header}>
      {offline ? (
        <StatusBanner
          tipo="Sin conexión"
          title="Estás sin conexión"
          message="Puedes ver tus jardines guardados. Los cambios se enviarán al reconectar."
          actionLabel="Reintentar"
          onAction={retry}
        />
      ) : null}
      <AppText variant="Heading/24" tone="primary" accessibilityRole="header">
        Mis jardines
      </AppText>
      {sub ? <AppText variant="Body/14" tone="secondary">{sub}</AppText> : null}
    </View>
  );

  if (status === 'loading') {
    return (
      <View style={styles.content}>
        {header}
        <LoadingSkeleton count={3} />
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View style={styles.content}>
        {header}
        <View style={styles.center}>
          <EmptyState
            tone="peligro"
            icon="alert"
            title="No pudimos cargar tus jardines"
            message="Algo salió mal de nuestro lado. Inténtalo de nuevo en un momento."
            actionLabel="Reintentar"
            onAction={retry}
          />
        </View>
      </View>
    );
  }

  return (
    <FlatList
      data={gardens}
      keyExtractor={(g) => g.id}
      contentContainerStyle={styles.content}
      ListHeaderComponent={header}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      renderItem={({ item }) => (
        <GardenCard
          garden={item}
          location={locationOf(item)}
          onPress={() => soon('Detalle de jardín')}
          onEdit={() => soon('Editar jardín')}
        />
      )}
      ListEmptyComponent={
        <EmptyState
          icon="leaf"
          title="Aún no tienes jardines"
          message="Registra tu primer jardín en pocos pasos. Las fotos son opcionales."
          actionLabel="Registrar jardín"
          onAction={() => soon('Registrar jardín')}
        />
      }
      ListFooterComponent={
        gardens.length > 0 ? (
          <View style={styles.footer}>
            <SecondaryButton label="Registrar nuevo jardín" disabled={offline} onPress={() => soon('Registrar jardín')} />
          </View>
        ) : undefined
      }
    />
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, paddingTop: space.sm, gap: space.md, flexGrow: 1 },
  header: { gap: space.xs, marginBottom: space.md },
  center: { flex: 1, justifyContent: 'center' },
  separator: { height: space.md },
  footer: { marginTop: space.lg },
});
