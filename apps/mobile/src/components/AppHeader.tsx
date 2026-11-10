import { color, radius, space, text, touchMin } from '@arku/ui';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Logo } from './Logo';

interface Props {
  /** Iniciales del cliente para el avatar. */
  initials: string;
  onAvatarPress: () => void;
}

/** Componente AppHeader de Figma, Tipo=Inicio: logo y avatar. */
export function AppHeader({ initials, onAvatarPress }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { paddingTop: insets.top }]}>
      <View style={styles.row}>
        <Logo height={28} />
        <Pressable
          onPress={onAvatarPress}
          accessibilityRole="button"
          accessibilityLabel="Ir a tu perfil"
          style={({ pressed }) => [styles.avatar, pressed && { opacity: 0.8 }]}
        >
          <Text style={[text['Label/14'], { color: color['text/primary'] }]}>{initials}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: color['bg/canvas'] },
  row: { height: 56, paddingHorizontal: space.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  avatar: {
    width: touchMin,
    height: touchMin,
    borderRadius: radius.full,
    backgroundColor: color['bg/brand-soft'],
    alignItems: 'center',
    justifyContent: 'center',
  },
});
