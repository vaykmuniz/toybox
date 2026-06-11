import type { AvatarSize } from './avatar.types';

export const avatarBaseClassName = 'overflow-hidden rounded-full border border-white/40 bg-white/40';

export const avatarImageClassName = 'h-full w-full rounded-full';

export const avatarInitialsClassName = 'font-display font-bold text-ink/70';

export const avatarInitialsSizeClassNames: Record<AvatarSize, string> = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-xl',
  lg: 'text-3xl',
};

export const avatarSizeClassNames: Record<AvatarSize, string> = {
  xs: 'h-8 w-8',
  sm: 'h-10 w-10',
  md: 'h-16 w-16',
  lg: 'h-24 w-24',
};

export const avatarSizeStyles: Record<AvatarSize, { height: number; width: number }> = {
  xs: { height: 32, width: 32 },
  sm: { height: 40, width: 40 },
  md: { height: 64, width: 64 },
  lg: { height: 96, width: 96 },
};
