import { color, radius, space } from '@arku/ui';
import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';
import { PrimaryButton } from './PrimaryButton';
import { SecondaryButton } from './SecondaryButton';

interface Props {
  icon: IconName;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: 'marca' | 'peligro';
  /** Botón de contorno dentro de una tarjeta punteada (S01 sin jardines). */
  compact?: boolean;
}

/** Componente EmptyState de Figma: sin jardines, error al cargar, etc. */
export function EmptyState({ icon, title, message, actionLabel, onAction, tone = 'marca', compact = false }: Props) {
  const danger = tone === 'peligro';
  return (
    <View style={[styles.wrap, compact && styles.compact]}>
      <View style={[styles.circle, { backgroundColor: danger ? color['bg/danger-soft'] : color['bg/brand-soft'] }, compact && styles.circleSmall]}>
        <Icon name={icon} size={compact ? 24 : 32} color={danger ? color['text/danger'] : color['text/primary']} />
      </View>
      <AppText variant={compact ? 'Body/16 Strong' : 'Title/20'} tone="primary" style={styles.center} accessibilityRole="header">
        {title}
      </AppText>
      <AppText variant="Body/14" tone="secondary" style={styles.center}>
        {message}
      </AppText>
      {actionLabel && onAction ? (
        <View style={styles.action}>
          {compact ? <SecondaryButton label={actionLabel} onPress={onAction} /> : <PrimaryButton label={actionLabel} onPress={onAction} />}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: space.lg, paddingVertical: space['2xl'], paddingHorizontal: space.lg },
  compact: {
    gap: space.sm,
    paddingVertical: space.xl,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: color['border/default'],
    borderRadius: radius.lg,
    backgroundColor: color['bg/surface'],
  },
  circle: { width: 96, height: 96, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  circleSmall: { width: 56, height: 56 },
  center: { textAlign: 'center' },
  action: { alignSelf: 'stretch', marginTop: space.sm },
});
