import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import Avatar from '@/components/ui/avatar/avatar.component';
import Card from '@/components/ui/card/card.component';
import { GetProfile } from '@/hooks/use-get-profile.hook';

type ProfileHeaderCardProps = {
  className?: string;
  profile: GetProfile;
};

const getInitials = (name: string) => {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return initials || '?';
};

export function ProfileHeaderCard({ className, profile }: ProfileHeaderCardProps) {
  const handleAvatarPress = () => {
    router.push('/settings');
  };

  return (
    <Card className={`gap-3 ${className ? ` ${className}` : ''}`}>
      <View className="flex-row flex-wrap gap-4 items-center space-x-4">
        <Pressable
          accessibilityLabel={`Open ${profile.name} settings`}
          accessibilityRole="button"
          onPress={handleAvatarPress}>
          <Avatar
            accessibilityLabel={`${profile.name} profile photo`}
            initials={getInitials(profile.name)}
            size="md"
            source={profile.avatar_url}
          />
        </Pressable>

        <View>
          <Text className="font-display text-3xl font-bold leading-9 text-ink">
            {profile.name}
          </Text>
          <Text className="font-display text-base font-semibold text-ink/70">
            {profile.handle}
          </Text>
        </View>
      </View>
    </Card>
  );
}
