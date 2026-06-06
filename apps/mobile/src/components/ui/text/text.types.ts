import { TextProps } from 'react-native';

export type TextVariants = 'lg' | 'xl'

export type CustomTextProps = TextProps & {
    variant?: TextVariants
}
