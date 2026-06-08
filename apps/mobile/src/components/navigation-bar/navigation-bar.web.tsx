import type { Href } from 'expo-router';
import { Tabs, TabList, TabTrigger, TabSlot, TabTriggerSlotProps, TabListProps } from 'expo-router/ui';
import { SymbolView } from 'expo-symbols';
import { Pressable, Text, View } from 'react-native';

import Avatar from '@/components/ui/avatar/avatar.component';
import { useGetProfile } from '@/hooks/use-get-profile.hook';

export default function NavigationBar() {
  return (
    <Tabs>
      <TabSlot className="h-full" />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="home" href="/" asChild>
            <TabButton>Home</TabButton>
          </TabTrigger>
          <TabTrigger name="odds" href={'/odds' as Href} asChild>
            <TabButton>Odds</TabButton>
          </TabTrigger>
          <TabTrigger name="upload" href={'/upload' as Href} asChild>
            <PlusTabButton />
          </TabTrigger>
          <TabTrigger name="profile" href={'/profile' as Href} asChild>
            <ProfileTabButton />
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

type TabButtonProps = TabTriggerSlotProps & {
  className?: string;
};

export function TabButton({ children, className, isFocused, ...props }: TabButtonProps) {
  return (
    <Pressable {...props} className={`active:opacity-70${className ? ` ${className}` : ''}`}>
      <View
        className={
          isFocused
            ? 'rounded-2xl bg-theme-selected px-4 py-1 dark:bg-theme-selected-dark'
            : 'rounded-2xl bg-theme-element px-4 py-1 dark:bg-theme-element-dark'
        }>
        <Text
          className={
            isFocused
              ? 'text-sm font-medium leading-5 text-theme-text dark:text-theme-text-dark'
              : 'text-sm font-medium leading-5 text-theme-secondary dark:text-theme-secondary-dark'
          }>
          {children}
        </Text>
      </View>
    </Pressable>
  );
}

export function PlusTabButton({ isFocused, ...props }: TabTriggerSlotProps) {
  return (
    <Pressable {...props} accessibilityLabel="Upload toy" className="active:opacity-70">
      <View
        className={
          isFocused
            ? 'h-10 w-10 items-center justify-center rounded-full bg-theme-selected dark:bg-theme-selected-dark'
            : 'h-10 w-10 items-center justify-center rounded-full bg-theme-element dark:bg-theme-element-dark'
        }>
        <SymbolView
          fallback={
            <Text className="font-display text-2xl font-bold text-theme-text dark:text-theme-text-dark">
              +
            </Text>
          }
          name="plus"
          size={20}
          tintColor={isFocused ? '#1d1926' : 'rgba(29, 25, 38, 0.65)'}
        />
      </View>
    </Pressable>
  );
}

export function ProfileTabButton({ isFocused, ...props }: TabTriggerSlotProps) {
  const { profile } = useGetProfile();

  return (
    <Pressable {...props} accessibilityLabel="Profile" className="active:opacity-70">
      <View
        className={
          isFocused
            ? 'h-10 w-10 items-center justify-center rounded-full border-2 border-theme-text bg-theme-selected dark:border-theme-text-dark dark:bg-theme-selected-dark'
            : 'h-10 w-10 items-center justify-center rounded-full border-2 border-theme-secondary bg-theme-element dark:border-theme-secondary-dark dark:bg-theme-element-dark'
        }>
        {profile ? (
          <Avatar
            accessibilityLabel={`${profile.name} profile photo`}
            className="border-0"
            size="xs"
            source={profile.avatar_url}
          />
        ) : null}
      </View>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  return (
    <View
      {...props}
      className="absolute bottom-0 w-full flex-row items-center justify-center p-4">
      <View className="w-full max-w-content flex-row items-center justify-center space-x-2 rounded-3xl bg-theme-element px-8 py-2 dark:bg-theme-element-dark">
        {props.children}
      </View>
    </View>
  );
}
