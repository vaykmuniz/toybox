import { Toy } from '@/services/profile-api';
import { Text, View } from 'react-native';

import CustomImage from '../ui/custom-image/custom-image.component';
import { OddProgressBar } from '../views/odds/odd-progress-bar.component';

interface ToyOddsProps {
  toy: Toy;
}

const oddsFromTries = (tries: number) => {
  if (tries <= 0) {
    return 0;
  }

  return Math.min(1, 1 / tries);
};

const formatCost = (minorUnits: number) => {
  return `$${(minorUnits / 100).toFixed(2)}`;
};

export default function ToyOdds({ toy }: ToyOddsProps) {
  return (
    <View key={toy.id} className="gap-2 border-t border-ink/10 p-3">
      <View className="w-full" style={{ aspectRatio: 1 }}>
        <View className="h-full w-full overflow-hidden rounded-lg bg-white/45">
          {toy.media_url ? (
            <CustomImage
              accessibilityLabel={toy.description}
              contentFit="cover"
              source={toy.media_url}
            />
          ) : (
            <View className="h-full w-full items-center justify-center bg-ink/10 px-2">
              <Text className="text-center font-display text-xs font-bold text-ink/60">
                No catch
              </Text>
            </View>
          )}
          <View className="absolute inset-x-0 bottom-0 bg-ink/70 px-2 py-1">
            <Text className="font-display text-xs font-bold text-white" numberOfLines={1}>
              {toy.description}
            </Text>
          </View>
        </View>
      </View>
      <Text className="font-display text-xs font-bold text-ink/65">
        {toy.caught ? 'Caught' : 'Missed'} | {toy.tries} tries | {formatCost(toy.cost_per_try)}
      </Text>
      {toy.caught ? <OddProgressBar value={oddsFromTries(toy.tries)} /> : null}
    </View>
  );
}
