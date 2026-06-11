import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Avatar from '@/components/ui/avatar/avatar.component';
import Card from '@/components/ui/card/card.component';
import GradientBackground from '@/components/ui/gradient-background/gradient-background.component';
import CustomText from '@/components/ui/text/text.component';
import { useAuthSession } from '@/hooks/use-auth-session.hook';
import { useGetProfile } from '@/hooks/use-get-profile.hook';
import { uploadAvatar } from '@/services/profile-api';
import type { ToyUploadFile } from '@/services/toy-upload-api';
import { preparePickedToyImage, type PreparedToyImage } from '@/services/toy-upload-image';

const getBlobFromUri = async (uri: string) => {
  const response = await fetch(uri);

  return response.blob();
};

const getUploadFileFromImage = async (image: PreparedToyImage): Promise<ToyUploadFile> => {
  if (Platform.OS === 'web') {
    if (image.file) {
      return image.file;
    }

    return getBlobFromUri(image.uri);
  }

  return {
    uri: image.uri,
    name: image.fileName,
    type: image.contentType,
  };
};

const getInitials = (name: string) => {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return initials || '?';
};

export default function SettingsScreen() {
  const { clearSession, user } = useAuthSession();
  const profileRequest = useGetProfile();
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const profile = profileRequest.profile;
  const showLoading = profileRequest.isLoading && !profile;
  const showError = profileRequest.error && !profile;

  const handleChangeAvatar = async () => {
    if (isUpdatingAvatar) {
      return;
    }

    setAvatarError(null);
    setStatusMessage('');
    setIsUpdatingAvatar(true);

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });

      if (result.canceled || !result.assets[0]) {
        return;
      }

      const preparedImage = await preparePickedToyImage(result.assets[0]);
      const file = await getUploadFileFromImage(preparedImage);

      await uploadAvatar({
        accessToken: user?.access_token,
        fileName: preparedImage.fileName,
        contentType: preparedImage.contentType,
        file,
      });

      await profileRequest.refetch();
      setStatusMessage('Avatar updated.');
    } catch (updateError) {
      const message = updateError instanceof Error ? updateError.message : 'Could not update avatar';

      setAvatarError(message);
    } finally {
      setIsUpdatingAvatar(false);
    }
  };

  const handleLogout = async () => {
    await clearSession();
    router.replace('/');
  };

  return (
    <GradientBackground>
      <SafeAreaView className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerClassName="flex-grow p-5"
          showsVerticalScrollIndicator={false}>
          {showLoading ? (
            <View className="flex-1 items-center justify-center gap-4">
              <ActivityIndicator color="white" size="large" />
              <CustomText className="font-display text-base font-bold text-white">
                Loading settings
              </CustomText>
            </View>
          ) : showError ? (
            <View className="flex-1 items-center justify-center gap-4 px-6">
              <CustomText className="text-center font-display text-xl font-bold text-white">
                Settings unavailable
              </CustomText>
              <Pressable
                accessibilityRole="button"
                className="rounded-full bg-white px-5 py-3"
                onPress={profileRequest.refetch}>
                <Text className="font-display text-sm font-bold text-ink">Try again</Text>
              </Pressable>
            </View>
          ) : profile ? (
            <View className="flex-1 justify-between gap-8 pt-8">
              <View className="gap-5">
                <View className="flex-row items-center justify-between">
                  <CustomText className="text-3xl font-black text-white">Settings</CustomText>
                  <Pressable
                    accessibilityRole="button"
                    className="rounded-full bg-white/90 px-4 py-2"
                    onPress={() => router.back()}>
                    <Text className="font-display text-sm font-bold text-ink">Done</Text>
                  </Pressable>
                </View>

                <Card className="gap-4">
                  <View className="flex-row items-center gap-4">
                    <Avatar
                      accessibilityLabel={`${profile.name} profile photo`}
                      initials={getInitials(profile.name)}
                      size="lg"
                      source={profile.avatar_url}
                    />
                    <View className="min-w-0 flex-1">
                      <CustomText
                        className="font-display text-xl font-black text-ink"
                        numberOfLines={1}>
                        {profile.name}
                      </CustomText>
                      <CustomText className="font-display text-sm font-semibold text-ink/65">
                        {profile.handle}
                      </CustomText>
                    </View>
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    className={`items-center rounded-full px-5 py-4 ${
                      isUpdatingAvatar ? 'bg-theme-selected' : 'bg-ink'
                    }`}
                    disabled={isUpdatingAvatar}
                    onPress={handleChangeAvatar}>
                    <Text className="font-display text-sm font-bold text-white">
                      {isUpdatingAvatar ? 'Changing avatar' : 'Change avatar'}
                    </Text>
                  </Pressable>

                  {statusMessage ? (
                    <Text className="font-display text-sm font-semibold text-green-700">
                      {statusMessage}
                    </Text>
                  ) : null}
                  {avatarError ? (
                    <Text className="font-display text-sm font-semibold text-red-700">
                      {avatarError}
                    </Text>
                  ) : null}
                </Card>
              </View>

              <Pressable
                accessibilityRole="button"
                className="items-center self-center pb-2"
                onPress={handleLogout}>
                <Text className="font-display text-sm font-bold text-white">Log out</Text>
                <View className="mt-1 h-px w-10 bg-white/80" />
              </Pressable>
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}
