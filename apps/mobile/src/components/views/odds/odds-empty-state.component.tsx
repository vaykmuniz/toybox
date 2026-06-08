import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import CustomText from '@/components/ui/text/text.component';

type OddsErrorStateProps = {
  onRetry: () => void;
};

export function OddsLoadingState() {
  return (
    <View className="flex-1 items-center justify-center gap-4">
      <ActivityIndicator color="white" size="large" />
      <CustomText className="font-display text-base font-bold text-white">Loading odds</CustomText>
    </View>
  );
}

export function OddsErrorState({ onRetry }: OddsErrorStateProps) {
  return (
    <View className="flex-1 items-center justify-center gap-4 px-6">
      <CustomText className="text-center font-display text-xl font-bold text-white">
        Odds unavailable
      </CustomText>
      <Pressable
        accessibilityRole="button"
        className="rounded-full bg-white px-5 py-3"
        onPress={onRetry}>
        <Text className="font-display text-sm font-bold text-ink">Try again</Text>
      </Pressable>
    </View>
  );
}
