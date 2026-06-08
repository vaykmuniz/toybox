import { useCallback } from 'react';
import { Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';

import GradientBackground from '@/components/ui/gradient-background/gradient-background.component';
import CustomText from '@/components/ui/text/text.component';
import { useGetProfile } from '@/hooks/use-get-profile.hook';
import { useGetUserLatLong, type UserLatLong } from '@/hooks/use-get-user-lat-long.hook';

import { OddsErrorState, OddsLoadingState } from './odds-empty-state.component';
import { OddsProfileCard } from './odds-profile-card.component';

const defaultOddValue = 0.1;

const resolveOddValue = (latLong: UserLatLong | null) => {
  if (!latLong) {
    return defaultOddValue;
  }

  // The odds API/formula will use this location context when it is ready.
  return defaultOddValue;
};

export function OddsView() {
  const profileRequest = useGetProfile();
  const locationRequest = useGetUserLatLong();
  const { width } = useWindowDimensions();
  const showLoading = profileRequest.isLoading && !profileRequest.profile;
  const showError = profileRequest.error && !profileRequest.profile;
  const carouselSize = Math.min(112, Math.max(84, width * 0.24));
  const isRefreshing = profileRequest.isLoading || locationRequest.isLoading;
  const oddValue = resolveOddValue(locationRequest.latLong);
  const handleRefresh = useCallback(async () => {
    await Promise.all([profileRequest.refetch(), locationRequest.refetch()]);
  }, [locationRequest, profileRequest]);

  return (
    <GradientBackground>
      <ScrollView
        className="flex-1"
        contentContainerClassName="flex-grow p-5"
        showsVerticalScrollIndicator={false}>
        {showLoading ? (
          <OddsLoadingState />
        ) : showError ? (
          <OddsErrorState onRetry={profileRequest.refetch} />
        ) : profileRequest.profile ? (
          <View className="flex-1 justify-center gap-4">
            <View className="items-center gap-3">
              <CustomText className="text-center font-display text-base font-bold text-white">
                Odds
              </CustomText>
              <Pressable
                accessibilityRole="button"
                className={`rounded-full bg-white px-5 py-3${isRefreshing ? ' opacity-60' : ''}`}
                disabled={isRefreshing}
                onPress={handleRefresh}>
                <Text className="font-display text-sm font-bold text-ink">
                  {isRefreshing ? 'Refreshing' : 'Refresh'}
                </Text>
              </Pressable>
            </View>

            <OddsProfileCard
              carouselSize={carouselSize}
              oddValue={oddValue}
              profile={profileRequest.profile}
            />
            
          </View>
        ) : null}
      </ScrollView>
    </GradientBackground>
  );
}
