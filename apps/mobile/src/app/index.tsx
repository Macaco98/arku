import { zodResolver } from '@hookform/resolvers/zod';
import { customerProfileSchema, validateCedula, type CustomerProfileInput } from '@arku/domain';
import { space } from '@arku/ui';
import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { AppText } from '../components/AppText';
import { PrimaryButton } from '../components/PrimaryButton';
import { TextField } from '../components/TextField';
import { useServices } from '../services';

/** Celular de desarrollo hasta conectar A01/A02 con un proveedor de SMS real. */
const DEV_PHONE = '0990000000';

/** A03 · Tus datos: nombre, apellido y cédula ecuatoriana validada en línea. */
export default function TusDatos() {
  const router = useRouter();
  const { gardens, signIn, customer, sessionStatus } = useServices();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>();
  const { control, handleSubmit, watch, formState } = useForm<CustomerProfileInput>({
    resolver: zodResolver(customerProfileSchema),
    defaultValues: { firstName: '', lastName: '', idNumber: '' },
    mode: 'onTouched',
  });

  const cedula = validateCedula(watch('idNumber') ?? '');
  const canSubmit = cedula.status === 'valid' && watch('firstName').trim().length > 1 && watch('lastName').trim().length > 1;

  const onSubmit = handleSubmit(async (values) => {
    setSaving(true);
    setSaveError(undefined);
    try {
      await signIn(await gardens.registerCustomer(DEV_PHONE, values));
      router.replace('/inicio');
    } catch {
      setSaveError('No pudimos guardar tus datos. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  });

  if (sessionStatus === 'loading') return null;
  if (customer) return <Redirect href="/inicio" />;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.intro}>
          <AppText variant="Heading/24" tone="primary" accessibilityRole="header">
            Cuéntanos quién eres
          </AppText>
          <AppText tone="secondary">Usamos tu cédula para verificar tu identidad. No la compartimos con los profesionales.</AppText>
        </View>

        <Controller
          control={control}
          name="firstName"
          render={({ field, fieldState }) => (
            <TextField label="Nombre" placeholder="Ana" autoComplete="given-name" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} />
          )}
        />
        <Controller
          control={control}
          name="lastName"
          render={({ field, fieldState }) => (
            <TextField label="Apellido" placeholder="Pérez" autoComplete="family-name" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} />
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
                success={cedula.status === 'valid' ? cedula.message : undefined}
                helper={cedula.status === 'incomplete' ? cedula.message : 'Cédula de ciudadanía ecuatoriana'}
              />
            );
          }}
        />
        {saveError ? <AppText tone="danger">{saveError}</AppText> : null}
      </ScrollView>
      <View style={styles.footer}>
        <PrimaryButton label="Continuar" onPress={onSubmit} disabled={!canSubmit} loading={saving} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: space.xl, gap: space.xl },
  intro: { gap: space.sm },
  footer: { padding: space.xl, paddingTop: space.md },
});
