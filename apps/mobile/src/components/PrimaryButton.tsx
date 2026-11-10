import { color, radius, space, text, touchMin } from '@arku/ui';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

interface Props {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  /** "acento" = naranja, para la acción principal sobre fondos verdes (A00, tarjeta de Inicio). */
  tone?: 'primario' | 'acento';
}

/** Componente PrimaryButton de Figma: Default · Pressed · Disabled · Loading · Focus. */
export function PrimaryButton({ label, onPress, disabled = false, loading = false, tone = 'primario' }: Props) {
  const inactive = disabled || loading;
  const [focused, setFocused] = useState(false);
  const accent = tone === 'acento';
  const labelColor = disabled ? color['text/muted'] : accent ? color['text/primary'] : color['text/on-brand'];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: disabled
            ? color['action/disabled']
            : accent
              ? color['bg/accent']
              : pressed
                ? color['action/primary-pressed']
                : color['action/primary'],
          opacity: accent && pressed ? 0.85 : 1,
        },
        focused && styles.focus,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={labelColor} accessibilityLabel="Cargando" />
      ) : (
        <Text style={[text['Body/16 Strong'], { color: labelColor }]}>{label}</Text>
      )}
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
  // Anillo doble como en Figma: marfil 2px + bosque 5px.
  focus: { boxShadow: `0 0 0 2px ${color['bg/canvas']}, 0 0 0 5px ${color['border/focus']}` },
});
