import { Text, View } from 'react-native';

import Avatar from '@/components/ui/avatar/avatar.component';
import Card from '@/components/ui/card/card.component';
import CustomImage from '@/components/ui/custom-image/custom-image.component';
import type { FeedItem } from '@/hooks/use-get-feed.hook';

type FeedCardProps = {
  item: FeedItem;
};

const formatPostedAt = (postedAt: string) => {
  const date = new Date(postedAt);

  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
  }).format(date);
};

export function FeedCard({ item }: FeedCardProps) {
  return (
      <Card className="overflow-hidden p-0">
        <View className="flex-row items-center px-4 py-3">
          <Avatar
            accessibilityLabel={`${item.author.name} profile photo`}
            size="sm"
            source={item.author.avatar_url}
          />

          <View className="ml-3 flex-1">
            <Text className="font-display text-base font-bold leading-5 text-ink">
              {item.author.name}
            </Text>
            <Text className="font-display text-xs font-semibold leading-4 text-ink/60">
              {item.author.handle} · {item.location}
            </Text>
          </View>

          <Text className="font-display text-xs font-semibold uppercase leading-4 text-ink/55">
            {formatPostedAt(item.posted_at)}
          </Text>
        </View>

        <View className="w-full bg-white/35" style={{ aspectRatio: 1 }}>
          <CustomImage
            accessibilityLabel={item.caption}
            contentFit="cover"
            source={item.media_url}
          />
        </View>

        <View className="gap-3 px-4 py-4">
          <Text className="font-display text-base font-semibold leading-6 text-ink">
            {item.caption}
          </Text>
        </View>
      </Card>
  );
}
