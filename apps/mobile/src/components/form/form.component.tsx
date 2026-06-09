import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { fonts } from '@/constants/fonts';

import { formInputClasses } from './form.styles';
import type { FormInputProps, FormModeButtonProps, PasswordInputProps } from './form.types';

export function FormModeButton({ active, label, ...props }: FormModeButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      style={[styles.modeButton, active ? styles.modeButtonActive : null]}
      {...props}>
      <Text style={[styles.modeButtonText, active ? styles.modeButtonTextActive : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function FormInput({ error, label, ...inputProps }: FormInputProps) {
  return (
    <View className={formInputClasses.wrapper}>
      <Text className={formInputClasses.label}>{label}</Text>
      <TextInput className={formInputClasses.input} placeholderTextColor="#60646C" {...inputProps} />
      {error ? <Text className={formInputClasses.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  modeButton: {
    borderRadius: 999,
    flex: 1,
    paddingVertical: 12,
  },
  modeButtonActive: {
    backgroundColor: '#ffffff',
  },
  modeButtonText: {
    color: '#60646C',
    fontFamily: fonts.semibold,
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
  },
  modeButtonTextActive: {
    color: '#111111',
  },
});

export function PasswordInput({
  error,
  label,
  onToggleVisibility,
  toggleLabel,
  ...inputProps
}: PasswordInputProps) {
  return (
    <View className={formInputClasses.wrapper}>
      <Text className={formInputClasses.label}>{label}</Text>
      <View className={formInputClasses.passwordContainer}>
        <TextInput
          autoComplete="password"
          className={formInputClasses.passwordInput}
          placeholderTextColor="#60646C"
          {...inputProps}
        />
        <Pressable
          accessibilityRole="button"
          className={formInputClasses.toggle}
          onPress={onToggleVisibility}>
          <Text className={formInputClasses.toggleText}>{toggleLabel}</Text>
        </Pressable>
      </View>
      {error ? <Text className={formInputClasses.error}>{error}</Text> : null}
    </View>
  );
}
