import { LinearGradient } from 'expo-linear-gradient';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HomeMap } from '@/components/home-map';
import { BottomTabInset } from '@/hooks/use-theme/theme.consts';

const Pink = '#ff74b8';
const Blue = '#5ba7ff';

export default function HomeScreen() {
  return (
    <View className="flex-1 bg-toybox-blue">
      <LinearGradient
        colors={[Pink, Blue]}
        end={{ x: 0.5, y: 1 }}
        start={{ x: 0.5, y: 0 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '80%' }}
      />
      <SafeAreaView
        className="flex-1 px-6 pt-4"
        style={{ paddingBottom: BottomTabInset + 16 }}>
        <View className="flex-1 overflow-hidden rounded-2xl bg-white/35">
          <HomeMap />
        </View>
        <View className="flex-1 items-center justify-center">
          <Text className="font-display text-[40px] font-bold leading-[48px] text-ink">Home</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}
