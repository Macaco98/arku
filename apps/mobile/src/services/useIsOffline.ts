import { useNetInfo } from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

/**
 * true cuando el dispositivo no tiene conexión.
 * En web, NetInfo no siempre detecta el modo sin conexión en Chrome, así que
 * se usa navigator.onLine y sus eventos.
 */
export function useIsOffline() {
  const net = useNetInfo();
  const [webOffline, setWebOffline] = useState(() => Platform.OS === 'web' && typeof navigator !== 'undefined' && !navigator.onLine);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const update = () => setWebOffline(!navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  return Platform.OS === 'web' ? webOffline : net.isConnected === false;
}
