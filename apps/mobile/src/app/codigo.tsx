import { color, radius, space, text } from '@arku/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../components/AppText';
import { PrimaryButton } from '../components/PrimaryButton';
import { StatusBanner } from '../components/StatusBanner';
import { useServices } from '../services';
import { CODE_LENGTH, DEMO_CODE } from '../services/auth';

const RESEND_SECONDS = 45;
const formatPhone = (p: string) => `${p.slice(0, 3)} ${p.slice(3, 6)} ${p.slice(6)}`;

/** A02 · Código de verificación: 6 dígitos del SMS, con reenvío a los 45 segundos. */
export default function CodigoVerificacion() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { auth, backend, verifyCode } = useServices();
  const { phone = '' } = useLocalSearchParams<{ phone: string }>();
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [wait, setWait] = useState(RESEND_SECONDS);
  const input = useRef<ComponentRef<typeof TextInput>>(null);
  const tried = useRef('');

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const verify = async (value = code) => {
    if (value.length !== CODE_LENGTH || verifying) return;
    tried.current = value;
    setVerifying(true);
    setError(undefined);
    try {
      const customer = await verifyCode(phone, value);
      router.dismissAll();
      router.replace(customer ? '/inicio' : '/tus-datos');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Inténtalo de nuevo.');
      setVerifying(false);
    }
  };

  const onChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, CODE_LENGTH);
    setCode(digits);
    setError(undefined);
    // Verifica solo al completar los 6 dígitos, y no repite un código que ya falló.
    if (digits.length === CODE_LENGTH && digits !== tried.current) verify(digits);
  };

  const resend = async () => {
    setNotice(undefined);
    setError(undefined);
    try {
      await auth.sendCode(phone);
      setWait(RESEND_SECONDS);
      setCode('');
      tried.current = '';
      setNotice('Te enviamos un código nuevo.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Inténtalo de nuevo.');
    }
  };

  const minutes = `${Math.floor(wait / 60)}:${String(wait % 60).padStart(2, '0')}`;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.intro}>
          <AppText variant="Heading/24" tone="primary" accessibilityRole="header">
            Ingresa el código
          </AppText>
          <AppText tone="secondary">Lo enviamos al {formatPhone(phone)}.</AppText>
        </View>

        <Pressable onPress={() => input.current?.focus()} style={styles.boxes} accessible={false}>
          {Array.from({ length: CODE_LENGTH }, (_, i) => {
            const active = i === Math.min(code.length, CODE_LENGTH - 1) && !verifying;
            return (
              <View
                key={i}
                style={[
                  styles.box,
                  active && { borderColor: color['border/focus'], borderWidth: 2 },
                  error ? { borderColor: color['border/danger'] } : null,
                ]}
              >
                <AppText variant="Title/20" tone="primary">
                  {code[i] ?? ''}
                </AppText>
              </View>
            );
          })}
          <TextInput
            ref={input}
            value={code}
            onChangeText={onChange}
            keyboardType="number-pad"
            autoComplete="sms-otp"
            textContentType="oneTimeCode"
            maxLength={CODE_LENGTH}
            autoFocus
            accessibilityLabel={`Código de ${CODE_LENGTH} dígitos`}
            style={styles.hiddenInput}
            caretHidden
          />
        </Pressable>

        {error ? <StatusBanner tipo="Error" title="No pudimos verificar el código" message={error} /> : null}
        {notice ? <StatusBanner tipo="Info" title="Código reenviado" message={notice} /> : null}
        {backend === 'demo' ? (
          <StatusBanner tipo="Info" title="Modo demostración" message={`No se envía ningún SMS. Usa el código ${DEMO_CODE}.`} />
        ) : null}

        <View style={styles.resend}>
          <AppText variant="Caption/12" tone="secondary">
            ¿No te llegó?
          </AppText>
          {wait > 0 ? (
            <AppText variant="Caption/12" tone="secondary">
              Reenviar en {minutes}
            </AppText>
          ) : (
            <Pressable onPress={resend} accessibilityRole="button" hitSlop={12}>
              <AppText variant="Label/14" tone="brand">
                Reenviar código
              </AppText>
            </Pressable>
          )}
        </View>
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.lg) }]}>
        <PrimaryButton label={verifying ? 'Verificando…' : 'Verificar'} onPress={() => verify()} loading={verifying} disabled={code.length !== CODE_LENGTH} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: space.xl, paddingTop: space.sm, gap: space.xl },
  intro: { gap: space.sm },
  boxes: { flexDirection: 'row', gap: space.sm, justifyContent: 'space-between' },
  box: {
    flex: 1,
    aspectRatio: 0.85,
    maxWidth: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color['border/default'],
    backgroundColor: color['bg/surface'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  hiddenInput: { ...StyleSheet.absoluteFill, opacity: 0, color: 'transparent', fontFamily: text['Body/16'].fontFamily },
  resend: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  footer: { paddingHorizontal: space.xl, paddingTop: space.md },
});
