import {Text} from 'react-native';
import { CustomTextProps } from './text.types';
import { textVariants } from './text.styles';


export default function CustomText({variant= 'xl', children, ...props}: CustomTextProps) {
  return (
    <Text className={textVariants[variant] || textVariants.xl} {...props}>
      {children}
    </Text>
  );
}
