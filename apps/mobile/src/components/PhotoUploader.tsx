import { color, radius, space, touchMin } from '@arku/ui';
import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { Icon } from './Icon';

interface Photo {
  storageKey: string;
  uri: string;
}

interface Props {
  photos: Photo[];
  max: number;
  uploading?: boolean;
  onAdd: () => void;
  onRemove: (photo: Photo) => void;
}

/** Componente PhotoUploader de Figma: cuadrícula de 3 columnas con "Agregar" y X de 44 px para quitar. */
export function PhotoUploader({ photos, max, uploading = false, onAdd, onRemove }: Props) {
  const canAdd = photos.length < max;
  return (
    <View style={styles.grid}>
      {photos.map((p, i) => (
        <View key={p.storageKey} style={styles.cell}>
          <Image source={{ uri: p.uri }} style={styles.photo} contentFit="cover" accessibilityLabel={`Foto ${i + 1} del jardín`} />
          <Pressable
            onPress={() => onRemove(p)}
            accessibilityRole="button"
            accessibilityLabel={`Quitar foto ${i + 1}`}
            style={styles.removeTarget}
            hitSlop={4}
          >
            <View style={styles.removeIcon}>
              <Icon name="close" size={14} color={color['text/on-brand']} />
            </View>
          </Pressable>
        </View>
      ))}
      {uploading ? (
        <View style={[styles.cell, styles.add]}>
          <ActivityIndicator color={color['action/primary']} />
          <AppText variant="Caption/12" tone="secondary">
            Subiendo…
          </AppText>
        </View>
      ) : canAdd ? (
        <Pressable
          onPress={onAdd}
          accessibilityRole="button"
          accessibilityLabel="Agregar fotos"
          style={({ pressed }) => [styles.cell, styles.add, pressed && { backgroundColor: color['bg/subtle'] }]}
        >
          <Icon name="plus" size={24} color={color['text/primary']} />
          <AppText variant="Caption/12" tone="primary">
            Agregar
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const GAP = space.md;

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  cell: { width: `${(100 - 6) / 3}%`, aspectRatio: 1, borderRadius: radius.md, overflow: 'hidden' },
  photo: { width: '100%', height: '100%', backgroundColor: color['bg/subtle'] },
  removeTarget: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: touchMin,
    height: touchMin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeIcon: {
    width: 24,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: color['bg/brand'],
    opacity: 0.85,
    alignItems: 'center',
    justifyContent: 'center',
  },
  add: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: color['text/secondary'],
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
  },
});
