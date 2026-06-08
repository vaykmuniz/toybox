import { Text, View } from 'react-native';

import ToyOdds from '@/components/shared/toy-odds.component';
import Card from '@/components/ui/card/card.component';
import { Toy } from '@/hooks/use-get-profile.hook';

type ProfileToyGridProps = {
  toys: Toy[];
};

export function ProfileToyGrid({ toys }: ProfileToyGridProps) {
  return (
    <Card className="overflow-hidden p-0">
      <View className="flex-row items-center justify-between px-4 py-3">
        <Text className="font-display text-lg font-bold text-ink">Your Toys</Text>
        <Text className="font-display text-sm font-semibold text-ink/65">{toys.length} toys</Text>
      </View>

      {toys.length > 0 ? toys.map((toy) => <ToyOdds key={toy.id} toy={toy} />
      ) : (
        <View className="items-center justify-center px-6 py-16">
          <Text className="font-display text-base font-semibold text-ink/65">No toys yet</Text>
        </View>
      )}
    </Card>
  );
}
