import { color, space } from '@arku/ui';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from './AppText';
import { ProgressSteps } from './ProgressSteps';

interface Props {
  step: number;
  stepLabel: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Pie fijo: banner opcional y botón principal. */
  footer: ReactNode;
  /** Elementos flotantes sobre el pie, como un toast. */
  overlay?: ReactNode;
}

export const REGISTRO_STEPS = 4;

/** Estructura común de S03–S06: progreso, encabezado, contenido con scroll y pie fijo. */
export function StepLayout({ step, stepLabel, title, subtitle, children, footer, overlay }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ProgressSteps current={step} total={REGISTRO_STEPS} label={stepLabel} />
        <View style={styles.heading}>
          <AppText variant="Heading/24" tone="primary" accessibilityRole="header">
            {title}
          </AppText>
          {subtitle ? <AppText variant="Body/14" tone="secondary">{subtitle}</AppText> : null}
        </View>
        {children}
      </ScrollView>
      {overlay}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.lg) }]}>{footer}</View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: space.lg, paddingTop: space.sm, gap: space.lg },
  heading: { gap: space.xs },
  footer: {
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    borderTopWidth: 1,
    borderTopColor: color['border/default'],
    backgroundColor: color['bg/canvas'],
  },
});
