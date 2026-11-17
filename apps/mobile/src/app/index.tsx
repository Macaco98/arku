import { color, space } from '@arku/ui';
import { Redirect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../components/AppText';
import { Logo } from '../components/Logo';
import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryButton } from '../components/SecondaryButton';
import { useServices } from '../services';

/** A00 · Bienvenida. Con sesión, pasa directo a Inicio o a completar los datos (A03). */
export default function Bienvenida() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { customer, session, sessionStatus } = useServices();

  if (sessionStatus === 'loading') return <View style={styles.screen} />;
  if (customer) return <Redirect href="/inicio" />;
  if (session) return <Redirect href="/tus-datos" />;

  // Crear cuenta e ingresar usan el mismo paso: el código por SMS decide si la cuenta ya existe.
  const start = () => router.push('/ingresar');

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, space.xl) }]}>
      <StatusBar style="light" />
      <View style={styles.brand}>
        <Logo version="Blanco" height={72} />
        <AppText variant="Body/16" tone="on-brand">
          Tu mundo, resuelto.
        </AppText>
      </View>
      <View style={styles.bottom}>
        <View style={styles.copy}>
          <AppText variant="Heading/24" tone="on-brand" accessibilityRole="header">
            Cuidamos tu jardín en Cumbayá y Tumbaco
          </AppText>
          <AppText variant="Body/16" tone="on-brand">
            Cotiza en minutos y recibe un precio garantizado para el alcance acordado.
          </AppText>
        </View>
        <PrimaryButton label="Crear cuenta" tone="acento" onPress={start} />
        <SecondaryButton label="Ya tengo cuenta" sobreMarca onPress={start} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color['bg/brand-deep'], paddingHorizontal: space.xl },
  brand: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md },
  bottom: { gap: space.md },
  copy: { gap: space.sm, marginBottom: space.md },
});
