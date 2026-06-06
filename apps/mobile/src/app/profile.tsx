import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, View } from 'react-native';

import { ProfileHeaderCard, ProfileToyGrid } from '@/components/views/profile';
import { useGetProfile } from '@/hooks/use-get-profile.hook';

const Pink = '#ff74b8';
const Blue = '#5ba7ff';

export default function ProfileScreen() {
  const profile = useGetProfile();

  return (
    <View className="flex-1 bg-toybox-blue">
      <LinearGradient
        colors={[Pink, Blue]}
        end={{ x: 0.8, y: 1 }}
        start={{ x: 0.8, y: 0 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}
      />
      <View className="flex-1" style={{ zIndex: 1 }}>
        <ScrollView
          className="flex-1"
          contentContainerClassName="p-5"
          showsVerticalScrollIndicator={false}>
          <View className="gap-5">
            <ProfileHeaderCard profile={profile} />
            <ProfileToyGrid toys={profile.toys} />
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
