import '@/global.css';

import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { useColorScheme, View } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-splash-overlay/animated-icon';
import NavigationBar from '@/components/navigation-bar';
import { LinearGradient } from 'expo-linear-gradient';

const Pink = '#ff74b8';
const Blue = '#5ba7ff';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <View className="flex-1 bg-toybox-blue">
        <LinearGradient
          colors={[Pink, Blue]}
          end={{ x: 0.5, y: 1 }}
          start={{ x: 0.5, y: 0 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
          <AnimatedSplashOverlay />
          <NavigationBar />
      </View>
    </ThemeProvider>
  );
}
