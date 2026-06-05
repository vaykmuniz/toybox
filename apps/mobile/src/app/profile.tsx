import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomTabInset } from '@/constants/layout';
import { useGetProfile } from '@/hooks/use-get-profile.hook';

const Pink = '#ff74b8';
const Blue = '#5ba7ff';

const formatStat = (value: number) => {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`;
  }

  return value.toString();
};

export default function ProfileScreen() {
  const profile = useGetProfile();

  return (
    <View className="flex-1 bg-toybox-pink">
      <LinearGradient
        colors={[Pink, Blue]}
        end={{ x: 0.8, y: 1 }}
        start={{ x: 0.8, y: 0 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '80%' }}
      />
      <SafeAreaView className="flex-1" style={{ paddingBottom: BottomTabInset + 16 }}>
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-5 px-5 pt-4"
          showsVerticalScrollIndicator={false}>
          <View className="gap-5 rounded-[28px] border border-white/40 bg-white/40 p-5">
            <View className="flex-row items-center gap-5">
              <Image
                accessibilityLabel={`${profile.name} profile photo`}
                className="h-24 w-24 rounded-full border-[3px] border-ink bg-white/50"
                contentFit="cover"
                source={{ uri: profile.avatar_url }}
              />

              <View className="flex-1 gap-3">
                <View>
                  <Text className="font-display text-[30px] font-bold leading-[36px] text-ink">
                    {profile.name}
                  </Text>
                  <Text className="font-display text-base font-semibold text-ink/70">
                    {profile.handle}
                  </Text>
                </View>

                <View className="w-full flex-row rounded-2xl bg-white/55 py-3">
                    <Text className="font-display text-lg font-bold text-ink">
                      {formatStat(profile.stats.posts)}
                    </Text>
                    <Text className="font-display text-xs font-semibold uppercase text-ink/60">
                      Posts
                    </Text>
                    <Text className="font-display text-lg font-bold text-ink">
                      {formatStat(profile.stats.followers)}
                    </Text>
                    <Text className="font-display text-xs font-semibold uppercase text-ink/60">
                      Followers
                    </Text>
                    <Text className="font-display text-lg font-bold text-ink">
                      {formatStat(profile.stats.following)}
                    </Text>
                    <Text className="font-display text-xs font-semibold uppercase text-ink/60">
                      Following
                    </Text>
                </View>
              </View>
            </View>

            <Text className="font-display text-base leading-6 text-ink">{profile.bio}</Text>

            {profile.badges.length > 0 ? (
              <View className="flex-row flex-wrap gap-2">
                {profile.badges.map((badge) => (
                  <View key={badge.text} className="rounded-full border border-ink bg-white/65 px-3 py-2">
                    <Text className="font-display text-xs font-bold uppercase text-ink">
                      {badge.text}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>

          <View className="overflow-hidden rounded-[24px] border border-white/40 bg-white/40">
            <View className="flex-row items-center justify-between px-4 py-3">
              <Text className="font-display text-lg font-bold text-ink">Toy grid</Text>
              <Text className="font-display text-sm font-semibold text-ink/65">
                {profile.toys.length} posts
              </Text>
            </View>

            {profile.toys.length > 0 ? (
              <View className="flex-row flex-wrap gap-[2px] bg-ink/10">
                {profile.toys.map((toy) => (
                  <View key={toy.id} className="w-[33%] flex-grow bg-white/45" style={{ aspectRatio: 1 }}>
                    <Image
                      accessibilityLabel={toy.caption ?? 'Toy post'}
                      className="h-full w-full"
                      contentFit="cover"
                      source={{ uri: toy.media_url }}
                    />
                  </View>
                ))}
              </View>
            ) : (
              <View className="items-center justify-center px-6 py-16">
                <Text className="font-display text-base font-semibold text-ink/65">No toys yet</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
