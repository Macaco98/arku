import { SIZE_BAND_LABELS, type Garden } from '@arku/domain';
import { color, elevation, radius, space, touchMin } from '@arku/ui';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';
import { photoUri } from '../services/photos';
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
  // Foto privada guardada en este dispositivo; si no está (p. ej. datos de ejemplo), se usa la ilustración.
  const cover = hasPhotos ? photoUri(garden.photos[0]!.storageKey) : undefined;
  // Editar va junto a la tarjeta y no dentro: en web un botón no puede contener otro.
  return (
    <View>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${garden.name}. ${location}. ${sizeLabel(garden)}. ${photoCountLabel(garden.photos.length)}.`}
        accessibilityHint="Abre el detalle del jardín"
        style={({ pressed }) => [styles.card, pressed && { backgroundColor: color['bg/subtle'] }]}
      >
        <View style={[styles.thumb, !hasPhotos && styles.thumbEmpty]}>
          {hasPhotos ? (
            cover ? (
              <Image source={{ uri: cover }} style={styles.cover} contentFit="cover" accessible={false} />
            ) : (
              <GardenPhoto size={72} />
            )
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
      </Pressable>
      <Pressable
        onPress={onEdit}
        hitSlop={4}
        accessibilityRole="button"
        accessibilityLabel={`Editar ${garden.name}`}
        style={({ pressed }) => [styles.edit, pressed && { backgroundColor: color['bg/brand-soft'] }]}
      >
        <Icon name="edit" size={20} color={color['text/brand']} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingRight: touchMin + space.md,
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
  cover: { width: 72, height: 72 },
  thumbEmpty: { backgroundColor: color['bg/subtle'], alignItems: 'center', justifyContent: 'center', gap: 2 },
  content: { flex: 1, gap: space.xs },
  location: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  flex: { flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  edit: {
    position: 'absolute',
    right: space.sm,
    top: '50%',
    marginTop: -touchMin / 2,
    width: touchMin,
    height: touchMin,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
