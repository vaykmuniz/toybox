import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';

import { customImageBaseClassName } from './custom-image.styles';
import type { CustomImageProps } from './custom-image.types';

export default function CustomImage({
  className,
  contentFit = 'cover',
  fill = true,
  style,
  ...props
}: CustomImageProps) {
  return (
    <Image
      className={`${customImageBaseClassName}${className ? ` ${className}` : ''}`}
      contentFit={contentFit}
      style={fill ? [StyleSheet.absoluteFill, style] : style}
      {...props}
    />
  );
}
