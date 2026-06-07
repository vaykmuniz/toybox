import { View } from 'react-native';

type OddProgressBarProps = {
  maxWidth?: number;
  value: number;
};

export function OddProgressBar({ maxWidth = 100, value }: OddProgressBarProps) {
  const progress = Math.min(Math.max(value, 0), 1);

  return (
    <View
      className="h-3 overflow-hidden rounded-full bg-white/20"
      style={{ maxWidth, width: '100%' }}>
      <View
        className="h-full rounded-full bg-toybox-pink"
        style={{ width: `${progress * 100}%` }}
      />
    </View>
  );
}
