import { View } from 'react-native';

import Avatar from '@/components/ui/avatar/avatar.component';
import Card from '@/components/ui/card/card.component';
import type { GetProfile } from '@/hooks/use-get-profile.hook';

import CustomText from '@/components/ui/text/text.component';
import { OddProgressBar } from './odd-progress-bar.component';
import { ToyCarousel } from './toy-carousel.component';

type OddsProfileCardProps = {
  carouselSize: number;
  oddValue: number;
  profile: GetProfile;
};

export function OddsProfileCard({ carouselSize, oddValue, profile }: OddsProfileCardProps) {
  return (
    <Card className="h-fit flex-row items-center gap-3 bg-ink/10">
      <Avatar
        accessibilityLabel={`${profile.name} profile photo`}
        size="sm"
        source={profile.avatar_url}
      />

      <ToyCarousel size={carouselSize} toys={profile.toys} />

      <View className="min-w-0 flex-1 items-start">
        <CustomText className="font-display text-sm font-bold text-ink" numberOfLines={1}>
          {oddValue.toFixed(2)}
        </CustomText>
        <OddProgressBar value={oddValue} />
      </View>
    </Card>
  );
}
