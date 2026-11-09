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
    <ServicesProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShadowVisible: false,
          headerStyle: { backgroundColor: color['bg/canvas'] },
          headerTintColor: color['text/primary'],
          headerTitleStyle: { fontFamily: text['Body/16 Strong'].fontFamily },
          contentStyle: { backgroundColor: color['bg/canvas'] },
          headerBackButtonDisplayMode: 'minimal',
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Tus datos' }} />
        <Stack.Screen name="inicio" options={{ title: 'arku', headerBackVisible: false }} />
      </Stack>
    </ServicesProvider>
  );
}
