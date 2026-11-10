import { color, radius, space } from '@arku/ui';
import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';

interface Props {
  /** Paso actual, desde 1. */
  current: number;
  total: number;
  label: string;
}

/** Barra de progreso del registro (Figma › progreso): "Paso 1 de 4 · Dirección". */
export function ProgressSteps({ current, total, label }: Props) {
  return (
    <View
      style={styles.wrap}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Paso ${current} de ${total}: ${label}`}
      accessibilityValue={{ min: 1, max: total, now: current }}
    >
      <View style={styles.bars}>
        {Array.from({ length: total }, (_, i) => (
          <View key={i} style={[styles.bar, { backgroundColor: i < current ? color['action/primary'] : color['border/default'] }]} />
        ))}
      </View>
      <AppText variant="Caption/12" tone="secondary">
        Paso {current} de {total}
        <AppText variant="Caption/12" tone="primary">
          {'  ·  '}
          {label}
        </AppText>
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.sm },
  bars: { flexDirection: 'row', gap: space.xs },
  bar: { flex: 1, height: 4, borderRadius: radius.full },
});
