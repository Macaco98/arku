import { color, radius, space } from '@arku/ui';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AppText } from '../../components/AppText';
import { InfoList } from '../../components/InfoList';
import { INCLUYE, NO_INCLUYE } from '../../services/alcance';

/** Respuestas tomadas de las reglas confirmadas (doc maestro y DECISIONS). No incluye precios. */
const PREGUNTAS = [
  {
    q: '¿Dónde atienden?',
    a: 'Por ahora solo en Cumbayá y Tumbaco. Al guardar una dirección te avisamos si está dentro de cobertura.',
  },
  {
    q: '¿Cómo se calcula el precio?',
    a: 'Según el tamaño aproximado de tu jardín (S, M, L o XL), no por metros exactos. S y M tienen precio inmediato. L tiene precio inmediato si agregas al menos una foto. XL siempre lo revisa un especialista de Arku.',
  },
  {
    q: '¿Tengo que subir fotos?',
    a: 'No. Puedes guardar tu jardín sin fotos y agregarlas cuando quieras. Tus fotos son privadas.',
  },
  {
    q: 'Si edito mi jardín, ¿cambia mi cotización?',
    a: 'No. Las cotizaciones que ya tienes no cambian. Los cambios se usan en las próximas cotizaciones.',
  },
  {
    q: '¿Puedo tener varios jardines?',
    a: 'Sí, incluso en la misma dirección, por ejemplo el jardín frontal y el posterior. Los registras una vez y los reutilizas.',
  },
];

/** P01 › Ayuda y soporte: preguntas frecuentes y alcance del servicio. */
export default function Ayuda() {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <AppText variant="Title/20" tone="primary" accessibilityRole="header">
        Preguntas frecuentes
      </AppText>
      {PREGUNTAS.map(({ q, a }) => (
        <View key={q} style={styles.card}>
          <AppText variant="Body/16 Strong" tone="primary">
            {q}
          </AppText>
          <AppText variant="Body/14" tone="secondary">
            {a}
          </AppText>
        </View>
      ))}
      <AppText variant="Title/20" tone="primary" accessibilityRole="header">
        Mantenimiento de jardín
      </AppText>
      <InfoList
        sections={[
          { title: 'Qué incluye', kind: 'check', items: INCLUYE },
          { title: 'No incluye', kind: 'close', items: NO_INCLUYE },
        ]}
        note="Propuesta de alcance por validar con jardineros."
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, paddingTop: space.sm, gap: space.md },
  card: {
    gap: space.xs,
    padding: space.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color['border/default'],
    backgroundColor: color['bg/surface'],
  },
});
