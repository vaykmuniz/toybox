import { Text, View } from 'react-native';

import type { FeedItem } from '@/hooks/use-get-feed.hook';

import { FeedCard } from './feed-card.component';

type FeedListProps = {
  items: FeedItem[];
};

export function FeedList({ items }: FeedListProps) {
  return (
    <View className="flex-1 flex-col gap-5 px-4">
      <View className="px-1">
        <Text className="font-display text-[34px] font-bold leading-10 text-ink">Feed</Text>
        <Text className="font-display text-base font-semibold leading-6 text-ink/65">
          Fresh toy finds from collectors nearby.
        </Text>
      </View>

      {items.map((item) => (
        <FeedCard item={item} key={item.id} />
      ))}
    </View>
  );
}
