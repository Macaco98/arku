import { color, radius } from '@arku/ui';
import { StyleSheet, View } from 'react-native';
import { Icon } from './Icon';

/** Círculo de selección de las tarjetas (Figma › Radio). */
export function RadioMark({ selected }: { selected: boolean }) {
  return selected ? (
    <View style={[styles.mark, { backgroundColor: color['action/primary'], borderColor: color['action/primary'] }]}>
      <Icon name="check" size={14} color={color['text/on-brand']} />
    </View>
  ) : (
    <View style={[styles.mark, { borderColor: color['text/secondary'] }]} />
  );
}

const styles = StyleSheet.create({
  mark: { width: 24, height: 24, borderRadius: radius.full, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
});
