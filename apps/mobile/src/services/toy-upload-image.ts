import * as ImageManipulator from 'expo-image-manipulator';
import type { ImagePickerAsset } from 'expo-image-picker';
import { Platform } from 'react-native';

export type PreparedToyImage = {
  uri: string;
  fileName: string;
  contentType: string;
  file?: File;
};

const NativeUploadContentType = 'image/jpeg';
const NativeUploadExtension = 'jpg';
const SupportedWebContentTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

export const getFileNameFromUri = (uri: string) => {
  try {
    const fileName = new URL(uri).pathname.split('/').filter(Boolean).pop();

    if (fileName) {
      return fileName;
    }
  } catch {
    // Fall through to plain path parsing for non-URL picker values.
  }

  const [path] = uri.split('?');
  const fileName = path.split('/').filter(Boolean).pop();

  return fileName && !fileName.endsWith(':') ? fileName : 'toy.jpg';
};

const normalizeContentType = (contentType?: string | null) => {
  const normalizedContentType = contentType?.trim().toLowerCase();

  if (normalizedContentType === 'image/jpg') {
    return 'image/jpeg';
  }

  return normalizedContentType || null;
};

const withExtension = (fileName: string, extension: string) => {
  const cleanFileName = fileName.trim() || `toy.${extension}`;
  const extensionPattern = /\.[a-z0-9]+$/i;

  if (extensionPattern.test(cleanFileName)) {
    return cleanFileName.replace(extensionPattern, `.${extension}`);
  }

  return `${cleanFileName}.${extension}`;
};

const prepareWebImage = (asset: ImagePickerAsset): PreparedToyImage => {
  const file = asset.file;
  const contentType = normalizeContentType(file?.type ?? asset.mimeType);

  if (!contentType || !SupportedWebContentTypes.has(contentType)) {
    throw new Error('Choose a JPEG, PNG, or WebP image to upload.');
  }

  return {
    uri: asset.uri,
    fileName: asset.fileName ?? file?.name ?? getFileNameFromUri(asset.uri),
    contentType,
    file,
  };
};

const prepareNativeImage = async (asset: ImagePickerAsset): Promise<PreparedToyImage> => {
  try {
    const convertedImage = await ImageManipulator.manipulateAsync(
      asset.uri,
      [],
      {
        compress: 0.9,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    return {
      uri: convertedImage.uri,
      fileName: withExtension(asset.fileName ?? getFileNameFromUri(asset.uri), NativeUploadExtension),
      contentType: NativeUploadContentType,
    };
  } catch (prepareError) {
    const message = prepareError instanceof Error ? prepareError.message : 'unknown error';

    throw new Error(`Could not prepare image for upload: ${message}`);
  }
};

export const preparePickedToyImage = async (
  asset: ImagePickerAsset
): Promise<PreparedToyImage> => {
  if (Platform.OS === 'web') {
    return prepareWebImage(asset);
  }

  return prepareNativeImage(asset);
};
