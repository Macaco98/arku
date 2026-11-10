import { color, radius, space, touchMin } from '@arku/ui';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppText } from '../../components/AppText';
import { Icon, type IconName } from '../../components/Icon';
import { StatusBanner } from '../../components/StatusBanner';
import { initialsOf, useCustomer, useServices } from '../../services';
import { seedDemoGardens } from '../../services/demo';
import { useGardenList } from '../../services/useGardenList';

const formatPhone = (p: string) => `${p.slice(0, 3)} ${p.slice(3, 6)} ${p.slice(6)}`;
const maskId = (id: string) => `••••••${id.slice(-4)}`;
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

function Row({ icon, title, subtitle, onPress, last }: { icon: IconName; title: string; subtitle?: string; onPress: () => void; last?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.row, !last && styles.rowBorder, pressed && { backgroundColor: color['bg/subtle'] }]}
    >
      <Icon name={icon} size={20} color={color['text/primary']} />
      <View style={styles.flex}>
        <AppText variant="Label/14" tone="primary">
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="Caption/12" tone="secondary">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      <Icon name="chevron-right" size={20} color={color['text/secondary']} />
    </Pressable>
  );
}

/** P01 · Perfil. */
export default function Perfil() {
  const router = useRouter();
  const customer = useCustomer();
  const { gardens: service, signOut } = useServices();
  const { gardens, addresses, retry } = useGardenList();
  const [seeding, setSeeding] = useState(false);
  const soon = (pantalla: string) => router.push({ pathname: '/proximamente', params: { pantalla } });

  const seed = async () => {
    setSeeding(true);
    try {
      await seedDemoGardens(service, customer.id);
      retry();
    } finally {
      setSeeding(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.identity}>
        <View style={styles.avatar}>
          <AppText variant="Title/20" tone="primary">
            {initialsOf(customer)}
          </AppText>
        </View>
        <View style={styles.flex}>
          <AppText variant="Title/20" tone="primary">
            {customer.firstName} {customer.lastName}
          </AppText>
          <AppText variant="Caption/12" tone="secondary">
            {formatPhone(customer.phone)} · Cédula {maskId(customer.idNumber)}
          </AppText>
        </View>
      </View>

      <View style={styles.card}>
        <Row icon="user" title="Datos personales" subtitle="Nombre, apellido y cédula" onPress={() => soon('Datos personales')} />
        <Row icon="pin" title="Mis direcciones" subtitle={plural(addresses.length, 'dirección guardada', 'direcciones guardadas')} onPress={() => soon('Mis direcciones')} />
        <Row icon="leaf" title="Mis jardines" subtitle={plural(gardens.length, 'jardín', 'jardines')} onPress={() => router.navigate('/jardines')} />
        <Row icon="info" title="Ayuda y soporte" onPress={() => soon('Ayuda y soporte')} />
        <Row icon="shield" title="Términos y privacidad" onPress={() => soon('Términos y privacidad')} last />
      </View>

      <Pressable
        onPress={async () => {
          await signOut();
          router.replace('/');
        }}
        accessibilityRole="button"
        style={styles.signOut}
      >
        <AppText variant="Label/14" tone="brand">
          Cerrar sesión
        </AppText>
      </Pressable>

      {/* Solo en desarrollo: carga los jardines del prototipo para probar las listas. */}
      {gardens.length === 0 ? (
        <View style={styles.demo}>
          <StatusBanner
            tipo="Info"
            title="Modo demostración"
            message="Carga jardines de ejemplo para probar Inicio y Mis jardines."
            actionLabel={seeding ? 'Cargando…' : 'Cargar jardines de ejemplo'}
            onAction={seeding ? undefined : seed}
          />
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, paddingTop: space.sm, gap: space.xl },
  flex: { flex: 1 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  avatar: { width: 64, height: 64, borderRadius: radius.full, backgroundColor: color['bg/brand-soft'], alignItems: 'center', justifyContent: 'center' },
  card: { borderRadius: radius.lg, borderWidth: 1, borderColor: color['border/default'], backgroundColor: color['bg/surface'], overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: touchMin + 12, paddingHorizontal: space.lg, paddingVertical: space.md },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: color['border/default'] },
  signOut: { minHeight: touchMin, justifyContent: 'center', paddingHorizontal: space.sm },
  demo: { marginTop: space.lg },
});
