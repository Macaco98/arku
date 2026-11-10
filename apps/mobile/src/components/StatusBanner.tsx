import { color, radius, space, touchMin } from '@arku/ui';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

type Tipo = 'Info' | 'Éxito' | 'Advertencia' | 'Error' | 'Sin conexión';

const STYLE: Record<Tipo, { icon: IconName; bg: string; border: string; fg: string; sub: string }> = {
  Info: { icon: 'info', bg: color['bg/subtle'], border: color['border/default'], fg: color['text/primary'], sub: color['text/secondary'] },
  Éxito: { icon: 'check', bg: color['bg/success-soft'], border: color['border/success'], fg: color['text/primary'], sub: color['text/secondary'] },
  Advertencia: { icon: 'alert', bg: color['bg/accent-soft'], border: color['border/accent'], fg: color['text/primary'], sub: color['text/secondary'] },
  Error: { icon: 'alert', bg: color['bg/danger-soft'], border: color['border/danger'], fg: color['text/danger'], sub: color['text/secondary'] },
  'Sin conexión': { icon: 'wifi-off', bg: color['bg/brand'], border: color['bg/brand'], fg: color['text/on-brand'], sub: color['text/on-brand'] },
};

interface Props {
  tipo: Tipo;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** Componente StatusBanner de Figma: Info · Éxito · Advertencia · Error · Sin conexión. */
export function StatusBanner({ tipo, title, message, actionLabel, onAction }: Props) {
  const s = STYLE[tipo];
  return (
    <View style={[styles.wrap, { backgroundColor: s.bg, borderColor: s.border }]} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <Icon name={s.icon} size={20} color={s.fg} />
      <View style={styles.texts}>
        <AppText variant="Label/14" style={{ color: s.fg }}>
          {title}
        </AppText>
        {message ? (
          <AppText variant="Caption/12" style={{ color: s.sub }}>
            {message}
          </AppText>
        ) : null}
        {actionLabel && onAction ? (
          <Pressable onPress={onAction} accessibilityRole="button" style={styles.action}>
            <Icon name="refresh" size={14} color={s.fg} />
            <AppText variant="Label/14" style={{ color: s.fg }}>
              {actionLabel}
            </AppText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', gap: space.md, padding: space.md, borderRadius: radius.md, borderWidth: 1 },
  texts: { flex: 1, gap: 2 },
  action: { flexDirection: 'row', alignItems: 'center', gap: space.xs, minHeight: touchMin - 12, alignSelf: 'flex-start' },
});
