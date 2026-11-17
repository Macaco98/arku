import { color, radius, space, touchMin } from '@arku/ui';
import { Pressable, StyleSheet } from 'react-native';
import { AppText } from './AppText';

interface Props {
  label: string;
  selected: boolean;
  onPress: () => void;
}

/** Opción seleccionable en forma de píldora (Figma › chip Casa / Trabajo / Familia / Otra). */
export function ChoiceChip({ label, selected, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected, checked: selected }}
      style={({ pressed }) => [
        styles.chip,
        selected
          ? { backgroundColor: color['bg/brand-soft'], borderColor: color['action/primary'], borderWidth: 2 }
          : { backgroundColor: color['bg/surface'], borderColor: color['border/default'], borderWidth: 1 },
        pressed && !selected && { backgroundColor: color['bg/subtle'] },
      ]}
    >
      <AppText variant="Label/14" tone="primary">
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: touchMin,
    paddingHorizontal: space.lg,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
