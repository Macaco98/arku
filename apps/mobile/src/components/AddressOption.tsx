import { color, radius, space } from '@arku/ui';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { Icon } from './Icon';
import { RadioMark } from './RadioMark';

interface Props {
  label: string;
  line: string;
  gardenCount: number;
  selected: boolean;
  onPress: () => void;
}

/** Dirección guardada en S03 · Elegir dirección guardada. */
export function AddressOption({ label, line, gardenCount, selected, onPress }: Props) {
  const count = `${gardenCount} ${gardenCount === 1 ? 'jardín registrado' : 'jardines registrados'} aquí`;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected, checked: selected }}
      accessibilityLabel={`${label}. ${line}. ${count}.`}
      style={({ pressed }) => [
        styles.card,
        selected
          ? { backgroundColor: color['bg/brand-soft'], borderColor: color['action/primary'], borderWidth: 2 }
          : { backgroundColor: color['bg/surface'], borderColor: color['border/default'], borderWidth: 1 },
        pressed && !selected && { backgroundColor: color['bg/subtle'] },
      ]}
    >
      <View style={[styles.icon, selected && { backgroundColor: color['bg/surface'] }]}>
        <Icon name="pin" size={20} color={color['text/primary']} />
      </View>
      <View style={styles.texts}>
        <AppText variant="Body/16 Strong" tone="primary">
          {label}
        </AppText>
        <AppText variant="Body/14" tone="secondary" numberOfLines={2}>
          {line}
        </AppText>
        <AppText variant="Caption/12" tone="brand">
          {count}
        </AppText>
      </View>
      <RadioMark selected={selected} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius.lg },
  icon: { width: 40, height: 40, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  texts: { flex: 1, gap: 2 },
});
