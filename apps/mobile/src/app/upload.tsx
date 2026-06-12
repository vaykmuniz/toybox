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
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import GradientBackground from '@/components/ui/gradient-background/gradient-background.component';
import { BottomTabInset } from '@/constants/layout';
import { useAuthSession } from '@/hooks/use-auth-session.hook';
import { useGetProfile } from '@/hooks/use-get-profile.hook';
import { preparePickedToyImage } from '@/services/toy-upload-image';
import { createToy, uploadToy, type ToyUploadFile } from '@/services/toy-upload-api';

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

const normalizeCostInput = (value: string) => {
  const normalized = value.replace(',', '.').replace(/[^\d.]/g, '');
  const [whole = '', ...rest] = normalized.split('.');
  const cents = rest.join('').slice(0, 2);

  return rest.length > 0 ? `${whole}.${cents}` : whole;
};

const parseCostToMinorUnits = (value: string) => {
  const cleanValue = value.trim();

  if (!/^\d+(\.\d{1,2})?$/.test(cleanValue)) {
    return Number.NaN;
  }

  const [whole, cents = ''] = cleanValue.split('.');

  return Number.parseInt(whole, 10) * 100 + Number.parseInt(cents.padEnd(2, '0'), 10);
};

export default function UploadScreen() {
  const { user } = useAuthSession();
  const profileRequest = useGetProfile();
  const [description, setDescription] = useState('');
  const [tries, setTries] = useState('');
  const [costPerTry, setCostPerTry] = useState('');
  const [caught, setCaught] = useState(true);
  const [image, setImage] = useState<PickedToyImage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPicking, setIsPicking] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const parsedTries = Number.parseInt(tries, 10);
  const parsedCostPerTry = parseCostToMinorUnits(costPerTry);
  const hasValidTries = Number.isInteger(parsedTries) && parsedTries >= 1;
  const hasValidCost = Number.isInteger(parsedCostPerTry) && parsedCostPerTry >= 0;
  const hasRequiredImage = caught ? image !== null : true;
  const canSubmit =
    description.trim().length > 0 &&
    hasValidTries &&
    hasValidCost &&
    hasRequiredImage &&
    !isUploading;

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
    if (!canSubmit) {
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      if (caught) {
        if (!image) {
          return;
        }

        const file = await getUploadFileFromImage(image);

        await uploadToy({
          description: description.trim(),
          tries: parsedTries,
          costPerTry: parsedCostPerTry,
          fileName: image.fileName,
          contentType: image.contentType,
          file,
          accessToken: user?.access_token,
        });
      } else {
        await createToy({
          description: description.trim(),
          tries: parsedTries,
          costPerTry: parsedCostPerTry,
          caught: false,
          accessToken: user?.access_token,
        });
      }

      setDescription('');
      setTries('');
      setCostPerTry('');
      setCaught(true);
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
                <Text className="font-display text-3xl font-bold text-white">Add attempt</Text>
              </View>

              <View className="gap-4 rounded-lg bg-white p-4">
                <View className="flex-row items-center justify-between gap-4 rounded-lg bg-ink/5 px-4 py-3">
                  <View className="min-w-0 flex-1">
                    <Text className="font-display text-sm font-bold text-ink">Caught toy</Text>
                    <Text className="font-display text-xs font-semibold text-ink/55">
                      {caught ? 'Image required' : 'Save without image'}
                    </Text>
                  </View>
                  <Switch
                    accessibilityLabel="Caught toy"
                    disabled={isUploading}
                    onValueChange={(value) => {
                      setCaught(value);
                      if (!value) {
                        setImage(null);
                      }
                    }}
                    value={caught}
                  />
                </View>

                <View className="gap-2">
                  <Text className="font-display text-sm font-bold text-ink">Description</Text>
                  <TextInput
                    accessibilityLabel="Attempt description"
                    autoCapitalize="sentences"
                    className="rounded-lg border border-ink/15 px-4 py-3 font-display text-base text-ink"
                    editable={!isUploading}
                    maxLength={120}
                    onChangeText={setDescription}
                    placeholder="Toy or machine description"
                    placeholderTextColor="rgba(29, 25, 38, 0.45)"
                    value={description}
                  />
                </View>

                <View className="gap-2">
                  <Text className="font-display text-sm font-bold text-ink">Tries</Text>
                  <TextInput
                    accessibilityLabel="Number of tries"
                    className="rounded-lg border border-ink/15 px-4 py-3 font-display text-base text-ink"
                    editable={!isUploading}
                    inputMode="numeric"
                    keyboardType="number-pad"
                    maxLength={4}
                    onChangeText={(value) => {
                      setTries(value.replace(/\D/g, ''));
                    }}
                    placeholder="How many tries?"
                    placeholderTextColor="rgba(29, 25, 38, 0.45)"
                    value={tries}
                  />
                </View>

                <View className="gap-2">
                  <Text className="font-display text-sm font-bold text-ink">Cost per try</Text>
                  <TextInput
                    accessibilityLabel="Cost per try"
                    className="rounded-lg border border-ink/15 px-4 py-3 font-display text-base text-ink"
                    editable={!isUploading}
                    inputMode="decimal"
                    keyboardType="decimal-pad"
                    maxLength={8}
                    onChangeText={(value) => {
                      setCostPerTry(normalizeCostInput(value));
                    }}
                    placeholder="2.50"
                    placeholderTextColor="rgba(29, 25, 38, 0.45)"
                    value={costPerTry}
                  />
                </View>

                {caught ? (
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
                ) : null}

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
                    <Text className="font-display text-sm font-bold text-white">
                      {caught ? 'Upload toy' : 'Save attempt'}
                    </Text>
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
