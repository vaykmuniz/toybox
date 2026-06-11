import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';

import Avatar from '@/components/ui/avatar/avatar.component';
import Card from '@/components/ui/card/card.component';
import { useAuthSession } from '@/hooks/use-auth-session.hook';
import { GetProfile } from '@/hooks/use-get-profile.hook';
import { uploadAvatar } from '@/services/profile-api';
import { preparePickedToyImage } from '@/services/toy-upload-image';
import type { ToyUploadFile } from '@/services/toy-upload-api';

type ProfileHeaderCardProps = {
  className?: string;
  onProfileUpdated?: () => Promise<void>;
  profile: GetProfile;
};

type PickedAvatarImage = {
  uri: string;
  fileName: string;
  contentType: string;
  file?: File;
};

const getBlobFromUri = async (uri: string) => {
  const response = await fetch(uri);

  return response.blob();
};

const getUploadFileFromImage = async (image: PickedAvatarImage): Promise<ToyUploadFile> => {
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

export function ProfileHeaderCard({ className, onProfileUpdated, profile }: ProfileHeaderCardProps) {
  const { clearSession, user } = useAuthSession();
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);

  const handleLogout = async () => {
    await clearSession();
    router.replace('/');
  };

  const handleUpload = () => {
    router.push('/upload');
  };

  const handleAvatarPress = async () => {
    if (isUpdatingAvatar) {
      return;
    }

    setAvatarError(null);
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

      await onProfileUpdated?.();
    } catch (updateError) {
      const message = updateError instanceof Error ? updateError.message : 'Could not update avatar';

      setAvatarError(message);
    } finally {
      setIsUpdatingAvatar(false);
    }
  };

  return (
    <Card className={`gap-3 ${className ? ` ${className}` : ''}`}>
      <View className="flex-row flex-wrap gap-4 items-center space-x-4">
        <Pressable
          accessibilityLabel={`Edit ${profile.name} profile photo`}
          accessibilityRole="button"
          disabled={isUpdatingAvatar}
          onPress={handleAvatarPress}>
          <Avatar
            accessibilityLabel={`${profile.name} profile photo`}
            initials={getInitials(profile.name)}
            size="md"
            source={profile.avatar_url}
          />
        </Pressable>

        <View>
          <Text className="font-display text-3xl font-bold leading-9 text-ink">
            {profile.name}
          </Text>
          <Text className="font-display text-base font-semibold text-ink/70">
            {profile.handle}
          </Text>
        </View>
        <View className="flex-col justify-start items-start gap-3">
          <Pressable
            accessibilityRole="button"
            className="rounded-full bg-white px-4 py-2 w-fit"
            onPress={handleUpload}>
            <Text className="font-display text-sm font-bold text-ink">Upload</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            className="rounded-full bg-white/90 px-4 py-2"
            onPress={handleLogout}>
            <Text className="font-display text-sm font-bold text-ink">Log out</Text>
          </Pressable>
        </View>
      </View>
      {avatarError ? (
        <Text className="font-display text-sm font-semibold text-red-700">{avatarError}</Text>
      ) : null}
    </Card>
  );
}
