import { zodResolver } from '@hookform/resolvers/zod';
import { customerProfileSchema, validateCedula, type CustomerProfileInput } from '@arku/domain';
import { color, radius, space } from '@arku/ui';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../../components/AppText';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Icon } from '../../components/Icon';
import { PrimaryButton } from '../../components/PrimaryButton';
import { SecondaryButton } from '../../components/SecondaryButton';
import { StatusBanner } from '../../components/StatusBanner';
import { TextField } from '../../components/TextField';
import { useCustomer, useServices } from '../../services';
import { setFlash } from '../../services/flash';
import { useLeaveGuard } from '../../services/useLeaveGuard';

const formatPhone = (p: string) => `${p.slice(0, 3)} ${p.slice(3, 6)} ${p.slice(6)}`;

/** P01 › Datos personales: nombre, apellido y cédula, con la misma validación de A03. */
export default function DatosPersonales() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const customer = useCustomer();
  const { gardens: service, updateCustomer } = useServices();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>();
  const defaults = { firstName: customer.firstName, lastName: customer.lastName, idNumber: customer.idNumber };
  const { control, handleSubmit, watch, formState } = useForm<CustomerProfileInput>({
    resolver: zodResolver(customerProfileSchema),
    defaultValues: defaults,
    mode: 'onTouched',
  });

  const values = watch();
  const cedula = validateCedula(values.idNumber ?? '');
  const dirty =
    values.firstName.trim() !== defaults.firstName || values.lastName.trim() !== defaults.lastName || values.idNumber !== defaults.idNumber;
  const valid = cedula.status === 'valid' && values.firstName.trim().length > 1 && values.lastName.trim().length > 1;
  const guard = useLeaveGuard(dirty && !saving, () => router.replace('/perfil'));

  const onSubmit = handleSubmit(async (data) => {
    setSaving(true);
    setSaveError(undefined);
    try {
      // Actualiza también el cliente de la sesión para que Perfil muestre los datos nuevos.
      updateCustomer(await service.updateCustomerProfile(customer.id, data));
      setFlash('Datos actualizados');
      guard.leave();
    } catch {
      setSaveError('No pudimos guardar tus datos. Intenta de nuevo.');
      setSaving(false);
    }
  });

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Controller
          control={control}
          name="firstName"
          render={({ field, fieldState }) => (
            <TextField label="Nombre" autoComplete="given-name" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} />
          )}
        />
        <Controller
          control={control}
          name="lastName"
          render={({ field, fieldState }) => (
            <TextField label="Apellido" autoComplete="family-name" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} />
          )}
        />
        <Controller
          control={control}
          name="idNumber"
          render={({ field }) => {
            const showError = cedula.status === 'invalid' || (cedula.status === 'incomplete' && formState.touchedFields.idNumber);
            return (
              <TextField
                label="Número de cédula"
                placeholder="10 dígitos"
                keyboardType="number-pad"
                maxLength={10}
                value={field.value}
                onChangeText={(v) => field.onChange(v.replace(/\D/g, ''))}
                onBlur={field.onBlur}
                error={showError ? cedula.message : undefined}
                helper={cedula.status === 'incomplete' ? cedula.message : 'Usamos tu cédula para verificar tu identidad. No la compartimos con los profesionales.'}
              />
            );
          }}
        />

        <View style={styles.phone}>
          <Icon name="shield" size={20} color={color['text/brand']} />
          <View style={styles.flex}>
            <AppText variant="Label/14" tone="primary">
              Celular {formatPhone(customer.phone)}
            </AppText>
            <AppText variant="Caption/12" tone="secondary">
              Verificado por SMS. Por ahora no se puede cambiar desde la app.
            </AppText>
          </View>
        </View>
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.lg) }]}>
        {saveError ? <StatusBanner tipo="Error" title="No se guardaron los cambios" message={saveError} /> : null}
        <PrimaryButton label={saving ? 'Guardando…' : 'Guardar cambios'} onPress={onSubmit} loading={saving} disabled={!dirty || !valid} />
        <SecondaryButton tipo="Texto" label="Cancelar" onPress={guard.cancel} />
      </View>
      <ConfirmDialog
        visible={guard.asking}
        title="¿Descartar los cambios?"
        message="Si sales ahora, perderás lo que editaste en tus datos."
        confirmLabel="Seguir editando"
        onConfirm={guard.keepEditing}
        destructiveLabel="Descartar cambios"
        onDestructive={guard.discard}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: space.lg, paddingTop: space.sm, gap: space.xl },
  phone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.lg,
    backgroundColor: color['bg/subtle'],
  },
  footer: {
    gap: space.xs,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    borderTopWidth: 1,
    borderTopColor: color['border/default'],
    backgroundColor: color['bg/canvas'],
  },
});
