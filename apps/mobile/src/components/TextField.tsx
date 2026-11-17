import { color, radius, space, text, touchMin } from '@arku/ui';
import { useState } from 'react';
import { Platform, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { AppText } from './AppText';

interface Props extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string;
  /** Mensaje de éxito (estado Válido de Figma), p. ej. "Cédula válida". */
  success?: string;
  helper?: string;
}

/** Componente TextField de Figma: Default · Focus · Filled · Error · Disabled · Válido. */
export function TextField({ label, error, success, helper, editable = true, ...input }: Props) {
  const [focused, setFocused] = useState(false);
  const borderColor = error
    ? color['border/danger']
    : success
      ? color['border/success']
      : focused
        ? color['border/focus']
        : color['border/default'];
  const message = error ?? success ?? helper;
  const tone = error ? 'danger' : success ? 'success' : 'secondary';

  return (
    <View style={styles.wrap}>
      <AppText variant="Label/14" tone="primary">
        {label}
      </AppText>
      <TextInput
        {...input}
        editable={editable}
        accessibilityLabel={label}
        accessibilityHint={message}
        onFocus={(e) => {
          setFocused(true);
          input.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          input.onBlur?.(e);
        }}
        placeholderTextColor={color['text/muted']}
        style={[
          styles.input,
          text['Body/16'],
          { borderColor, borderWidth: focused || error || success ? 2 : 1, color: color['text/body'] },
          input.multiline && styles.multiline,
          !editable && { backgroundColor: color['bg/subtle'] },
          // En web, el borde del estado reemplaza el contorno de foco del navegador.
          Platform.OS === 'web' && (webNoOutline as object),
        ]}
      />
      {message ? (
        <AppText variant="Caption/12" tone={tone} accessibilityLiveRegion="polite">
          {message}
        </AppText>
      ) : null}
    </View>
  );
}

const webNoOutline = { outlineStyle: 'none' };

const styles = StyleSheet.create({
  wrap: { gap: space.xs + 2 },
  input: {
    minHeight: Math.max(touchMin, 52),
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    backgroundColor: color['bg/surface'],
  },
  multiline: { minHeight: 104, paddingTop: space.md, paddingBottom: space.md, textAlignVertical: 'top' },
});
