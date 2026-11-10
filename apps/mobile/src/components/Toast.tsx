import { color, elevation, radius, space, touchMin } from '@arku/ui';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

interface Props {
  icon: IconName;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** Aviso breve sobre el pie (Figma › S05 · Foto eliminada). */
export function Toast({ icon, message, actionLabel, onAction }: Props) {
  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={styles.toast} accessibilityRole="alert" accessibilityLiveRegion="polite">
        <View style={styles.icon}>
          <Icon name={icon} size={16} color={color['text/primary']} />
        </View>
        <AppText variant="Label/14" tone="on-brand" style={styles.flex}>
          {message}
        </AppText>
        {actionLabel && onAction ? (
          <Pressable onPress={onAction} accessibilityRole="button" hitSlop={8} style={styles.action}>
            <AppText variant="Label/14" style={{ color: color['bg/success-soft'] }}>
              {actionLabel}
            </AppText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: space.lg, right: space.lg, bottom: 110 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.lg,
    backgroundColor: color['bg/brand'],
    boxShadow: elevation[3],
  },
  icon: { width: 32, height: 32, borderRadius: radius.full, backgroundColor: color['bg/success-soft'], alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  action: { minHeight: touchMin, justifyContent: 'center' },
});
