import { Text, View } from 'react-native';

import {
  pillBaseClassName,
  pillTextBaseClassName,
  pillTextVariantClassNames,
  pillVariantClassNames,
} from './pill.styles';
import type { PillProps } from './pill.types';

export default function Pill({
  className,
  label,
  textClassName,
  variant = 'pink',
  ...props
}: PillProps) {
  return (
    <View
      className={`${pillBaseClassName} ${pillVariantClassNames[variant]}${className ? ` ${className}` : ''}`}
      {...props}>
      <Text
        className={`${pillTextBaseClassName} ${pillTextVariantClassNames[variant]}${textClassName ? ` ${textClassName}` : ''}`}>
        {label}
      </Text>
    </View>
  );
}
