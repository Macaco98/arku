import { color, radius, space } from '@arku/ui';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

/** Componente LoadingSkeleton de Figma (variante tarjeta de jardín). */
export function LoadingSkeleton({ count = 3 }: { count?: number }) {
  const pulse = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View style={styles.list} accessibilityLabel="Cargando tus jardines" accessibilityRole="progressbar">
      {Array.from({ length: count }, (_, i) => (
        <Animated.View key={i} style={[styles.card, { opacity: pulse }]}>
          <View style={styles.thumb} />
          <View style={styles.lines}>
            <View style={[styles.line, { width: '70%' }]} />
            <View style={[styles.line, { width: '95%', height: 8 }]} />
            <View style={[styles.line, { width: '50%' }]} />
          </View>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: space.md },
  card: {
    flexDirection: 'row',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color['border/default'],
    backgroundColor: color['bg/surface'],
  },
  thumb: { width: 72, height: 72, borderRadius: radius.md, backgroundColor: color['bg/subtle'] },
  lines: { flex: 1, gap: space.sm, justifyContent: 'center' },
  line: { height: 12, borderRadius: radius.full, backgroundColor: color['bg/subtle'] },
});
