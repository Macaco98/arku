import { formatUSD, SIZE_BAND_LABELS, type Quote } from '@arku/domain';
import { color, elevation, radius, space } from '@arku/ui';
import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { Chip } from './Chip';

/**
 * Componente PriceSummary de Figma: Automática y Lista.
 * precio = máx(tarifa del profesional, mínimo de Arku), calculado en el dominio.
 */
export function PriceSummary({ quote }: { quote: Quote }) {
  const price = quote.price;
  if (!price) return null;
  const size = quote.snapshot.sizeBand;
  const reviewed = quote.route === 'manual_review';
  const range = SIZE_BAND_LABELS[size];
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Chip tone="salvia" icon="shield" label={reviewed ? 'Revisada por Arku' : 'Precio garantizado'} />
        {price.isDemo ? <Chip tone="demo" label="DEMO" /> : null}
      </View>
      <View style={styles.amount}>
        <AppText variant="Display/32" tone="on-brand">
          {formatUSD(price.baseCents)}
        </AppText>
        <AppText variant="Body/14" tone="on-brand" style={styles.soft}>
          por visita · Tamaño {size} ({range.charAt(0).toLowerCase()}
          {range.slice(1)})
        </AppText>
      </View>
      <View style={styles.divider} />
      <Line label={`Tarifa del profesional · ${size}${price.isDemo ? ' (simulada)' : ''}`} value={formatUSD(price.tariffCents)} />
      <Line label="Mínimo por visita de Arku" value={formatUSD(price.minimumCents)} />
      <Line label="Precio garantizado (el mayor)" value={formatUSD(price.baseCents)} strong />
      {price.isDemo ? (
        <AppText variant="Caption/12" tone="on-brand" style={styles.note}>
          Precios de demostración, no son tarifas reales. El precio se mantiene para el alcance descrito.
        </AppText>
      ) : null}
    </View>
  );
}

function Line({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.line}>
      <AppText variant="Body/14" tone="on-brand" style={[styles.soft, styles.flex]}>
        {label}
      </AppText>
      <AppText variant={strong ? 'Label/14' : 'Body/14'} tone="on-brand">
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: space.lg, padding: space.xl, borderRadius: radius.xl, backgroundColor: color['bg/brand'], boxShadow: elevation[2] },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  amount: { gap: 2 },
  soft: { opacity: 0.85 },
  divider: { height: 1, backgroundColor: color['text/on-brand'], opacity: 0.18 },
  line: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  flex: { flex: 1 },
  note: { opacity: 0.7 },
});
