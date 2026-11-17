import { gardenInputSchema } from '@arku/domain';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { AddressFields } from '../../components/AddressFields';
import { PrimaryButton } from '../../components/PrimaryButton';
import { StepLayout } from '../../components/StepLayout';
import { TextField } from '../../components/TextField';
import { useRegistro } from '../../services/registro';

/** S03 · Dirección: "Usar mi ubicación" o dirección escrita, referencia e indicaciones al llegar. */
export function DireccionForm() {
  const router = useRouter();
  const { draft, update, updateAddress } = useRegistro();
  const address = draft.newAddress;
  const [nameTouched, setNameTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);

  const name = gardenInputSchema.shape.name.safeParse(draft.name);
  const ready = name.success && !!address.coordinates && !!address.zoneName;

  const onContinue = () => {
    setSubmitted(true);
    if (!ready) return;
    update({ savedAddressId: undefined });
    router.push('/registro/tamano');
  };

  return (
    <StepLayout
      step={1}
      stepLabel="Dirección"
      title="¿Dónde está tu jardín?"
      subtitle="Por ahora atendemos Cumbayá y Tumbaco."
      footer={<PrimaryButton label="Continuar" onPress={onContinue} disabled={busy} />}
    >
      <TextField
        label="Nombre del jardín"
        placeholder="Casa Cumbayá"
        value={draft.name}
        onChangeText={(v) => update({ name: v })}
        onBlur={() => setNameTouched(true)}
        maxLength={40}
        error={(nameTouched || submitted) && !name.success ? name.error.issues[0]?.message : undefined}
        helper="Así lo verás en Mis jardines."
      />
      <AddressFields address={address} onChange={updateAddress} showErrors={submitted} onBusyChange={setBusy} />
    </StepLayout>
  );
}

export default function Direccion() {
  return <DireccionForm />;
}
