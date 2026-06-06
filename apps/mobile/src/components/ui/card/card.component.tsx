import { View } from 'react-native';

import { cardBaseClassName } from './card.styles';
import { CardProps } from './card.types';

export default function Card({ children, className, ...props }: CardProps) {
  return (
    <View className={`${cardBaseClassName}${className ? ` ${className}` : ''}`} {...props}>
      {children}
    </View>
  );
}
