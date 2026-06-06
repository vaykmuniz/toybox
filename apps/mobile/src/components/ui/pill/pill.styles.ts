import type { PillVariant } from './pill.types';

export const pillBaseClassName = 'rounded-full border px-2.5 py-1';

export const pillTextBaseClassName = 'font-display text-xs font-bold uppercase leading-4 pt-1 px-4';

export const pillVariantClassNames: Record<PillVariant, string> = {
  amber: 'border-amber-400/70 bg-amber-200/70',
  blue: 'border-toybox-blue/70 bg-toybox-blue/25',
  emerald: 'border-emerald-400/70 bg-emerald-200/70',
  pink: 'border-toybox-pink/70 bg-toybox-pink/25',
};

export const pillTextVariantClassNames: Record<PillVariant, string> = {
  amber: 'text-amber-950',
  blue: 'text-ink',
  emerald: 'text-emerald-950',
  pink: 'text-ink',
};
