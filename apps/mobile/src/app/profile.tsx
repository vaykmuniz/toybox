import { LinearGradient } from 'expo-linear-gradient';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomTabInset } from '@/hooks/use-theme/theme.consts';

const Pink = '#ff74b8';
const Blue = '#5ba7ff';

export default function ProfileScreen() {
  return (
    <View className="flex-1 bg-toybox-pink">
      <LinearGradient
        colors={[Blue, Pink]}
        end={{ x: 0.5, y: 1 }}
        start={{ x: 0.5, y: 0 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '80%' }}
      />
      <SafeAreaView className="flex-1 px-6" style={{ paddingBottom: BottomTabInset + 16 }}>
        <View className="flex-1 items-center justify-center gap-4">
          <View className="h-28 w-28 rounded-full border-[3px] border-ink bg-white/35" />
          <Text className="font-display text-[40px] font-bold leading-[48px] text-ink">Profile</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}
