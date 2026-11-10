import { color, radius, space, text, touchMin } from '@arku/ui';
import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

interface Props {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tipo?: 'Contorno' | 'Texto';
}

/** Componente SecondaryButton de Figma: Tipo Contorno · Texto; Default · Pressed · Disabled · Focus. */
export function SecondaryButton({ label, onPress, disabled = false, tipo = 'Contorno' }: Props) {
  const [focused, setFocused] = useState(false);
  const outline = tipo === 'Contorno';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={({ pressed }) => [
        styles.base,
        outline && { borderWidth: 1.5, borderColor: disabled ? color['border/default'] : color['action/primary'] },
        pressed && { backgroundColor: color['bg/brand-soft'] },
        focused && styles.focus,
      ]}
    >
      <Text style={[text['Body/16 Strong'], { color: disabled ? color['text/muted'] : color['text/brand'] }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: Math.max(touchMin, 52),
    borderRadius: radius.full,
    paddingHorizontal: space.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  focus: { boxShadow: `0 0 0 2px ${color['bg/canvas']}, 0 0 0 5px ${color['border/focus']}` },
});
