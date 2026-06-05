import { NativeTabs } from 'expo-router/unstable-native-tabs';
import type { NativeTabsProps } from 'expo-router/unstable-native-tabs';
import { cssInterop } from 'nativewind';
import type { ComponentType } from 'react';

type StyledNativeTabsProps = NativeTabsProps & {
  className?: string;
  indicatorClassName?: string;
  labelClassName?: string;
};

const createNativeTabsInterop = cssInterop as (
  component: typeof NativeTabs,
  mapping: Record<string, unknown>
) => ComponentType<StyledNativeTabsProps>;

const StyledNativeTabs = createNativeTabsInterop(NativeTabs, {
  className: {
    target: false,
    nativeStyleToProp: {
      backgroundColor: 'backgroundColor',
    },
  },
  indicatorClassName: {
    target: false,
    nativeStyleToProp: {
      backgroundColor: 'indicatorColor',
    },
  },
  labelClassName: {
    target: false,
    nativeStyleToProp: {
      color: 'labelStyle.selected.color',
    },
  },
});

export default function AppTabs() {
  return (
    <StyledNativeTabs
      className="bg-theme-background dark:bg-theme-background-dark"
      indicatorClassName="bg-theme-element dark:bg-theme-element-dark"
      labelClassName="text-theme-text dark:text-theme-text-dark">
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/home.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label hidden>Profile</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.crop.circle" md="account_circle" />
      </NativeTabs.Trigger>
    </StyledNativeTabs>
  );
}
