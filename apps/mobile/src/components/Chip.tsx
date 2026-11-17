import { color, radius, space, text } from '@arku/ui';
import { StyleSheet, Text, View } from 'react-native';
import { Icon, type IconName } from './Icon';

const TONES = {
  marca: { bg: color['bg/brand-soft'], fg: color['text/primary'] },
  neutro: { bg: color['bg/subtle'], fg: color['text/secondary'] },
  acento: { bg: color['bg/accent-soft'], fg: color['text/accent'] },
  peligro: { bg: color['bg/danger-soft'], fg: color['text/danger'] },
  /** Sobre el fondo verde oscuro de PriceSummary. */
  salvia: { bg: color['bg/sage'], fg: color['text/primary'] },
  demo: { bg: color['bg/accent'], fg: color['text/accent-strong'] },
} as const;

/** Etiqueta pequeña (tamaño, número de fotos, "Precio garantizado"). */
export function Chip({ label, tone = 'neutro', icon }: { label: string; tone?: keyof typeof TONES; icon?: IconName }) {
  const t = TONES[tone];
  return (
    <View style={[styles.chip, icon && styles.withIcon, { backgroundColor: t.bg }]}>
      {icon ? <Icon name={icon} size={14} color={t.fg} /> : null}
      <Text style={[text['Caption/12'], { color: t.fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
  },
  withIcon: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: space.md, paddingVertical: space.xs },
});
