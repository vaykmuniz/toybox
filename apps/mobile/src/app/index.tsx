import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import type { Href } from 'expo-router';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  FormInput,
  FormModeButton,
  PasswordInput,
} from '@/components/form/form.component';
import GradientBackground from '@/components/ui/gradient-background/gradient-background.component';
import CustomText from '@/components/ui/text/text.component';
import { login, register } from '@/services/auth-api';

type AuthMode = 'login' | 'register';

type LoginForm = {
  username: string;
  password: string;
};

type RegisterForm = {
  email: string;
  password: string;
  passwordConfirm: string;
  name: string;
  username: string;
};

type LoginErrors = Record<keyof LoginForm, string>;
type RegisterErrors = Record<keyof RegisterForm, string>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const initialLoginForm: LoginForm = {
  username: '',
  password: '',
};

const initialRegisterForm: RegisterForm = {
  email: '',
  password: '',
  passwordConfirm: '',
  name: '',
  username: '',
};

export default function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [loginForm, setLoginForm] = useState<LoginForm>(initialLoginForm);
  const [registerForm, setRegisterForm] = useState<RegisterForm>(initialRegisterForm);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusKind, setStatusKind] = useState<'error' | 'success'>('error');

  const isLogin = mode === 'login';
  const formTitle = isLogin ? 'Welcome back' : 'Create account';
  const submitLabel = isSubmitting ? 'Please wait...' : isLogin ? 'Log in' : 'Register';

  const loginErrors = useMemo<LoginErrors>(
    () => ({
      username: loginForm.username.trim() ? '' : 'Username is required.',
      password: loginForm.password ? '' : 'Password is required.',
    }),
    [loginForm]
  );

  const registerErrors = useMemo<RegisterErrors>(
    () => ({
      email: !registerForm.email.trim()
        ? 'Email is required.'
        : emailPattern.test(registerForm.email.trim())
          ? ''
          : 'Enter a valid email.',
      name: registerForm.name.trim() ? '' : 'Name is required.',
      username: registerForm.username.trim() ? '' : 'Username is required.',
      password: registerForm.password ? '' : 'Password is required.',
      passwordConfirm: !registerForm.passwordConfirm
        ? 'Password confirmation is required.'
        : registerForm.passwordConfirm === registerForm.password
          ? ''
          : 'Passwords must match.',
    }),
    [registerForm]
  );

  const activeErrors = isLogin ? loginErrors : registerErrors;
  const isFormValid = Object.values(activeErrors).every((error) => !error);

  function selectMode(nextMode: AuthMode) {
    if (nextMode === mode) return;

    Keyboard.dismiss();
    setMode(nextMode);
    setSubmitted(false);
    setStatusMessage('');
    setShowPassword(false);
    setShowPasswordConfirm(false);
  }

  async function handleSubmit() {
    setSubmitted(true);
    setStatusMessage('');

    if (!isFormValid || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (isLogin) {
        await login({
          payload: {
            password: loginForm.password,
            username: loginForm.username.trim(),
          },
        });
        router.replace('/home' as Href);
        return;
      }

      await register({
        payload: {
          email: registerForm.email.trim(),
          name: registerForm.name.trim(),
          password: registerForm.password,
          username: registerForm.username.trim(),
        },
      });
      setRegisterForm(initialRegisterForm);
      setMode('login');
      setSubmitted(false);
      setShowPassword(false);
      setShowPasswordConfirm(false);
      setStatusKind('success');
      setStatusMessage('Account created. Check your email to verify it before logging in.');
    } catch (error) {
      setStatusKind('error');
      setStatusMessage(error instanceof Error ? error.message : 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <GradientBackground>
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.select({ ios: 'padding', android: undefined })}
          className="flex-1">
          <ScrollView
            className="flex-1"
            contentContainerClassName="flex-grow px-5 pt-8"
            contentContainerStyle={{ paddingBottom: 32 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <View className="min-h-full justify-center gap-6">
              <View className="gap-2">
                <CustomText variant="authBrand">Toybox</CustomText>
                <CustomText variant="authIntro">
                  Sign in to keep your toys, matches, and profile close at hand.
                </CustomText>
              </View>

              <View className="gap-5 rounded-[28px] bg-white/95 p-5 shadow-lg">
                <View className="flex-row rounded-full bg-theme-element p-1">
                  <FormModeButton
                    active={isLogin}
                    label="Login"
                    onPress={() => selectMode('login')}
                  />
                  <FormModeButton
                    active={!isLogin}
                    label="Register"
                    onPress={() => selectMode('register')}
                  />
                </View>

                <View className="gap-1">
                  <CustomText variant="authFormTitle">{formTitle}</CustomText>
                  <CustomText variant="authFormHelp">
                    {isLogin
                      ? 'Use your username and password to continue.'
                      : 'Fill in your details to start your account.'}
                  </CustomText>
                </View>

                {statusMessage ? (
                  <View
                    className={
                      statusKind === 'success'
                        ? 'rounded-2xl bg-green-50 px-4 py-3'
                        : 'rounded-2xl bg-red-50 px-4 py-3'
                    }>
                    <CustomText
                      className={
                        statusKind === 'success'
                          ? 'font-display text-sm font-bold text-green-700'
                          : 'font-display text-sm font-bold text-red-700'
                      }>
                      {statusMessage}
                    </CustomText>
                  </View>
                ) : null}

                <View className="gap-4">
                  <View
                    className="gap-4"
                    importantForAccessibility={isLogin ? 'auto' : 'no-hide-descendants'}
                    pointerEvents={isLogin ? 'auto' : 'none'}
                    style={{ display: isLogin ? 'flex' : 'none' }}>
                    <FormInput
                      autoCapitalize="none"
                      autoComplete="username"
                      error={submitted && isLogin ? loginErrors.username : ''}
                      label="Username"
                      onChangeText={(username) => setLoginForm((form) => ({ ...form, username }))}
                      placeholder="your_username"
                      value={loginForm.username}
                    />
                    <PasswordInput
                      error={submitted && isLogin ? loginErrors.password : ''}
                      label="Password"
                      onChangeText={(password) => setLoginForm((form) => ({ ...form, password }))}
                      onToggleVisibility={() => setShowPassword((visible) => !visible)}
                      placeholder="Enter password"
                      secureTextEntry={!showPassword}
                      toggleLabel={showPassword ? 'Hide' : 'Show'}
                      value={loginForm.password}
                    />
                  </View>

                  <View
                    className="gap-4"
                    importantForAccessibility={!isLogin ? 'auto' : 'no-hide-descendants'}
                    pointerEvents={!isLogin ? 'auto' : 'none'}
                    style={{ display: isLogin ? 'none' : 'flex' }}>
                    <FormInput
                      autoCapitalize="none"
                      autoComplete="email"
                      error={submitted && !isLogin ? registerErrors.email : ''}
                      inputMode="email"
                      label="Email"
                      onChangeText={(email) => setRegisterForm((form) => ({ ...form, email }))}
                      placeholder="you@example.com"
                      value={registerForm.email}
                    />
                    <FormInput
                      autoComplete="name"
                      error={submitted && !isLogin ? registerErrors.name : ''}
                      label="Name"
                      onChangeText={(name) => setRegisterForm((form) => ({ ...form, name }))}
                      placeholder="Your name"
                      value={registerForm.name}
                    />
                    <FormInput
                      autoCapitalize="none"
                      autoComplete="username"
                      error={submitted && !isLogin ? registerErrors.username : ''}
                      label="Username"
                      onChangeText={(username) => setRegisterForm((form) => ({ ...form, username }))}
                      placeholder="your_username"
                      value={registerForm.username}
                    />
                    <PasswordInput
                      error={submitted && !isLogin ? registerErrors.password : ''}
                      label="Password"
                      onChangeText={(password) => setRegisterForm((form) => ({ ...form, password }))}
                      onToggleVisibility={() => setShowPassword((visible) => !visible)}
                      placeholder="Create password"
                      secureTextEntry={!showPassword}
                      toggleLabel={showPassword ? 'Hide' : 'Show'}
                      value={registerForm.password}
                    />
                    <PasswordInput
                      error={submitted && !isLogin ? registerErrors.passwordConfirm : ''}
                      label="Confirm password"
                      onChangeText={(passwordConfirm) =>
                        setRegisterForm((form) => ({ ...form, passwordConfirm }))
                      }
                      onToggleVisibility={() => setShowPasswordConfirm((visible) => !visible)}
                      placeholder="Repeat password"
                      secureTextEntry={!showPasswordConfirm}
                      toggleLabel={showPasswordConfirm ? 'Hide' : 'Show'}
                      value={registerForm.passwordConfirm}
                    />
                  </View>
                </View>

                <Pressable
                  accessibilityRole="button"
                  className={
                    isFormValid && !isSubmitting
                      ? 'items-center rounded-full bg-ink px-5 py-4'
                      : 'items-center rounded-full bg-theme-selected px-5 py-4'
                  }
                  disabled={!isFormValid || isSubmitting}
                  onPress={handleSubmit}>
                  <CustomText
                    variant={isFormValid && !isSubmitting ? 'authSubmit' : 'authSubmitDisabled'}>
                    {submitLabel}
                  </CustomText>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientBackground>
  );
}
