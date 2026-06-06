import { View } from 'react-native';

import CustomImage from '@/components/ui/custom-image/custom-image.component';
import {
  avatarBaseClassName,
  avatarImageClassName,
  avatarSizeClassNames,
  avatarSizeStyles,
} from './avatar.styles';
import { AvatarProps } from './avatar.types';

export default function Avatar({
  className,
  contentFit = 'cover',
  size = 'sm',
  style,
  ...props
}: AvatarProps) {
  return (
    <View
      className={`${avatarBaseClassName} ${avatarSizeClassNames[size]} shrink-0${className ? ` ${className}` : ''}`}
      style={avatarSizeStyles[size]}>
      <CustomImage
        className={avatarImageClassName}
        contentFit={contentFit}
        style={style}
        {...props}
      />
    </View>
  );
}
