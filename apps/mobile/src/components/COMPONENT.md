# UI Component Guidelines

Use this guide when creating or refactoring components in `apps/mobile/src/components`.

## Folder Boundaries

- Put reusable UI primitives in `components/ui`.
- Put view-specific components in `components/views/<view-name>`.
- Core UI components must not import view components.
- View components may import core UI components.
- Keep route files in `src/app` focused on data loading, page layout, and composing view components.

Examples:

```text
components/ui/card/
components/ui/avatar/
components/views/profile/
```

## Component Shape

Prefer the same split used by `ui/text` and `ui/card`:

- `name.component.tsx`: render function and minimal composition logic.
- `name.styles.ts`: reusable class strings, variant maps, or style constants.
- `name.types.ts`: exported prop and variant types.

Example:

```text
components/ui/card/
  card.component.tsx
  card.styles.ts
  card.types.ts
```

Add an `index.ts` only when the component folder needs a public barrel export or has platform-specific files that benefit from a single import path.

## Styling

- Keep reusable container or variant styles in `*.styles.ts`.
- Keep screen-specific layout in the screen file.
- Use NativeWind `className` for React Native styling.
- Let callers pass `className` when the component is a wrapper or layout primitive.
- Put default classes first and caller classes last so local overrides work.
- Do not use arbitrary hardcoded utility values like `p-[28px]`, `rounded-[24px]`, or `text-[30px]`.
- Prefer theme tokens and standard Tailwind spacing, radius, and type scale utilities.

For wrapper components, prefer this merge pattern:

```tsx
<View className={`${baseClassName}${className ? ` ${className}` : ''}`} {...props}>
  {children}
</View>
```

## Props And Types

- Use the React Native prop type that matches the rendered primitive:
  - `ViewProps` for `View`
  - `TextProps` for `Text`
  - `PressableProps` for `Pressable`
- Extend those props instead of recreating common React Native props.
- Keep component-specific variants explicit and narrow.

Example:

```ts
import { TextProps } from 'react-native';

export type TextVariants = 'lg' | 'xl';

export type CustomTextProps = TextProps & {
  variant?: TextVariants;
};
```

## Defaults

- Shared UI components should include sensible defaults.
- Layout primitives that represent full-width sections, such as `Card`, should own `w-full`.
- Components with internal spacing should provide default padding.
- Allow targeted overrides through `className` when a valid use case exists, such as `p-0` for a flush media grid.

## What To Abstract

Abstract styles when they are repeated, semantic, and reusable across screens.

Good candidates:

- card shells
- typography variants
- buttons
- chips or badges
- repeated row/list item containers

Keep these local unless reused:

- one-off screen spacing
- page background and gradients
- data-specific layout
- single-use image grid cells

When a screen grows, move its repeated or dense sections into `components/views/<view-name>` instead of putting them beside core UI primitives.

## Platform Files

Use platform-specific files only when behavior or implementation must differ:

- `component.tsx`: default implementation
- `component.native.tsx`: native-specific implementation
- `component.web.tsx`: web-specific implementation

Do not split by platform for styling-only differences unless the shared implementation becomes hard to read.

## Quality Checklist

Before finishing a UI component change:

- Typecheck with `npm run test` from `apps/mobile`.
- Run `npm run lint` from `apps/mobile`.
- Confirm the component uses the correct React Native prop type.
- Confirm default styles are in `*.styles.ts`.
- Confirm screen files only keep screen-specific styles.
