import { View, type ViewProps } from 'react-native';

import { ThemeColor } from '@/hooks/use-theme/theme.consts';
import { useTheme } from '@/hooks/use-theme/use-theme';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  type?: ThemeColor;
};

export function ThemedView({ style, lightColor, darkColor, type, ...otherProps }: ThemedViewProps) {
  const theme = useTheme();

  return <View style={[{ backgroundColor: theme[type ?? 'background'] }, style]} {...otherProps} />;
}
