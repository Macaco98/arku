import { color, radius, space, text } from '@arku/ui';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, type IconName } from './Icon';

export interface TabItem {
  key: string;
  label: string;
  icon: IconName;
}

interface Props {
  tabs: TabItem[];
  activeKey: string;
  onSelect: (key: string) => void;
}

/** Componente BottomNavigation de Figma: Inicio · Mis jardines · Perfil. */
export function BottomNavigation({ tabs, activeKey, onSelect }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, space.lg) }]} accessibilityRole="tablist">
      {tabs.map((tab) => {
        const active = tab.key === activeKey;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onSelect(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={tab.label}
            style={styles.tab}
          >
            <View style={[styles.pill, active && { backgroundColor: color['bg/brand-soft'] }]}>
              <Icon name={tab.icon} size={22} color={active ? color['text/primary'] : color['text/secondary']} />
            </View>
            <Text style={[text['Caption/12'], { color: active ? color['text/primary'] : color['text/secondary'] }]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: space.sm,
    paddingHorizontal: space.xl,
    backgroundColor: color['bg/surface'],
    borderTopWidth: 1,
    borderTopColor: color['border/default'],
  },
  tab: { width: 96, minHeight: 50, alignItems: 'center', gap: 2 },
  pill: { width: 56, height: 30, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
});
