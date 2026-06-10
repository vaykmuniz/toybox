import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import GradientBackground from '@/components/ui/gradient-background/gradient-background.component';
import { ProfileHeaderCard } from '@/components/views/profile/profile-header-card.component';
import { ProfileToyGrid } from '@/components/views/profile/profile-toy-grid.component';
import { useAuthSession } from '@/hooks/use-auth-session.hook';
import { useGetProfile } from '@/hooks/use-get-profile.hook';

export default function ProfileScreen() {
  const { isLoading: isAuthLoading } = useAuthSession();
  const profileRequest = useGetProfile();
  const showLoading = isAuthLoading || (profileRequest.isLoading && !profileRequest.profile);
  const showError = profileRequest.error && !profileRequest.profile;
  const profile = profileRequest.profile;


  return (
    <GradientBackground>
      <View className="flex-1 pt-8">
        <ScrollView
          className="flex-1"
          contentContainerClassName="flex-grow p-5"
          showsVerticalScrollIndicator={false}>
          {showLoading ? (
            <View className="flex-1 items-center justify-center gap-4">
              <ActivityIndicator color="white" size="large" />
              <Text className="font-display text-base font-bold text-white">Loading profile</Text>
            </View>
          ) : showError ? (
            <View className="flex-1 items-center justify-center gap-4 px-6">
              <Text className="text-center font-display text-xl font-bold text-white">
                Profile unavailable
              </Text>
              <Pressable
                accessibilityRole="button"
                className="rounded-full bg-white px-5 py-3"
                onPress={profileRequest.refetch}>
                <Text className="font-display text-sm font-bold text-ink">Try again</Text>
              </Pressable>
            </View>
          ) : profile ? (
            <View className="gap-5">
              <ProfileHeaderCard profile={profile} />
              <ProfileToyGrid toys={profile.toys} />
            </View>
          ) : null}
        </ScrollView>
      </View>
    </GradientBackground>
  );
}
