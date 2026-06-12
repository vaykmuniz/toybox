import '@/global.css';

import * as Sentry from '@sentry/react-native';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';
import {
  Fredoka_400Regular,
  Fredoka_600SemiBold,
  useFonts,
} from '@expo-google-fonts/fredoka';

import { AnimatedSplashOverlay } from '@/components/animated-splash-overlay/animated-icon';
import { configureDefaultFonts } from '@/constants/setup-fonts';
import { AuthProvider } from '@/hooks/use-auth-session.hook';

const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: sentryDsn,
  enabled: Boolean(sentryDsn),
  tracesSampleRate: __DEV__ ? 1.0 : 0.2,
});

function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    Fredoka_400Regular,
    Fredoka_600SemiBold,
  });

  if (!loaded) {
    return null;
  }

  configureDefaultFonts();

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="upload" />
          <Stack.Screen name="settings" />
        </Stack>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default Sentry.wrap(RootLayout);
