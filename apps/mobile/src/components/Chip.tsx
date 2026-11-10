import { color, radius, space, text } from '@arku/ui';
import { StyleSheet, Text, View } from 'react-native';

const TONES = {
  marca: { bg: color['bg/brand-soft'], fg: color['text/primary'] },
  neutro: { bg: color['bg/subtle'], fg: color['text/secondary'] },
  acento: { bg: color['bg/accent-soft'], fg: color['text/accent'] },
  peligro: { bg: color['bg/danger-soft'], fg: color['text/danger'] },
} as const;

/** Etiqueta pequeña (tamaño, número de fotos, "Precio garantizado"). */
export function Chip({ label, tone = 'neutro' }: { label: string; tone?: keyof typeof TONES }) {
  const t = TONES[tone];
  return (
    <View style={[styles.chip, { backgroundColor: t.bg }]}>
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
});
