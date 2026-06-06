import { Text, View } from 'react-native';

import { ProfileStats as ProfileStatsType } from '@/hooks/use-get-profile.hook';

type ProfileStatsProps = {
  stats: ProfileStatsType;
};

const formatStat = (value: number) => {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`;
  }

  return value.toString();
};

export function ProfileStats({ stats }: ProfileStatsProps) {
  return (
    <View className="flex-row pt-1">
      <View className="items-center space-y-1" style={{ flexBasis: '33.333%' }}>
        <Text className="font-display text-lg font-bold text-ink">{formatStat(stats.posts)}</Text>
        <Text className="font-display text-xs font-semibold uppercase leading-4 text-toybox-pink">
          Posts
        </Text>
      </View>
      <View className="items-center space-y-1" style={{ flexBasis: '33.333%' }}>
        <Text className="font-display text-lg font-bold text-ink">
          {formatStat(stats.followers)}
        </Text>
        <Text className="font-display text-xs font-semibold uppercase leading-4 text-toybox-blue">
          Followers
        </Text>
      </View>
      <View className="items-center space-y-1" style={{ flexBasis: '33.333%' }}>
        <Text className="font-display text-lg font-bold text-ink">
          {formatStat(stats.following)}
        </Text>
        <Text className="font-display text-xs font-semibold uppercase leading-4 text-emerald-600">
          Following
        </Text>
      </View>
    </View>
  );
}
