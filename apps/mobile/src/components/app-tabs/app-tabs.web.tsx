import type { Href } from 'expo-router';
import { Tabs, TabList, TabTrigger, TabSlot, TabTriggerSlotProps, TabListProps } from 'expo-router/ui';
import { Pressable, Text, View } from 'react-native';

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

export function ProfileTabButton({ isFocused, ...props }: TabTriggerSlotProps) {
  return (
    <Pressable {...props} accessibilityLabel="Profile" className="active:opacity-70">
      <View
        className={
          isFocused
            ? 'h-10 w-10 items-center justify-center rounded-full border-2 border-theme-text bg-theme-selected dark:border-theme-text-dark dark:bg-theme-selected-dark'
            : 'h-10 w-10 items-center justify-center rounded-full border-2 border-theme-secondary bg-theme-element dark:border-theme-secondary-dark dark:bg-theme-element-dark'
        }>
        <View className="h-5 w-5 rounded-full bg-theme-secondary opacity-45 dark:bg-theme-secondary-dark" />
      </View>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  return (
    <View
      {...props}
      className="absolute bottom-0 w-full flex-row items-center justify-center p-4">
      <View className="w-full max-w-content flex-row items-center justify-center gap-2 rounded-[32px] bg-theme-element px-8 py-2 dark:bg-theme-element-dark">
        {props.children}
      </View>
    </View>
  );
}
