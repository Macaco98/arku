import { color, elevation, radius, space } from '@arku/ui';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { PrimaryButton } from './PrimaryButton';

interface Props {
  visible: boolean;
  title: string;
  message: string;
  /** Acción segura, destacada (p. ej. "Seguir registrando"). */
  confirmLabel: string;
  onConfirm: () => void;
  /** Acción destructiva, en rojo (p. ej. "Salir"). */
  destructiveLabel: string;
  onDestructive: () => void;
}

/** Diálogo de confirmación (Figma › S03 · Salir del registro). */
export function ConfirmDialog({ visible, title, message, confirmLabel, onConfirm, destructiveLabel, onDestructive }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onConfirm}>
      <View style={styles.backdrop}>
        <View style={styles.scrim} />
        <View style={styles.card} accessibilityViewIsModal accessibilityRole="alert">
          <AppText variant="Title/20" tone="primary" accessibilityRole="header">
            {title}
          </AppText>
          <AppText variant="Body/14" tone="secondary">
            {message}
          </AppText>
          <View style={styles.actions}>
            <PrimaryButton label={confirmLabel} onPress={onConfirm} />
            <Pressable onPress={onDestructive} accessibilityRole="button" style={styles.destructive}>
              <AppText variant="Label/14" tone="danger">
                {destructiveLabel}
              </AppText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center', padding: space.xl },
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: color['bg/brand'], opacity: 0.45 },
  card: { gap: space.sm, padding: space.xl, borderRadius: radius.xl, backgroundColor: color['bg/surface'], boxShadow: elevation[3] },
  actions: { gap: space.xs, marginTop: space.md },
  destructive: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
});
