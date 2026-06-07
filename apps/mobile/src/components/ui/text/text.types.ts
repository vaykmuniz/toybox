import { TextProps } from 'react-native';

export type TextVariants =
  | 'lg'
  | 'xl'
  | 'authBrand'
  | 'authIntro'
  | 'authFormTitle'
  | 'authFormHelp'
  | 'authSubmit'
  | 'authSubmitDisabled';

export type CustomTextProps = TextProps & {
  variant?: TextVariants;
};
