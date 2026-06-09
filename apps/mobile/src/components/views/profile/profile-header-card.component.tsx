import { Pressable, Text, View } from 'react-native';

import Avatar from '@/components/ui/avatar/avatar.component';
import Card from '@/components/ui/card/card.component';
import { useAuthSession } from '@/hooks/use-auth-session.hook';
import { GetProfile } from '@/hooks/use-get-profile.hook';
import { router } from 'expo-router';


type ProfileHeaderCardProps = {
  className?: string;
  profile: GetProfile;
};

export function ProfileHeaderCard({ className, profile }: ProfileHeaderCardProps) {
  const { clearSession, isLoading: isAuthLoading, user } = useAuthSession();

  const handleLogout = async () => {
    await clearSession();
    router.replace('/');
  };

  const handleUpload = () => {
    router.push('/upload');
  };

  return (
    <Card className={`gap-3 ${className ? ` ${className}` : ''}`}>
      <View className="flex-row flex-wrap gap-4 items-center space-x-4">
        <Avatar
          accessibilityLabel={`${profile.name} profile photo`}
          size="md"
          source={profile.avatar_url}
        />

        <View>
          <Text className="font-display text-3xl font-bold leading-9 text-ink">
            {profile.name}
          </Text>
          <Text className="font-display text-base font-semibold text-ink/70">
            {profile.handle}
          </Text>
        </View>
        <View className="flex-col justify-start items-start gap-3">
          <Pressable
            accessibilityRole="button"
            className="rounded-full bg-white px-4 py-2 w-fit"
            onPress={handleUpload}>
            <Text className="font-display text-sm font-bold text-ink">Upload</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            className="rounded-full bg-white/90 px-4 py-2"
            onPress={handleLogout}>
            <Text className="font-display text-sm font-bold text-ink">Log out</Text>
          </Pressable>
        </View>
      </View>
    </Card>
  );
}
