import { phoneSchema } from '@arku/domain';
import { space } from '@arku/ui';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../components/AppText';
import { PrimaryButton } from '../components/PrimaryButton';
import { StatusBanner } from '../components/StatusBanner';
import { TextField } from '../components/TextField';
import { useServices } from '../services';

/** "0991234567" → "099 123 4567" mientras se escribe. */
function formatTyping(value: string) {
  const d = value.replace(/\D/g, '').slice(0, 10);
  return [d.slice(0, 3), d.slice(3, 6), d.slice(6)].filter(Boolean).join(' ');
}

/** A01 · Ingresa tu celular: envía un código por SMS. */
export default function IngresaCelular() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { auth } = useServices();
  const [phone, setPhone] = useState('');
  const [touched, setTouched] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string>();

  const parsed = phoneSchema.safeParse(phone);
  const fieldError = touched && !parsed.success ? parsed.error.issues[0]?.message : undefined;

  const send = async () => {
    setTouched(true);
    if (!parsed.success) return;
    setSending(true);
    setError(undefined);
    try {
      await auth.sendCode(parsed.data);
      router.push({ pathname: '/codigo', params: { phone: parsed.data } });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Inténtalo de nuevo.');
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.intro}>
          <AppText variant="Heading/24" tone="primary" accessibilityRole="header">
            Ingresa a ARKU
          </AppText>
          <AppText tone="secondary">Te enviaremos un código por SMS para confirmar tu número.</AppText>
        </View>
        <TextField
          label="Número de celular"
          placeholder="099 123 4567"
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
          value={formatTyping(phone)}
          onChangeText={(v) => setPhone(v.replace(/\D/g, '').slice(0, 10))}
          onBlur={() => setTouched(true)}
          onSubmitEditing={send}
          error={fieldError}
          helper="Usa un número de Ecuador (+593)."
        />
        {error ? <StatusBanner tipo="Error" title="No pudimos enviar el código" message={error} /> : null}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.lg) }]}>
        <PrimaryButton label={sending ? 'Enviando…' : 'Enviar código'} onPress={send} loading={sending} disabled={phone.length < 10} />
        <AppText variant="Caption/12" tone="secondary" style={styles.center}>
          Al continuar aceptas los Términos y la Política de privacidad.
        </AppText>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: space.xl, paddingTop: space.sm, gap: space.xl },
  intro: { gap: space.sm },
  footer: { gap: space.md, paddingHorizontal: space.xl, paddingTop: space.md },
  center: { textAlign: 'center' },
});
