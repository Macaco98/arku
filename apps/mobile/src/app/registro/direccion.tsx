import { ADDRESS_LABELS, addressInputSchema, gardenInputSchema, MAX_ARRIVAL_INSTRUCTIONS, type Coordinates } from '@arku/domain';
import { color, radius, space, touchMin } from '@arku/ui';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../components/AppText';
import { ChoiceChip } from '../../components/ChoiceChip';
import { Chip } from '../../components/Chip';
import { Icon } from '../../components/Icon';
import { PrimaryButton } from '../../components/PrimaryButton';
import { StatusBanner } from '../../components/StatusBanner';
import { StepLayout } from '../../components/StepLayout';
import { TextField } from '../../components/TextField';
import { useServices } from '../../services';
import { canGeocode, DEV_SAMPLE_LOCATION, geocodeLine, locateMe } from '../../services/location';
import { useRegistro } from '../../services/registro';

type Coverage =
  | { state: 'idle' }
  | { state: 'locating' }
  | { state: 'checking' }
  | { state: 'covered'; zone: string }
  | { state: 'outside' }
  | { state: 'not-found' }
  | { state: 'denied' }
  | { state: 'error'; retry: () => void }
  | { state: 'web-no-geocode' };

/** S03 · Dirección: "Usar mi ubicación" o dirección escrita, referencia e indicaciones al llegar. */
export function DireccionForm() {
  const router = useRouter();
  const { gardens: service } = useServices();
  const { draft, update, updateAddress } = useRegistro();
  const address = draft.newAddress;
  const [coverage, setCoverage] = useState<Coverage>(
    address.coordinates && address.zoneName ? { state: 'covered', zone: address.zoneName } : { state: 'idle' },
  );
  /** De dónde salió el punto: el GPS es más preciso, así que editar el texto no lo borra. */
  const source = useRef<'gps' | 'typed' | undefined>(address.coordinates ? 'typed' : undefined);
  const geocodedLine = useRef(address.coordinates ? address.line : '');
  const [touched, setTouched] = useState({ name: false, line: false });

  const name = gardenInputSchema.shape.name.safeParse(draft.name);
  const line = addressInputSchema.shape.line.safeParse(address.line);

  const check = async (coordinates: Coordinates) => {
    setCoverage({ state: 'checking' });
    try {
      const result = await service.checkCoverage(coordinates);
      if (result.covered) {
        updateAddress({ coordinates, zoneName: result.zone.name });
        setCoverage({ state: 'covered', zone: result.zone.name });
      } else {
        updateAddress({ coordinates, zoneName: undefined });
        setCoverage({ state: 'outside' });
      }
    } catch {
      setCoverage({ state: 'error', retry: () => check(coordinates) });
    }
  };

  const locateWithGps = async () => {
    setCoverage({ state: 'locating' });
    const result = await locateMe();
    if (result.status === 'denied') return setCoverage({ state: 'denied' });
    if (result.status === 'error') return setCoverage({ state: 'error', retry: locateWithGps });
    source.current = 'gps';
    if (!address.line.trim() && result.line) {
      updateAddress({ line: result.line });
      geocodedLine.current = result.line;
    }
    await check(result.coordinates);
  };

  const locateTyped = async () => {
    setTouched((t) => ({ ...t, line: true }));
    if (source.current === 'gps' || !line.success || address.line.trim() === geocodedLine.current) return;
    if (!canGeocode) return setCoverage({ state: 'web-no-geocode' });
    setCoverage({ state: 'checking' });
    try {
      const point = await geocodeLine(address.line);
      geocodedLine.current = address.line.trim();
      if (!point) return setCoverage({ state: 'not-found' });
      source.current = 'typed';
      await check(point);
    } catch {
      setCoverage({ state: 'error', retry: locateTyped });
    }
  };

  const onLineChange = (value: string) => {
    if (source.current !== 'gps' && address.coordinates) {
      // El punto venía del texto anterior: hay que volver a ubicarlo.
      updateAddress({ line: value, coordinates: undefined, zoneName: undefined });
      source.current = undefined;
      setCoverage({ state: 'idle' });
    } else {
      updateAddress({ line: value });
    }
  };

  const useSample = async () => {
    source.current = 'typed';
    geocodedLine.current = address.line.trim() || DEV_SAMPLE_LOCATION.line;
    if (!address.line.trim()) updateAddress({ line: DEV_SAMPLE_LOCATION.line });
    await check(DEV_SAMPLE_LOCATION.coordinates);
  };

  const ready = name.success && line.success && coverage.state === 'covered';
  const onContinue = () => {
    setTouched({ name: true, line: true });
    if (!ready) return;
    update({ savedAddressId: undefined });
    router.push('/registro/tamano');
  };

  const busy = coverage.state === 'locating' || coverage.state === 'checking';

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
        onBlur={() => setTouched((t) => ({ ...t, name: true }))}
        maxLength={40}
        error={touched.name && !name.success ? name.error.issues[0]?.message : undefined}
        helper="Así lo verás en Mis jardines."
      />

      <View style={styles.group}>
        <Pressable
          onPress={locateWithGps}
          disabled={busy}
          accessibilityRole="button"
          accessibilityState={{ disabled: busy, busy: coverage.state === 'locating' }}
          style={({ pressed }) => [styles.locate, pressed && { backgroundColor: color['bg/brand-soft'] }]}
        >
          {coverage.state === 'locating' ? (
            <ActivityIndicator color={color['action/primary']} />
          ) : (
            <Icon name="pin" size={20} color={color['text/brand']} />
          )}
          <AppText variant="Label/14" tone="brand">
            {coverage.state === 'locating' ? 'Buscando tu ubicación…' : 'Usar mi ubicación'}
          </AppText>
        </Pressable>

        <TextField
          label="Dirección"
          placeholder="Calle, número y sector"
          autoComplete="street-address"
          value={address.line}
          onChangeText={onLineChange}
          onBlur={locateTyped}
          onSubmitEditing={locateTyped}
          returnKeyType="search"
          error={touched.line && !line.success ? line.error.issues[0]?.message : undefined}
          helper={source.current === 'gps' && address.coordinates ? 'Ubicación tomada de tu GPS. Revisa que la dirección escrita sea correcta.' : undefined}
        />
        <CoverageLine coverage={coverage} onSample={useSample} />
      </View>

      <View style={styles.group}>
        <AppText variant="Label/14" tone="primary">
          Etiqueta de la dirección
        </AppText>
        <View style={styles.chips} accessibilityRole="radiogroup">
          {ADDRESS_LABELS.map((l) => (
            <ChoiceChip key={l} label={l} selected={address.label === l} onPress={() => updateAddress({ label: l })} />
          ))}
        </View>
      </View>

      <TextField
        label="Referencia (opcional)"
        placeholder="Portón negro, junto a la tienda"
        value={address.reference}
        onChangeText={(v) => updateAddress({ reference: v })}
        maxLength={200}
      />
      <TextField
        label="Indicaciones al llegar (opcional)"
        placeholder="Ej.: avisar al guardia y tocar el timbre de la casa 12"
        value={address.arrivalInstructions}
        onChangeText={(v) => updateAddress({ arrivalInstructions: v })}
        multiline
        maxLength={MAX_ARRIVAL_INSTRUCTIONS}
        helper="Las verá el profesional al llegar. Sirven para todos los jardines de esta dirección."
      />
    </StepLayout>
  );
}

export default function Direccion() {
  return <DireccionForm />;
}

function CoverageLine({ coverage, onSample }: { coverage: Coverage; onSample: () => void }) {
  switch (coverage.state) {
    case 'checking':
      return (
        <View style={styles.inline} accessibilityLiveRegion="polite">
          <ActivityIndicator size="small" color={color['text/secondary']} />
          <AppText variant="Caption/12" tone="secondary">
            Verificando cobertura…
          </AppText>
        </View>
      );
    case 'covered':
      return (
        <View style={styles.covered} accessibilityLiveRegion="polite">
          <Icon name="check" size={14} color={color['text/brand']} />
          <AppText variant="Caption/12" tone="brand">
            Dentro de cobertura · {coverage.zone}
          </AppText>
        </View>
      );
    case 'outside':
      return (
        <View style={styles.group}>
          <StatusBanner tipo="Error" title="Aún no llegamos a esta dirección" message="Por ahora atendemos solo en estas zonas. Prueba con otra dirección." />
          <View style={styles.chipsSmall}>
            <Chip label="Cumbayá" tone="marca" />
            <Chip label="Tumbaco" tone="marca" />
          </View>
        </View>
      );
    case 'not-found':
      return (
        <StatusBanner
          tipo="Advertencia"
          title="No encontramos esa dirección"
          message="Agrega el sector (por ejemplo, Cumbayá) o toca «Usar mi ubicación» si estás en el jardín."
        />
      );
    case 'denied':
      return (
        <StatusBanner
          tipo="Info"
          title="No tenemos permiso de ubicación"
          message="Escribe la dirección o activa el permiso de ubicación en los ajustes del teléfono."
        />
      );
    case 'error':
      return (
        <StatusBanner
          tipo="Error"
          title="No pudimos verificar la dirección"
          message="Revisa tu conexión e inténtalo de nuevo."
          actionLabel="Reintentar"
          onAction={coverage.retry}
        />
      );
    case 'web-no-geocode':
      return (
        <View style={styles.group}>
          <StatusBanner
            tipo="Info"
            title="Vista previa web"
            message="El navegador no puede ubicar una dirección escrita. En el teléfono sí funciona."
          />
          <Pressable onPress={onSample} accessibilityRole="button" style={styles.sample}>
            <AppText variant="Label/14" tone="brand">
              Usar ubicación de ejemplo (Cumbayá)
            </AppText>
          </Pressable>
        </View>
      );
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  group: { gap: space.sm },
  locate: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    minHeight: touchMin + 4,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color['action/primary'],
    backgroundColor: color['bg/surface'],
  },
  inline: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  covered: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    alignSelf: 'flex-start',
    paddingHorizontal: space.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: color['bg/success-soft'],
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chipsSmall: { flexDirection: 'row', gap: space.xs },
  sample: { minHeight: touchMin, justifyContent: 'center', alignSelf: 'flex-start' },
});
