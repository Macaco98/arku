import { MAX_ACCESS_NOTES, MAX_PHOTOS_PER_GARDEN } from '@arku/domain';
import { space } from '@arku/ui';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../components/AppText';
import { PhotoUploader } from '../../components/PhotoUploader';
import { PrimaryButton } from '../../components/PrimaryButton';
import { StatusBanner } from '../../components/StatusBanner';
import { StepLayout } from '../../components/StepLayout';
import { TextField } from '../../components/TextField';
import { Toast } from '../../components/Toast';
import { discardPhoto, pickGardenPhotos, type PickedPhoto } from '../../services/photos';
import { useRegistro } from '../../services/registro';

const UNDO_MS = 5000;

type PickProblem = 'denied' | 'error' | undefined;

/** S05 · Fotos y detalles: hasta 6 fotos opcionales y notas del jardín. */
export default function Fotos() {
  const router = useRouter();
  const { draft, update } = useRegistro();
  const [uploading, setUploading] = useState(false);
  const [problem, setProblem] = useState<PickProblem>();
  const [removed, setRemoved] = useState<{ photo: PickedPhoto; index: number }>();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const photos = draft.photos;

  useEffect(() => () => clearTimeout(timer.current), []);

  const add = async () => {
    setProblem(undefined);
    setUploading(true);
    const result = await pickGardenPhotos(MAX_PHOTOS_PER_GARDEN - photos.length);
    setUploading(false);
    if (result.status === 'ok') update({ photos: [...photos, ...result.photos].slice(0, MAX_PHOTOS_PER_GARDEN) });
    if (result.status === 'denied' || result.status === 'error') setProblem(result.status);
  };

  const finishUndo = (pending = removed) => {
    clearTimeout(timer.current);
    if (pending) discardPhoto(pending.photo.storageKey);
    setRemoved(undefined);
  };

  const remove = (photo: PickedPhoto) => {
    finishUndo();
    const index = photos.findIndex((p) => p.storageKey === photo.storageKey);
    update({ photos: photos.filter((p) => p.storageKey !== photo.storageKey) });
    const pending = { photo, index };
    setRemoved(pending);
    timer.current = setTimeout(() => finishUndo(pending), UNDO_MS);
  };

  const undo = () => {
    if (!removed) return;
    clearTimeout(timer.current);
    const next = [...photos];
    next.splice(removed.index, 0, removed.photo);
    update({ photos: next });
    setRemoved(undefined);
  };

  const notesTooLong = draft.accessNotes.length > MAX_ACCESS_NOTES;
  const lWithoutPhotos = draft.sizeBand === 'L' && photos.length === 0;

  return (
    <StepLayout
      step={3}
      stepLabel="Fotos y detalles"
      title="Fotos y detalles"
      subtitle="Opcional. Las fotos nos ayudan a cotizar mejor, pero puedes guardar sin ellas."
      overlay={removed ? <Toast icon="trash" message="Foto eliminada" actionLabel="Deshacer" onAction={undo} /> : undefined}
      footer={
        <>
          {lWithoutPhotos ? (
            <StatusBanner
              tipo="Advertencia"
              title="Sin fotos, tu jardín L pasará a revisión manual"
              message="Con al menos 1 foto te damos el precio al instante."
            />
          ) : null}
          <PrimaryButton
            label="Continuar"
            disabled={uploading || notesTooLong}
            onPress={() => {
              finishUndo();
              router.push('/registro/revisar');
            }}
          />
        </>
      }
    >
      <View style={styles.group}>
        <PhotoUploader photos={photos} max={MAX_PHOTOS_PER_GARDEN} uploading={uploading} onAdd={add} onRemove={remove} />
        <AppText variant="Caption/12" tone="secondary">
          {photos.length} de {MAX_PHOTOS_PER_GARDEN} fotos
          {photos.length > 0 ? ' · Toca la X para quitar una foto.' : ' · Toma fotos de todo el jardín, de día.'}
        </AppText>
        {problem === 'denied' ? (
          <StatusBanner tipo="Info" title="Necesitamos acceso a tus fotos" message="Actívalo en los ajustes del teléfono para elegir fotos de tu jardín." />
        ) : null}
        {problem === 'error' ? (
          <StatusBanner tipo="Error" title="No se pudo subir la foto" message="Revisa tu conexión e inténtalo de nuevo." actionLabel="Reintentar" onAction={add} />
        ) : null}
      </View>

      <TextField
        label="Notas sobre el jardín (opcional)"
        placeholder="Mascotas, plantas delicadas, por dónde se entra al jardín…"
        value={draft.accessNotes}
        onChangeText={(v) => update({ accessNotes: v })}
        multiline
        maxLength={MAX_ACCESS_NOTES}
        error={notesTooLong ? `Máximo ${MAX_ACCESS_NOTES} caracteres.` : undefined}
        helper={`Opcional · ${draft.accessNotes.length}/${MAX_ACCESS_NOTES} caracteres`}
      />
    </StepLayout>
  );
}

const styles = StyleSheet.create({
  group: { gap: space.sm },
});
