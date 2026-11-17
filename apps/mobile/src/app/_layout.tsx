import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { color, text } from '@arku/ui';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ServicesProvider } from '../services';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });
  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <ServicesProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShadowVisible: false,
            headerStyle: { backgroundColor: color['bg/canvas'] },
            headerTintColor: color['text/primary'],
            headerTitleStyle: { fontFamily: text['Body/16 Strong'].fontFamily },
            headerTitleAlign: 'center',
            contentStyle: { backgroundColor: color['bg/canvas'] },
            headerBackButtonDisplayMode: 'minimal',
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="ingresar" options={{ title: '' }} />
          <Stack.Screen name="codigo" options={{ title: '' }} />
          <Stack.Screen name="tus-datos" options={{ title: 'Tus datos', headerBackVisible: false, gestureEnabled: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="registro" options={{ headerShown: false }} />
          <Stack.Screen name="cotizacion/[id]" options={{ title: 'Cotización' }} />
          <Stack.Screen name="jardin/[id]/index" options={{ title: 'Jardín' }} />
          <Stack.Screen name="jardin/[id]/editar" options={{ title: 'Editar jardín' }} />
          <Stack.Screen name="cotizar/index" options={{ title: 'Cotizar jardinería' }} />
          <Stack.Screen name="cotizar/[id]" options={{ title: 'Jardín' }} />
          <Stack.Screen name="perfil/datos" options={{ title: 'Datos personales' }} />
          <Stack.Screen name="perfil/direcciones" options={{ title: 'Mis direcciones' }} />
          <Stack.Screen name="perfil/direccion" options={{ title: 'Dirección' }} />
          <Stack.Screen name="proximamente" options={{ title: 'Próximamente', presentation: 'modal' }} />
        </Stack>
      </ServicesProvider>
    </SafeAreaProvider>
  );
}
