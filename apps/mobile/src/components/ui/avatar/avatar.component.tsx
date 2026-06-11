import { Text, View } from 'react-native';

import CustomImage from '@/components/ui/custom-image/custom-image.component';
import {
  avatarBaseClassName,
  avatarImageClassName,
  avatarInitialsClassName,
  avatarInitialsSizeClassNames,
  avatarSizeClassNames,
  avatarSizeStyles,
} from './avatar.styles';
import { AvatarProps } from './avatar.types';

export default function Avatar({
  className,
  contentFit = 'cover',
  initials,
  size = 'sm',
  source,
  style,
  ...props
}: AvatarProps) {
  return (
    <View
      className={`${avatarBaseClassName} ${avatarSizeClassNames[size]} shrink-0 items-center justify-center${className ? ` ${className}` : ''}`}
      style={avatarSizeStyles[size]}>
      {source ? (
        <CustomImage
          className={avatarImageClassName}
          contentFit={contentFit}
          source={source}
          style={style}
          {...props}
        />
      ) : (
        <Text className={`${avatarInitialsClassName} ${avatarInitialsSizeClassNames[size]}`}>
          {initials}
        </Text>
      )}
    </View>
  );
}
