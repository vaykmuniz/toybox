import { ImageProps } from 'expo-image';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg';

export type AvatarProps = Omit<ImageProps, 'source'> & {
  initials?: string;
  size?: AvatarSize;
  source?: ImageProps['source'] | null;
};
