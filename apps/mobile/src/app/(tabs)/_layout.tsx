import { Tabs } from 'expo-router';
import { Image, StyleSheet, useColorScheme, View } from 'react-native';

import Avatar from '@/components/ui/avatar/avatar.component';
import { useGetProfile } from '@/hooks/use-get-profile.hook';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { profile } = useGetProfile();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? darkColors : lightColors;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.secondary,
        tabBarLabelStyle: styles.label,
        tabBarStyle: {
          backgroundColor: colors.element,
          borderTopColor: colors.selected,
        },
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Image
              source={require('@/assets/images/tabIcons/home.png')}
              style={[styles.icon, { height: size, tintColor: color, width: size }]}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="odds"
        options={{
          title: 'Odds',
          tabBarIcon: ({ color, size }) => (
            <Image
              source={require('@/assets/images/tabIcons/explore.png')}
              style={[styles.icon, { height: size, tintColor: color, width: size }]}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused, size }) => (
            <View
              style={[
                styles.profileIcon,
                {
                  backgroundColor: focused ? colors.selected : colors.element,
                  borderColor: focused ? colors.text : colors.secondary,
                  height: size + 8,
                  width: size + 8,
                },
              ]}>
              {profile ? (
                <Avatar
                  accessibilityLabel={`${profile.name} profile photo`}
                  className="border-0"
                  size="xs"
                  source={profile.avatar_url}
                />
              ) : null}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const lightColors = {
  element: '#F0F0F3',
  secondary: '#60646C',
  selected: '#E0E1E6',
  text: '#000000',
};

const darkColors = {
  element: '#212225',
  secondary: '#B0B4BA',
  selected: '#2E3135',
  text: '#ffffff',
};

const styles = StyleSheet.create({
  icon: {
    resizeMode: 'contain',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
  profileIcon: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 2,
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
