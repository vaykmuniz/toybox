import type { PressableProps, TextInputProps } from 'react-native';

export type FormModeButtonProps = PressableProps & {
  active: boolean;
  label: string;
};

export type FormInputProps = TextInputProps & {
  error?: string;
  label: string;
};

export type PasswordInputProps = FormInputProps & {
  onToggleVisibility: () => void;
  toggleLabel: string;
};
