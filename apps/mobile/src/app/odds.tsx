import { View } from 'react-native';

import GradientBackground from '@/components/ui/gradient-background/gradient-background.component';
import Avatar from '@/components/ui/avatar/avatar.component';
import CustomText from '@/components/ui/text/text.component';

export default function OddsScreen() {
  return (
    <GradientBackground>
      <View className="align-center flex-1 items-center justify-center gap-4 p-5">
        <CustomText className="font-display text-base font-bold text-white">Odds</CustomText>

        <View className="m-4 w-full flex-row gap-4 rounded-lg bg-ink/10 p-4">
          <Avatar size="md" source={{ uri: 'https://avatars.githubusercontent.com/u/12345678?v=4' }} />
          <View className="flex-col gap-1">
            <CustomText className="font-display text-sm font-bold text-white">User Name</CustomText>
            <CustomText className="text-sm text-white/70">10 bixinhos</CustomText>
            <CustomText className="text-sm text-white/70">10 Tentativas</CustomText>
            <CustomText className="text-sm text-white/70">0.1 Odd</CustomText>
          </View>
        </View>
      </View>
    </GradientBackground>
  );
}
