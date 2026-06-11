import { ScrollView, View } from 'react-native';

import GradientBackground from '@/components/ui/gradient-background/gradient-background.component';
import CustomText from '@/components/ui/text/text.component';
import { OddsErrorState, OddsLoadingState } from '@/components/views/odds/odds-empty-state.component';
import { RecentCatchCard } from '@/components/views/odds/recent-catch-card.component';
import { useGetRecentCatches } from '@/hooks/use-get-recent-catches.hook';

export default function OddsScreen() {
  const catchesRequest = useGetRecentCatches();
  const showLoading = catchesRequest.isLoading && catchesRequest.catches.length === 0;
  const showError = catchesRequest.error && catchesRequest.catches.length === 0;

  return (
    <GradientBackground>
      <ScrollView
        className="flex-1"
        contentContainerClassName="h-full flex-grow p-5"
        showsVerticalScrollIndicator={false}>
        {showLoading ? (
          <OddsLoadingState />
        ) : showError ? (
          <OddsErrorState onRetry={catchesRequest.refetch} />
        ) : (
          <View className="flex-1 justify-start gap-4">
            <View className="items-center gap-3 pt-8">
              <CustomText className="text-center text-sm text-white">
                What's happening around you?
              </CustomText>
            </View>

            {catchesRequest.catches.length > 0 ? (
              <View className="gap-3">
                {catchesRequest.catches.map((catchItem) => (
                  <RecentCatchCard catchItem={catchItem} key={catchItem.id} />
                ))}
              </View>
            ) : (
              <View className="flex-1 items-center justify-center gap-2 px-6">
                <CustomText className="text-center font-display text-xl font-bold text-white">
                  No catches in the last hour
                </CustomText>
                <CustomText className="text-center font-display text-sm font-semibold text-white/75">
                  Check again soon for fresh toy activity.
                </CustomText>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </GradientBackground>
  );
}
