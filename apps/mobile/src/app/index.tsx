import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FeedList } from '@/components/views/feed';
import { BottomTabInset } from '@/constants/layout';
import { useGetFeed } from '@/hooks/use-get-feed.hook';

const Pink = '#ff74b8';
const Blue = '#5ba7ff';

export default function HomeScreen() {
  const feed = useGetFeed();

  return (
    <View className="flex-1 bg-toybox-blue">
      <LinearGradient
        colors={[Pink, Blue]}
        end={{ x: 0.5, y: 1 }}
        start={{ x: 0.5, y: 0 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <SafeAreaView className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pt-4"
          contentContainerStyle={{ paddingBottom: BottomTabInset + 24 }}
          showsVerticalScrollIndicator={false}>
          <FeedList items={feed.items} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
