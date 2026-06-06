import { Text, View } from 'react-native';

import Card from '@/components/ui/card/card.component';
import CustomImage from '@/components/ui/custom-image/custom-image.component';
import { Toy } from '@/hooks/use-get-profile.hook';

type ProfileToyGridProps = {
  toys: Toy[];
};

export function ProfileToyGrid({ toys }: ProfileToyGridProps) {
  return (
    <Card className="overflow-hidden p-0">
      <View className="flex-row items-center justify-between px-4 py-3">
        <Text className="font-display text-lg font-bold text-ink">Toy grid</Text>
        <Text className="font-display text-sm font-semibold text-ink/65">{toys.length} posts</Text>
      </View>

      {toys.length > 0 ? (
        <View className="flex-row flex-wrap bg-ink/10 p-0.5">
          {toys.map((toy) => (
            <View
              key={toy.id}
              className="p-0.5"
              style={{ aspectRatio: 1, flexBasis: '33.333%' }}>
              <View className="h-full w-full bg-white/45">
                <CustomImage
                  accessibilityLabel={toy.caption ?? 'Toy post'}
                  contentFit="cover"
                  source={toy.media_url}
                />
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View className="items-center justify-center px-6 py-16">
          <Text className="font-display text-base font-semibold text-ink/65">No toys yet</Text>
        </View>
      )}
    </Card>
  );
}
