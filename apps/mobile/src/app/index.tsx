import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FeedList } from '@/components/views/feed';
import { BottomTabInset } from '@/constants/layout';
import { useGetFeed } from '@/hooks/use-get-feed.hook';

export default function HomeScreen() {
  const feed = useGetFeed();
  const showLoading = feed.isLoading && feed.items.length === 0;
  const showError = feed.error && feed.items.length === 0;

  return (
    <SafeAreaView className="flex-1">
      <ScrollView
        className="flex-1"
        contentContainerClassName="flex-grow px-5 pt-4"
        contentContainerStyle={{ paddingBottom: BottomTabInset + 24 }}
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
              onPress={feed.refetch}>
              <Text className="font-display text-sm font-bold text-ink">Try again</Text>
            </Pressable>
          </View>
        ) : (
          <FeedList items={feed.items} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
