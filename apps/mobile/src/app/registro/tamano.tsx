import { SIZE_BANDS } from '@arku/domain';
import { space } from '@arku/ui';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { PrimaryButton } from '../../components/PrimaryButton';
import { SizeOption } from '../../components/SizeOption';
import { StatusBanner } from '../../components/StatusBanner';
import { StepLayout } from '../../components/StepLayout';
import { useRegistro } from '../../services/registro';

/** S04 · Tamaño: S, M, L o XL, con lo que pasará al cotizar. */
export default function Tamano() {
  const router = useRouter();
  const { draft, update } = useRegistro();
  const size = draft.sizeBand;

  return (
    <StepLayout
      step={2}
      stepLabel="Tamaño"
      title="¿Qué tamaño tiene tu jardín?"
      subtitle="Elige un rango aproximado. No necesitas medirlo."
      footer={
        <>
          {size === 'L' ? (
            <StatusBanner
              tipo="Advertencia"
              title="Agrega al menos 1 foto en el siguiente paso"
              message="Así te damos el precio garantizado al instante. Sin fotos, pasará a revisión manual."
            />
          ) : null}
          {size === 'XL' ? (
            <StatusBanner
              tipo="Info"
              title="Los jardines XL se cotizan con revisión manual"
              message="Un especialista revisará tu jardín antes de darte un precio."
            />
          ) : null}
          <PrimaryButton label="Continuar" onPress={() => router.push('/registro/fotos')} disabled={!size} />
        </>
      }
    >
      <View style={styles.list} accessibilityRole="radiogroup">
        {SIZE_BANDS.map((s) => (
          <SizeOption key={s} size={s} selected={size === s} onPress={() => update({ sizeBand: s })} />
        ))}
      </View>
    </StepLayout>
  );
}

const styles = StyleSheet.create({
  list: { gap: space.md },
});
