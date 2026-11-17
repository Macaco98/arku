import { color, radius, space } from '@arku/ui';
import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../../components/AppText';
import { EmptyState } from '../../components/EmptyState';
import { GardenCard } from '../../components/GardenCard';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useGardenList } from '../../services/useGardenList';

/** R01 · Elegir jardín para cotizar. */
export default function ElegirJardin() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { status, gardens, locationOf, retry } = useGardenList();
  const [selected, setSelected] = useState<string>();
  const current = selected ?? gardens[0]?.id;

  if (status === 'ready' && gardens.length === 0) return <Redirect href="/registro" />;

  const header = (
    <View style={styles.header}>
      <AppText variant="Heading/24" tone="primary" accessibilityRole="header">
        ¿Qué jardín cuidamos?
      </AppText>
      <AppText variant="Body/14" tone="secondary">
        Elige uno de tus jardines guardados.
      </AppText>
    </View>
  );

  return (
    <View style={styles.flex}>
      {status === 'ready' ? (
        <FlatList
          data={gardens}
          keyExtractor={(g) => g.id}
          contentContainerStyle={styles.content}
          ListHeaderComponent={header}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <View style={[styles.option, current === item.id && styles.selected]} accessibilityState={{ selected: current === item.id }}>
              <GardenCard
                garden={item}
                location={locationOf(item)}
                onPress={() => setSelected(item.id)}
                onEdit={() => router.push({ pathname: '/jardin/[id]/editar', params: { id: item.id } })}
              />
            </View>
          )}
          ListFooterComponent={
            <Pressable onPress={() => router.push('/registro')} accessibilityRole="link" style={styles.other}>
              <AppText variant="Label/14" tone="brand">
                Registrar otro jardín
              </AppText>
            </Pressable>
          }
        />
      ) : (
        <View style={styles.content}>
          {header}
          {status === 'loading' ? (
            <LoadingSkeleton count={3} />
          ) : (
            <EmptyState tone="peligro" icon="alert" title="No pudimos cargar tus jardines" message="Inténtalo de nuevo en un momento." actionLabel="Reintentar" onAction={retry} />
          )}
        </View>
      )}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.lg) }]}>
        <PrimaryButton
          label="Continuar"
          disabled={!current}
          onPress={() => current && router.push({ pathname: '/cotizar/[id]', params: { id: current } })}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: space.xl, paddingTop: space.sm },
  header: { gap: space.xs, marginBottom: space.lg },
  separator: { height: space.md },
  option: { borderRadius: radius.lg + 3, borderWidth: 2, borderColor: 'transparent', padding: 1 },
  selected: { borderColor: color['action/primary'] },
  other: { minHeight: 48, justifyContent: 'center', marginTop: space.md, paddingHorizontal: space.sm },
  footer: {
    paddingHorizontal: space.xl,
    paddingTop: space.lg,
    borderTopWidth: 1,
    borderTopColor: color['border/default'],
    backgroundColor: color['bg/canvas'],
  },
});
