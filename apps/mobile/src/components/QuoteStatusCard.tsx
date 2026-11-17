import { color, elevation, radius, space } from '@arku/ui';
import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { Chip } from './Chip';

/** PriceSummary en Revisión manual o Vencida: sin monto. */
export function QuoteStatusCard({ estado }: { estado: 'revision' | 'vencida' }) {
  const review = estado === 'revision';
  return (
    <View style={styles.card}>
      <Chip
        tone={review ? 'acento' : 'peligro'}
        icon="clock"
        label={review ? 'En revisión manual' : 'Cotización vencida'}
      />
      <AppText variant="Heading/24" tone="primary" accessibilityRole="header">
        {review ? 'Precio por confirmar' : 'Esta cotización ya no está vigente'}
      </AppText>
      <AppText variant="Body/14" tone="secondary">
        {review
          ? 'Un especialista de ARKU revisará los datos de tu jardín para darte un precio justo.'
          : 'Solicita una nueva para ver el precio actualizado de tu jardín.'}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: space.sm,
    padding: space.xl,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: color['border/default'],
    backgroundColor: color['bg/surface'],
    boxShadow: elevation[2],
  },
});
