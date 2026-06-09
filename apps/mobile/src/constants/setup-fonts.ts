import { Text, TextInput } from 'react-native';

import { fonts } from './fonts';

let fontsConfigured = false;

export function configureDefaultFonts() {
  if (fontsConfigured) {
    return;
  }

  const textComponent = Text as typeof Text & { defaultProps?: { style?: unknown } };
  const textInputComponent = TextInput as typeof TextInput & { defaultProps?: { style?: unknown } };

  const textDefaultStyle = textComponent.defaultProps?.style;
  const textInputDefaultStyle = textInputComponent.defaultProps?.style;

  textComponent.defaultProps = {
    ...textComponent.defaultProps,
    style: textDefaultStyle ? [textDefaultStyle, { fontFamily: fonts.regular }] : { fontFamily: fonts.regular },
  };

  textInputComponent.defaultProps = {
    ...textInputComponent.defaultProps,
    style: textInputDefaultStyle
      ? [textInputDefaultStyle, { fontFamily: fonts.regular }]
      : { fontFamily: fonts.regular },
  };

  fontsConfigured = true;
}
