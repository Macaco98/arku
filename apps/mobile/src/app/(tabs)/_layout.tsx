import { color } from '@arku/ui';
import { Redirect, Tabs, useRouter } from 'expo-router';
import { AppHeader } from '../../components/AppHeader';
import { BottomNavigation, type TabItem } from '../../components/BottomNavigation';
import { initialsOf, useServices } from '../../services';

const TABS: TabItem[] = [
  { key: 'inicio', label: 'Inicio', icon: 'home' },
  { key: 'jardines', label: 'Mis jardines', icon: 'leaf' },
  { key: 'perfil', label: 'Perfil', icon: 'user' },
];

/** Pestañas principales: S01 Inicio, S02 Mis jardines, P01 Perfil. */
export default function TabsLayout() {
  const router = useRouter();
  const { customer, sessionStatus } = useServices();
  if (sessionStatus === 'loading') return null;
  if (!customer) return <Redirect href="/" />;

  return (
    <Tabs
      screenOptions={{
        sceneStyle: { backgroundColor: color['bg/canvas'] },
        header: () => <AppHeader initials={initialsOf(customer)} onAvatarPress={() => router.navigate('/perfil')} />,
      }}
      tabBar={({ state, navigateToTab }) => (
        <BottomNavigation
          tabs={TABS}
          activeKey={state.routes[state.index]?.name ?? 'inicio'}
          onSelect={(name) => {
            const route = state.routes.find((r) => r.name === name);
            if (route) navigateToTab(route.key);
          }}
        />
      )}
    >
      <Tabs.Screen name="inicio" options={{ title: 'Inicio' }} />
      <Tabs.Screen name="jardines" options={{ title: 'Mis jardines' }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil' }} />
    </Tabs>
  );
}
