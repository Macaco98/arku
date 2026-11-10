import { space } from '@arku/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { EmptyState } from '../components/EmptyState';

/** Marcador temporal para las pantallas de los bloques 2 a 4. */
export default function Proximamente() {
  const router = useRouter();
  const { pantalla } = useLocalSearchParams<{ pantalla?: string }>();
  return (
    <View style={styles.wrap}>
      <EmptyState
        icon="clock"
        title={pantalla ?? 'Esta pantalla'}
        message="La estamos construyendo. Llega en el siguiente bloque."
        actionLabel="Volver"
        onAction={() => router.back()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', padding: space.xl },
});
