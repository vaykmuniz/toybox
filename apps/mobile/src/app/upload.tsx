import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import GradientBackground from '@/components/ui/gradient-background/gradient-background.component';
import { BottomTabInset } from '@/constants/layout';
import { useGetProfile } from '@/hooks/use-get-profile.hook';
import { preparePickedToyImage } from '@/services/toy-upload-image';
import { uploadToy, type ToyUploadFile } from '@/services/toy-upload-api';

type PickedToyImage = {
  uri: string;
  fileName: string;
  contentType: string;
  file?: File;
};

const getBlobFromUri = async (uri: string) => {
  const response = await fetch(uri);

  return response.blob();
};

const getUploadFileFromImage = async (image: PickedToyImage): Promise<ToyUploadFile> => {
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

export default function UploadScreen() {
  const profileRequest = useGetProfile();
  const [name, setName] = useState('');
  const [image, setImage] = useState<PickedToyImage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPicking, setIsPicking] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const canSubmit = name.trim().length > 0 && image && !isUploading;

  const pickImage = async () => {
    setError(null);
    setIsPicking(true);

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

      const asset = result.assets[0];
      const preparedImage = await preparePickedToyImage(asset);

      setImage(preparedImage);
    } catch (pickError) {
      const message = pickError instanceof Error ? pickError.message : 'Could not pick image';

      setError(message);
    } finally {
      setIsPicking(false);
    }
  };

  const submit = async () => {
    if (!image || !canSubmit) {
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      const file = await getUploadFileFromImage(image);

      await uploadToy({
        name: name.trim(),
        fileName: image.fileName,
        contentType: image.contentType,
        file,
      });

      setName('');
      setImage(null);
      await profileRequest.refetch();
      router.replace('/profile');
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : 'Could not upload toy';

      setError(message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <GradientBackground>
      <SafeAreaView className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerClassName="flex-grow px-5 pt-4"
          contentContainerStyle={{ paddingBottom: BottomTabInset + 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {profileRequest.isLoading && !profileRequest.profile ? (
            <View className="flex-1 items-center justify-center gap-4">
              <ActivityIndicator color="white" size="large" />
              <Text className="font-display text-base font-bold text-white">Loading profile</Text>
            </View>
          ) : !profileRequest.profile ? (
            <View className="flex-1 items-center justify-center gap-4 px-6">
              <Text className="text-center font-display text-xl font-bold text-white">
                Profile required
              </Text>
              <Pressable
                accessibilityRole="button"
                className="rounded-full bg-white px-5 py-3"
                onPress={profileRequest.refetch}>
                <Text className="font-display text-sm font-bold text-ink">Try again</Text>
              </Pressable>
            </View>
          ) : (
            <View className="gap-5">
              <View>
                <Text className="font-display text-3xl font-bold text-white">Upload toy</Text>
              </View>

              <View className="gap-4 rounded-lg bg-white p-4">
                <View className="gap-2">
                  <Text className="font-display text-sm font-bold text-ink">Name</Text>
                  <TextInput
                    accessibilityLabel="Toy name"
                    autoCapitalize="words"
                    className="rounded-lg border border-ink/15 px-4 py-3 font-display text-base text-ink"
                    editable={!isUploading}
                    maxLength={120}
                    onChangeText={setName}
                    placeholder="Toy name"
                    placeholderTextColor="rgba(29, 25, 38, 0.45)"
                    value={name}
                  />
                </View>

                <View className="gap-3">
                  <Text className="font-display text-sm font-bold text-ink">Upload</Text>
                  <Pressable
                    accessibilityRole="button"
                    className="items-center justify-center rounded-lg border border-dashed border-ink/25 bg-ink/5 p-4 active:opacity-70"
                    disabled={isPicking || isUploading}
                    onPress={pickImage}>
                    {image ? (
                      <View className="w-full gap-3">
                        <View className="rounded-lg bg-ink/10" style={styles.previewFrame}>
                          <Image
                            accessibilityLabel="Selected toy image"
                            contentFit="cover"
                            source={{ uri: image.uri }}
                            style={styles.previewImage}
                          />
                        </View>
                        <Text className="text-center font-display text-sm font-bold text-ink">
                          Change image
                        </Text>
                      </View>
                    ) : (
                      <View className="items-center gap-2 py-8">
                        <Text className="font-display text-4xl font-bold text-ink">+</Text>
                        <Text className="font-display text-sm font-bold text-ink">
                          Choose image
                        </Text>
                      </View>
                    )}
                  </Pressable>
                </View>

                {error ? (
                  <Text className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                    {error}
                  </Text>
                ) : null}

                <Pressable
                  accessibilityRole="button"
                  className={
                    canSubmit
                      ? 'items-center rounded-full bg-ink px-5 py-3 active:opacity-70'
                      : 'items-center rounded-full bg-ink/30 px-5 py-3'
                  }
                  disabled={!canSubmit}
                  onPress={submit}>
                  {isUploading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="font-display text-sm font-bold text-white">Upload toy</Text>
                  )}
                </Pressable>
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  previewFrame: {
    aspectRatio: 1,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  previewImage: {
    ...StyleSheet.absoluteFill,
  },
});
