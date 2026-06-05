import { ViewProps } from 'react-native';

export type TextVariants = 'lg' | 'xl'

export type CustomTextProps = ViewProps & {
    variant?: TextVariants
}