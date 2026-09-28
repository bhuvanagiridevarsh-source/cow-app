import { Baloo2_600SemiBold } from '@expo-google-fonts/baloo-2/600SemiBold';
import { Baloo2_700Bold } from '@expo-google-fonts/baloo-2/700Bold';
import { Baloo2_800ExtraBold } from '@expo-google-fonts/baloo-2/800ExtraBold';
import { Nunito_400Regular } from '@expo-google-fonts/nunito/400Regular';
import { Nunito_600SemiBold } from '@expo-google-fonts/nunito/600SemiBold';
import { Nunito_700Bold } from '@expo-google-fonts/nunito/700Bold';
import { Nunito_800ExtraBold } from '@expo-google-fonts/nunito/800ExtraBold';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AuthProvider, useAuth } from '@/features/auth/auth-provider';
import { DeviceStateProvider, useDeviceState } from '@/features/device-state';
import { queryClient, wireQueryManagers } from '@/lib/query';
import { isSupabaseConfigured } from '@/lib/supabase';
import { palettes } from '@/theme';

SplashScreen.preventAutoHideAsync();
wireQueryManagers();

export default function RootLayout() {
  const scheme = useColorScheme();
  const p = scheme === 'dark' ? palettes.dark : palettes.light;
  // If a font fails to load we still show the app (system font) rather than a stuck splash.
  const [fontsLoaded, fontError] = useFonts({
    Baloo2_600SemiBold,
    Baloo2_700Bold,
    Baloo2_800ExtraBold,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });
  const fontsReady = fontsLoaded || !!fontError;

  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: { ...base.colors, background: p.background, card: p.surface, text: p.heading, primary: p.brand, border: p.border },
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <DeviceStateProvider>
          <AuthProvider>
            <ThemeProvider value={navTheme}>
              <BottomSheetModalProvider>
                <StatusBar style="auto" />
                <RootNavigator fontsReady={fontsReady} />
              </BottomSheetModalProvider>
            </ThemeProvider>
          </AuthProvider>
        </DeviceStateProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

/**
 * Every app state has its own screens; the right ones switch on automatically:
 *   signed out -> (auth)   finishing sign-up -> onboarding   signed in -> (app)
 * Legal pages are reachable from anywhere.
 */
function RootNavigator({ fontsReady }: { fontsReady: boolean }) {
  const { status } = useAuth();
  const { loaded } = useDeviceState();
  const ready = fontsReady && loaded;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null; // the splash screen stays up

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Protected guard={!isSupabaseConfigured}>
        <Stack.Screen name="not-configured" />
      </Stack.Protected>
      <Stack.Protected guard={isSupabaseConfigured}>
        <Stack.Protected guard={status === 'loading' || status === 'error'}>
          <Stack.Screen name="status" />
        </Stack.Protected>
        <Stack.Protected guard={status === 'signed_out'}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected guard={status === 'onboarding'}>
          <Stack.Screen name="onboarding" />
        </Stack.Protected>
        <Stack.Protected guard={status === 'ready'}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
        <Stack.Screen name="legal/[doc]" options={{ presentation: 'modal', animation: 'default' }} />
      </Stack.Protected>
    </Stack>
  );
}
