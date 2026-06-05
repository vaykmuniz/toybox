import type { Href } from 'expo-router';
import { Tabs, TabList, TabTrigger, TabSlot, TabTriggerSlotProps, TabListProps } from 'expo-router/ui';
import { Pressable, Text, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme/use-theme';

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot className="h-full" />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="home" href="/" asChild>
            <TabButton>Home</TabButton>
          </TabTrigger>
          <TabTrigger name="profile" href={'/profile' as Href} asChild>
            <ProfileTabButton />
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  return (
    <Pressable {...props} className="active:opacity-70">
      <View
        className={
          isFocused
            ? 'rounded-2xl bg-[#E0E1E6] px-4 py-1 dark:bg-[#2E3135]'
            : 'rounded-2xl bg-[#F0F0F3] px-4 py-1 dark:bg-[#212225]'
        }>
        <Text
          className={
            isFocused
              ? 'text-sm font-medium leading-5 text-black dark:text-white'
              : 'text-sm font-medium leading-5 text-[#60646C] dark:text-[#B0B4BA]'
          }>
          {children}
        </Text>
      </View>
    </Pressable>
  );
}

export function ProfileTabButton({ isFocused, ...props }: TabTriggerSlotProps) {
  const theme = useTheme();

  return (
    <Pressable {...props} accessibilityLabel="Profile" className="active:opacity-70">
      <View
        className="h-10 w-10 items-center justify-center rounded-full border-2"
        style={[
          {
            backgroundColor: isFocused ? theme.backgroundSelected : theme.backgroundElement,
            borderColor: isFocused ? theme.text : theme.textSecondary,
          },
        ]}>
        <View className="h-5 w-5 rounded-full opacity-45" style={{ backgroundColor: theme.textSecondary }} />
      </View>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  return (
    <View
      {...props}
      className="absolute bottom-0 w-full flex-row items-center justify-center p-4">
      <View className="w-full max-w-content flex-row items-center justify-center gap-2 rounded-[32px] bg-[#F0F0F3] px-8 py-2 dark:bg-[#212225]">
        {props.children}
      </View>
    </View>
  );
}
