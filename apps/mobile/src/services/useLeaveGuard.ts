import { useNavigation, usePreventRemove } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

/**
 * D03 · Descartar cambios: si hay cambios sin guardar, volver atrás pregunta antes de salir.
 * `fallback` se usa cuando no hay pantalla anterior (p. ej. se abrió con un enlace).
 */
export function useLeaveGuard(dirty: boolean, fallback: () => void) {
  const navigation = useNavigation();
  const [asking, setAsking] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const repeat = useRef<() => void>(undefined);
  const fallbackRef = useRef(fallback);
  fallbackRef.current = fallback;

  usePreventRemove(dirty && !leaving, ({ repeat: again }) => {
    repeat.current = again;
    setAsking(true);
  });

  useEffect(() => {
    if (!leaving) return;
    const again = repeat.current;
    repeat.current = undefined;
    if (again) again();
    else if (navigation.canGoBack()) navigation.goBack();
    else fallbackRef.current();
  }, [leaving, navigation]);

  return {
    /** true mientras se muestra "¿Descartar los cambios?". */
    asking,
    /** Salir sin preguntar, p. ej. después de guardar. */
    leave: () => setLeaving(true),
    /** Botón Cancelar: pregunta solo si hay cambios. */
    cancel: () => (dirty ? setAsking(true) : setLeaving(true)),
    keepEditing: () => {
      repeat.current = undefined;
      setAsking(false);
    },
    discard: () => {
      setAsking(false);
      setLeaving(true);
    },
  };
}
