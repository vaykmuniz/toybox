import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { BottomTabInset } from '@/constants/layout';
import GradientBackground from '@/components/ui/gradient-background/gradient-background.component';
import { FeedList } from '@/components/views/feed/feed-list.component';
import { useGetFeed } from '@/hooks/use-get-feed.hook';

export default function HomeScreen() {
  const feedRequest = useGetFeed();
  const showLoading = feedRequest.isLoading && feedRequest.items.length === 0;
  const showError = feedRequest.error && feedRequest.items.length === 0;

  return (
    <GradientBackground>
      <ScrollView
        className="flex-1"
        contentContainerClassName="flex-grow pt-5"
        contentContainerStyle={{ paddingBottom: BottomTabInset + 20 }}
        showsVerticalScrollIndicator={false}>
        {showLoading ? (
          <View className="flex-1 items-center justify-center gap-4">
            <ActivityIndicator color="white" size="large" />
            <Text className="font-display text-base font-bold text-white">Loading feed</Text>
          </View>
        ) : showError ? (
          <View className="flex-1 items-center justify-center gap-4 px-6">
            <Text className="text-center font-display text-xl font-bold text-white">
              Feed unavailable
            </Text>
            <Pressable
              accessibilityRole="button"
              className="rounded-full bg-white px-5 py-3"
              onPress={feedRequest.refetch}>
              <Text className="font-display text-sm font-bold text-ink">Try again</Text>
            </Pressable>
          </View>
        ) : (
          <FeedList items={feedRequest.items} />
        )}
      </ScrollView>
    </GradientBackground>
  );
}
