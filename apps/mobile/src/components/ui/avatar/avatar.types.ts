import { ImageProps } from 'expo-image';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg';

export type AvatarProps = ImageProps & {
  size?: AvatarSize;
};
