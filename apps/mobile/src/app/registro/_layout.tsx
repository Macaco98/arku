import { color, radius, text, touchMin } from '@arku/ui';
import { Redirect, Stack, useNavigation } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Icon } from '../../components/Icon';
import { useServices } from '../../services';
import { discardPhoto } from '../../services/photos';
import { RegistroExitContext, RegistroProvider, useRegistro } from '../../services/registro';


function RegistroStack() {
  const parent = useNavigation();
  const { dirty, draft } = useRegistro();
  const [asking, setAsking] = useState(false);

  const exit = useCallback(
    (opts?: { keepPhotos?: boolean }) => {
      setAsking(false);
      // Sin guardar, las fotos copiadas a la carpeta privada ya no sirven.
      if (!opts?.keepPhotos) draft.photos.forEach((p) => discardPhoto(p.storageKey));
      if (parent.canGoBack()) parent.goBack();
    },
    [parent, draft.photos],
  );
  const requestExit = useCallback(() => (dirty ? setAsking(true) : exit()), [dirty, exit]);

  return (
    <RegistroExitContext.Provider value={{ requestExit, exit }}>
      <Stack
        screenOptions={({ route }) => ({
          title: 'Nuevo jardín',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: color['bg/canvas'] },
          headerTintColor: color['text/primary'],
          headerTitleStyle: { fontFamily: text['Body/16 Strong'].fontFamily },
          headerTitleAlign: 'center',
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: color['bg/canvas'] },
          headerLeft:
            // En el primer paso, X para salir; en los demás, la flecha atrás.
            route.name === 'index'
              ? () => (
                  <Pressable onPress={requestExit} accessibilityRole="button" accessibilityLabel="Salir del registro" style={styles.close}>
                    <Icon name="close" size={24} color={color['text/primary']} />
                  </Pressable>
                )
              : undefined,
        })}
      />
      <ConfirmDialog
        visible={asking}
        title="¿Salir sin guardar?"
        message="Tu jardín todavía no está guardado. Si sales, se perderán los datos ingresados."
        confirmLabel="Seguir registrando"
        onConfirm={() => setAsking(false)}
        destructiveLabel="Salir"
        onDestructive={() => exit()}
      />
    </RegistroExitContext.Provider>
  );
}

/** S03–S06 · Registrar jardín. El borrador vive aquí hasta "Guardar jardín". */
export default function RegistroLayout() {
  const { customer, sessionStatus } = useServices();
  if (sessionStatus === 'loading') return null;
  if (!customer) return <Redirect href="/" />;
  return (
    <RegistroProvider>
      <RegistroStack />
    </RegistroProvider>
  );
}

const styles = StyleSheet.create({
  close: { width: touchMin, height: touchMin, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', marginLeft: -8 },
});
