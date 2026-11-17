import { color, radius, space } from '@arku/ui';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';
import { PrimaryButton } from './PrimaryButton';

interface Props {
  visible: boolean;
  icon: IconName;
  title: string;
  message: string;
  actionLabel: string;
  onClose: () => void;
}

/** Hoja inferior informativa (Figma › S07 · Reserva próximamente). */
export function BottomSheet({ visible, icon, title, message, actionLabel, onClose }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Cerrar" />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, space.xl) }]} accessibilityViewIsModal>
          <View style={styles.handle} />
          <View style={styles.icon}>
            <Icon name={icon} size={24} color={color['text/primary']} />
          </View>
          <AppText variant="Title/20" tone="primary" accessibilityRole="header" style={styles.center}>
            {title}
          </AppText>
          <AppText variant="Body/14" tone="secondary" style={styles.center}>
            {message}
          </AppText>
          <View style={styles.action}>
            <PrimaryButton label={actionLabel} onPress={onClose} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: color['bg/brand'], opacity: 0.45 },
  sheet: {
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    backgroundColor: color['bg/surface'],
  },
  handle: { width: 36, height: 4, borderRadius: radius.full, backgroundColor: color['border/default'], marginBottom: space.sm },
  icon: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: color['bg/accent-soft'],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.xs,
  },
  center: { textAlign: 'center' },
  action: { alignSelf: 'stretch', marginTop: space.md },
});
