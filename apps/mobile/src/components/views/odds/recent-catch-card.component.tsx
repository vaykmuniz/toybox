import { View } from 'react-native';

import Avatar from '@/components/ui/avatar/avatar.component';
import Card from '@/components/ui/card/card.component';
import CustomImage from '@/components/ui/custom-image/custom-image.component';
import CustomText from '@/components/ui/text/text.component';
import type { RecentCatch } from '@/hooks/use-get-recent-catches.hook';

import { OddProgressBar } from './odd-progress-bar.component';

type RecentCatchCardProps = {
  catchItem: RecentCatch;
};

const oddsFromTries = (tries: number) => {
  if (tries <= 0) {
    return 0;
  }

  return Math.min(1, 1 / tries);
};

const formatCost = (minorUnits: number) => {
  return `$${(minorUnits / 100).toFixed(2)}`;
};

export function RecentCatchCard({ catchItem }: RecentCatchCardProps) {
  const oddValue = oddsFromTries(catchItem.tries);
  const ownerName = catchItem.owner.name ?? catchItem.owner.handle;

  return (
    <Card className="overflow-hidden p-0">
      <View className="flex-row gap-3 p-3">
        <View className="h-24 w-24 overflow-hidden rounded-lg bg-white/40">
          {catchItem.media_url ? (
            <CustomImage
              accessibilityLabel={catchItem.description}
              contentFit="cover"
              source={catchItem.media_url}
            />
          ) : (
            <View className="flex-1 items-center justify-center bg-ink/10 px-2">
              <CustomText className="text-center font-display text-xs font-bold text-ink/55">
                No image
              </CustomText>
            </View>
          )}
        </View>

        <View className="min-w-0 flex-1 gap-2">
          <View className="flex-row items-center gap-2">
            <Avatar
              accessibilityLabel={`${ownerName} profile photo`}
              size="xs"
              source={catchItem.owner.avatar_url}
            />
            <View className="min-w-0 flex-1">
              <CustomText className="font-display text-sm font-bold text-ink" numberOfLines={1}>
                {ownerName}
              </CustomText>
              <CustomText className="font-display text-xs font-semibold text-ink/55">
                {catchItem.owner.handle}
              </CustomText>
            </View>
          </View>

          <View className="gap-1">
            <CustomText className="font-display text-base font-black text-ink" numberOfLines={1}>
              {catchItem.description}
            </CustomText>
            <CustomText className="font-display text-xs font-semibold text-ink/60">
              {catchItem.caught ? 'Caught' : 'Missed'} | {catchItem.tries} tries |{' '}
              {formatCost(catchItem.cost_per_try)} each
            </CustomText>
          </View>

          {catchItem.caught ? <OddProgressBar value={oddValue} /> : null}
        </View>
      </View>
    </Card>
  );
}
