import type { Address } from '@arku/domain';
import { color, radius, space } from '@arku/ui';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../../components/AppText';
import { EmptyState } from '../../components/EmptyState';
import { Icon } from '../../components/Icon';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Toast } from '../../components/Toast';
import { takeFlash } from '../../services/flash';
import { describeAddress, useGardenList } from '../../services/useGardenList';

function AddressRow({ address, gardenCount, onPress }: { address: Address; gardenCount: number; onPress: () => void }) {
  const count = gardenCount === 0 ? 'Sin jardines' : `${gardenCount} ${gardenCount === 1 ? 'jardín' : 'jardines'}`;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${address.label}. ${address.line}. ${count}. Editar`}
      style={({ pressed }) => [styles.card, pressed && { backgroundColor: color['bg/subtle'] }]}
    >
      <View style={styles.icon}>
        <Icon name="pin" size={20} color={color['text/primary']} />
      </View>
      <View style={styles.texts}>
        <AppText variant="Body/16 Strong" tone="primary">
          {address.label}
        </AppText>
        <AppText variant="Body/14" tone="secondary" numberOfLines={2}>
          {describeAddress(address)}
        </AppText>
        {address.reference ? (
          <AppText variant="Caption/12" tone="secondary" numberOfLines={1}>
            Ref.: {address.reference}
          </AppText>
        ) : null}
        <AppText variant="Caption/12" tone="brand">
          {count}
        </AppText>
      </View>
      <Icon name="edit" size={20} color={color['text/secondary']} />
    </Pressable>
  );
}

/** P01 › Mis direcciones: direcciones guardadas para corregirlas o agregar una nueva. */
export default function MisDirecciones() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { status, addresses, gardens, retry } = useGardenList();
  const [toast, setToast] = useState<string>();

  useFocusEffect(
    useCallback(() => {
      const flash = takeFlash();
      if (flash) setToast(flash);
    }, []),
  );

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(undefined), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const add = () => router.push('/perfil/direccion');

  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={styles.content}>
        {status === 'loading' ? <LoadingSkeleton count={2} /> : null}
        {status === 'error' ? (
          <EmptyState tone="peligro" icon="alert" title="No pudimos cargar tus direcciones" message="Inténtalo de nuevo en un momento." actionLabel="Reintentar" onAction={retry} />
        ) : null}
        {status === 'ready' && addresses.length === 0 ? (
          <EmptyState icon="pin" title="Aún no tienes direcciones" message="Agrega la dirección de tu casa o de tu familia para cotizar más rápido." />
        ) : null}
        {status === 'ready' && addresses.length > 0 ? (
          <>
            <AppText variant="Body/14" tone="secondary">
              Si corriges una dirección, el cambio aplica a todos los jardines que están ahí.
            </AppText>
            {addresses.map((a) => (
              <AddressRow
                key={a.id}
                address={a}
                gardenCount={gardens.filter((g) => g.addressId === a.id).length}
                onPress={() => router.push({ pathname: '/perfil/direccion', params: { id: a.id } })}
              />
            ))}
          </>
        ) : null}
      </ScrollView>
      {toast ? <Toast icon="check" message={toast} bottom={110 + insets.bottom} /> : null}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.lg) }]}>
        <PrimaryButton label="Agregar dirección" onPress={add} disabled={status !== 'ready'} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: space.lg, paddingTop: space.sm, gap: space.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color['border/default'],
    backgroundColor: color['bg/surface'],
  },
  icon: { width: 40, height: 40, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: color['bg/brand-soft'] },
  texts: { flex: 1, gap: 2 },
  footer: {
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    borderTopWidth: 1,
    borderTopColor: color['border/default'],
    backgroundColor: color['bg/canvas'],
  },
});
