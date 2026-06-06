import { View } from 'react-native';

import Pill from '@/components/ui/pill/pill.component';
import type { PillVariant } from '@/components/ui/pill/pill.types';
import { Badge } from '@/hooks/use-get-profile.hook';

type ProfileBadgeListProps = {
  badges: Badge[];
  className?: string;
};

const badgePillVariants: PillVariant[] = ['pink', 'blue', 'emerald', 'amber'];

export function ProfileBadgeList({ badges, className }: ProfileBadgeListProps) {
  if (badges.length === 0) {
    return null;
  }

  return (
    <View className={`flex-row flex-wrap gap-3 ${className ? ` ${className}` : ''}`}>
      {badges.map((badge, index) => (
        <Pill
          accessibilityLabel={badge.description}
          key={badge.text}
          label={badge.text}
          variant={badgePillVariants[index % badgePillVariants.length]}
        />
      ))}
    </View>
  );
}
