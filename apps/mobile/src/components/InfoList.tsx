import { color, radius, space } from '@arku/ui';
import { Fragment } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { Icon } from './Icon';

interface Section {
  title: string;
  /** check = incluido, close = no incluido, number = pasos numerados. */
  kind: 'check' | 'close' | 'number';
  items: string[];
}

/** Tarjeta de listas: "Qué incluye / No incluye" (S07) y "Qué pasa ahora" (S08). */
export function InfoList({ sections, note }: { sections: Section[]; note?: string }) {
  return (
    <View style={styles.card}>
      {sections.map((s, i) => (
        <Fragment key={s.title}>
          {i > 0 ? <View style={styles.divider} /> : null}
          <View style={styles.section}>
            <AppText variant="Body/16 Strong" tone="primary" accessibilityRole="header">
              {s.title}
            </AppText>
            {s.items.map((item, n) => (
              <View key={item} style={styles.item}>
                {s.kind === 'number' ? (
                  <View style={styles.number}>
                    <AppText variant="Caption/12" tone="primary">
                      {n + 1}
                    </AppText>
                  </View>
                ) : (
                  <Icon
                    name={s.kind}
                    size={18}
                    color={s.kind === 'check' ? color['text/brand'] : color['text/secondary']}
                  />
                )}
                <AppText variant="Body/14" tone="body" style={styles.flex}>
                  {item}
                </AppText>
              </View>
            ))}
          </View>
        </Fragment>
      ))}
      {note ? (
        <AppText variant="Caption/12" tone="secondary">
          {note}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: space.lg,
    padding: space.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color['border/default'],
    backgroundColor: color['bg/surface'],
  },
  section: { gap: 10 },
  divider: { height: 1, backgroundColor: color['border/default'] },
  item: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  number: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    backgroundColor: color['bg/brand-soft'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1 },
});
