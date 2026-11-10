import { determineQuoteRoute, SIZE_BAND_LABELS, type SizeBand } from '@arku/domain';
import { color, radius, space } from '@arku/ui';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';
import { RadioMark } from './RadioMark';

export const SIZE_NAMES: Record<SizeBand, string> = { S: 'Pequeño', M: 'Mediano', L: 'Grande', XL: 'Muy grande' };

const DESCRIPTIONS: Record<SizeBand, string> = {
  S: 'Patio o jardín frontal pequeño',
  M: 'Jardín de casa con césped y bordes',
  L: 'Jardín amplio con varias zonas',
  XL: 'Terreno grande, quinta o áreas comunales',
};

/** Qué pasa al cotizar según la regla del dominio (S/M automático, L con foto, XL manual). */
export function quoteHint(size: SizeBand): { icon: IconName; text: string } {
  if (determineQuoteRoute(size, 0) === 'automatic') return { icon: 'check', text: 'Precio inmediato' };
  if (determineQuoteRoute(size, 1) === 'automatic') return { icon: 'camera', text: 'Precio inmediato con al menos 1 foto' };
  return { icon: 'clock', text: 'Cotización con revisión manual' };
}

/** Área relativa del jardín en la miniatura (Figma › opción S/M/L/XL). */
const FILL: Record<SizeBand, number> = { S: 0.3, M: 0.55, L: 0.8, XL: 1 };

interface Props {
  size: SizeBand;
  selected: boolean;
  onPress: () => void;
}

/** Tarjeta de tamaño de S04. */
export function SizeOption({ size, selected, onPress }: Props) {
  const hint = quoteHint(size);
  const fill = FILL[size] * 100;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected, checked: selected }}
      accessibilityLabel={`${size}, ${SIZE_NAMES[size]}, ${SIZE_BAND_LABELS[size]}. ${DESCRIPTIONS[size]}. ${hint.text}.`}
      style={({ pressed }) => [
        styles.card,
        selected
          ? { backgroundColor: color['bg/brand-soft'], borderColor: color['action/primary'], borderWidth: 2 }
          : { backgroundColor: color['bg/surface'], borderColor: color['border/default'], borderWidth: 1 },
        pressed && !selected && { backgroundColor: color['bg/subtle'] },
      ]}
    >
      <View style={styles.thumb}>
        <View style={[styles.area, { width: `${fill}%`, height: `${fill}%` }]} />
        <AppText variant="Label/14" tone="primary" style={styles.letter}>
          {size}
        </AppText>
      </View>
      <View style={styles.texts}>
        <AppText variant="Body/16 Strong" tone="primary">
          {size} · {SIZE_NAMES[size]}
        </AppText>
        <AppText variant="Label/14" tone="brand">
          {SIZE_BAND_LABELS[size]}
        </AppText>
        <AppText variant="Caption/12" tone="secondary">
          {DESCRIPTIONS[size]}
        </AppText>
        <View style={styles.hint}>
          <Icon name={hint.icon} size={14} color={color['text/brand']} />
          <AppText variant="Caption/12" tone="brand" style={styles.flex}>
            {hint.text}
          </AppText>
        </View>
      </View>
      <RadioMark selected={selected} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius.lg },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: color['border/default'],
    backgroundColor: color['bg/subtle'],
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  area: { backgroundColor: color['bg/success-soft'], borderTopRightRadius: radius.sm },
  letter: { position: 'absolute', top: space.xs, left: space.sm },
  texts: { flex: 1, gap: 2 },
  hint: { flexDirection: 'row', alignItems: 'center', gap: space.xs, marginTop: 2 },
  flex: { flex: 1 },
});
