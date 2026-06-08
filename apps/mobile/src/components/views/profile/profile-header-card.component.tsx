import { Text, View } from 'react-native';

import Avatar from '@/components/ui/avatar/avatar.component';
import Card from '@/components/ui/card/card.component';
import { GetProfile } from '@/hooks/use-get-profile.hook';


type ProfileHeaderCardProps = {
  className?: string;
  profile: GetProfile;
};

export function ProfileHeaderCard({ className, profile }: ProfileHeaderCardProps) {
  return (
    <Card className={`gap-3 ${className ? ` ${className}` : ''}`}>
      <View className="flex-row flex-wrap gap-4 items-center space-x-4 mb-2 pb-4">
        <Avatar
          accessibilityLabel={`${profile.name} profile photo`}
          size="md"
          source={profile.avatar_url}
        />

        <View className="flex-1">
          <View>
            <Text className="font-display text-3xl font-bold leading-9 text-ink">
              {profile.name}
            </Text>
            <Text className="font-display text-base font-semibold text-ink/70">
              {profile.handle}
            </Text>
          </View>
        </View>
      </View>
    </Card>
  );
}
