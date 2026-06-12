import { View } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';

import CustomImage from '@/components/ui/custom-image/custom-image.component';
import CustomText from '@/components/ui/text/text.component';
import type { Toy } from '@/hooks/use-get-profile.hook';

type ToyCarouselProps = {
  size: number;
  toys: Toy[];
};

export function ToyCarousel({ size, toys }: ToyCarouselProps) {
  const caughtToys = toys.filter((toy) => toy.caught && toy.media_url !== null);

  return (
    <View
      className="shrink-0 overflow-hidden rounded-2xl bg-white/25"
      style={{ height: size, width: size }}>
      {caughtToys.length > 0 ? (
        <Carousel
          autoPlay
          autoPlayInterval={2800}
          data={caughtToys}
          height={size}
          loop={caughtToys.length > 1}
          renderItem={({ item }) => (
            <View className="h-full w-full">
              <CustomImage
                accessibilityLabel={item.description}
                contentFit="cover"
                source={item.media_url ?? undefined}
              />
            </View>
          )}
          width={size}
        />
      ) : (
        <View className="h-full w-full items-center justify-center px-3">
          <CustomText className="text-center font-display text-xs font-bold text-white/70">
            No catches
          </CustomText>
        </View>
      )}
    </View>
  );
}
