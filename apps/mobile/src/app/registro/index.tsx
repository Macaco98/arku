import { gardenInputSchema } from '@arku/domain';
import { color, radius, space } from '@arku/ui';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AddressOption } from '../../components/AddressOption';
import { AppText } from '../../components/AppText';
import { EmptyState } from '../../components/EmptyState';
import { Icon } from '../../components/Icon';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { PrimaryButton } from '../../components/PrimaryButton';
import { StepLayout } from '../../components/StepLayout';
import { TextField } from '../../components/TextField';
import { useRegistro } from '../../services/registro';
import { useGardenList } from '../../services/useGardenList';
import { DireccionForm } from './direccion';

/** S03 · Elegir dirección guardada. Sin direcciones guardadas, pasa directo al formulario. */
export default function ElegirDireccion() {
  const router = useRouter();
  const { draft, update } = useRegistro();
  const { status, addresses, gardens, retry } = useGardenList();
  const [selected, setSelected] = useState<string | undefined>(draft.savedAddressId);
  const [nameTouched, setNameTouched] = useState(false);

  useEffect(() => {
    if (!selected && addresses[0]) setSelected(addresses[0].id);
  }, [addresses, selected]);

  if (status === 'ready' && addresses.length === 0) return <DireccionForm />;

  const name = gardenInputSchema.shape.name.safeParse(draft.name);
  const nameError = nameTouched && !name.success ? name.error.issues[0]?.message : undefined;

  const onContinue = () => {
    if (!selected || !name.success) {
      setNameTouched(true);
      return;
    }
    update({ savedAddressId: selected });
    router.push('/registro/tamano');
  };

  return (
    <StepLayout
      step={1}
      stepLabel="Dirección"
      title="¿Dónde está tu jardín?"
      subtitle="Usa una dirección guardada o agrega una nueva."
      footer={<PrimaryButton label="Continuar" onPress={onContinue} disabled={status !== 'ready' || !selected} />}
    >
      {status === 'loading' ? <LoadingSkeleton count={2} /> : null}
      {status === 'error' ? (
        <EmptyState
          compact
          tone="peligro"
          icon="alert"
          title="No pudimos cargar tus direcciones"
          message="Inténtalo de nuevo en un momento."
          actionLabel="Reintentar"
          onAction={retry}
        />
      ) : null}
      {status === 'ready' ? (
        <View style={styles.list} accessibilityRole="radiogroup">
          {addresses.map((a) => (
            <AddressOption
              key={a.id}
              label={a.label}
              line={a.line}
              gardenCount={gardens.filter((g) => g.addressId === a.id).length}
              selected={selected === a.id}
              onPress={() => setSelected(a.id)}
            />
          ))}
          <Pressable
            onPress={() => {
              update({ savedAddressId: undefined });
              router.push('/registro/direccion');
            }}
            accessibilityRole="button"
            style={({ pressed }) => [styles.add, pressed && { backgroundColor: color['bg/subtle'] }]}
          >
            <Icon name="plus" size={20} color={color['text/primary']} />
            <AppText variant="Body/16 Strong" tone="primary">
              Agregar una nueva dirección
            </AppText>
          </Pressable>
          <View style={styles.note}>
            <Icon name="info" size={16} color={color['text/secondary']} />
            <AppText variant="Caption/12" tone="secondary" style={styles.flex}>
              Puedes registrar varios jardines en la misma dirección, por ejemplo el frontal y el posterior.
            </AppText>
          </View>
        </View>
      ) : null}
      {status === 'ready' ? (
        <TextField
          label="Nombre del jardín"
          placeholder="Jardín posterior"
          value={draft.name}
          onChangeText={(v) => update({ name: v })}
          onBlur={() => setNameTouched(true)}
          maxLength={40}
          error={nameError}
          helper="Así lo verás en Mis jardines."
        />
      ) : null}
    </StepLayout>
  );
}

const styles = StyleSheet.create({
  list: { gap: space.md },
  add: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color['border/default'],
    backgroundColor: color['bg/surface'],
  },
  note: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' },
  flex: { flex: 1 },
});
