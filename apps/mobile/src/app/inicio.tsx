import { space } from '@arku/ui';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../components/AppText';
import { useServices } from '../services';

/** S01 · Inicio. Marcador: las pantallas S01–S08 se construyen en la fase 5. */
export default function Inicio() {
  const { customer } = useServices();
  return (
    <View style={styles.content}>
      <AppText variant="Heading/24" tone="primary" accessibilityRole="header">
        Hola{customer ? `, ${customer.firstName}` : ''}
      </AppText>
      <AppText tone="secondary">Aquí verás tus jardines. Esta pantalla se construye en la siguiente fase.</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.xl, gap: space.sm },
});
