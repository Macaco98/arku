import { SIZE_BAND_LABELS, type Garden } from '@arku/domain';
import { color, elevation, radius, space, touchMin } from '@arku/ui';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { Chip } from './Chip';
import { GardenPhoto } from './GardenPhoto';
import { Icon } from './Icon';

interface Props {
  garden: Garden;
  /** Texto de ubicación, p. ej. "Cumbayá · Av. Interoceánica km 12". */
  location: string;
  onPress: () => void;
  onEdit: () => void;
}

export function sizeLabel(garden: Pick<Garden, 'sizeBand'>) {
  const range = SIZE_BAND_LABELS[garden.sizeBand];
  return `Tamaño ${garden.sizeBand} · ${range.charAt(0).toLowerCase()}${range.slice(1)}`;
}

export function photoCountLabel(count: number) {
  return `${count} ${count === 1 ? 'foto' : 'fotos'}`;
}

/** Componente GardenCard de Figma: Con foto Sí · No. */
export function GardenCard({ garden, location, onPress, onEdit }: Props) {
  const hasPhotos = garden.photos.length > 0;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${garden.name}. ${location}. ${sizeLabel(garden)}. ${photoCountLabel(garden.photos.length)}.`}
      accessibilityHint="Abre el detalle del jardín"
      style={({ pressed }) => [styles.card, pressed && { backgroundColor: color['bg/subtle'] }]}
    >
      <View style={[styles.thumb, !hasPhotos && styles.thumbEmpty]}>
        {hasPhotos ? (
          <GardenPhoto size={72} />
        ) : (
          <>
            <Icon name="image" size={22} color={color['text/secondary']} />
            <AppText variant="Caption/12" tone="secondary">
              Sin fotos
            </AppText>
          </>
        )}
      </View>
      <View style={styles.content}>
        <AppText variant="Body/16 Strong" tone="primary" numberOfLines={1}>
          {garden.name}
        </AppText>
        <View style={styles.location}>
          <Icon name="pin" size={14} color={color['text/secondary']} />
          <AppText variant="Caption/12" tone="secondary" numberOfLines={1} style={styles.flex}>
            {location}
          </AppText>
        </View>
        <View style={styles.chips}>
          <Chip label={sizeLabel(garden)} tone="marca" />
          <Chip label={photoCountLabel(garden.photos.length)} />
        </View>
      </View>
      <Pressable
        onPress={onEdit}
        hitSlop={4}
        accessibilityRole="button"
        accessibilityLabel={`Editar ${garden.name}`}
        style={({ pressed }) => [styles.edit, pressed && { backgroundColor: color['bg/brand-soft'] }]}
      >
        <Icon name="edit" size={20} color={color['text/brand']} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color['border/default'],
    backgroundColor: color['bg/surface'],
    boxShadow: elevation[1],
  },
  thumb: { width: 72, height: 72, borderRadius: radius.md, overflow: 'hidden' },
  thumbEmpty: { backgroundColor: color['bg/subtle'], alignItems: 'center', justifyContent: 'center', gap: 2 },
  content: { flex: 1, gap: space.xs },
  location: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  flex: { flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  edit: { width: touchMin, height: touchMin, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
});
