import type { ViewProps } from 'react-native';

export type PillVariant = 'pink' | 'blue' | 'emerald' | 'amber';

export type PillProps = ViewProps & {
  label: string;
  textClassName?: string;
  variant?: PillVariant;
};
