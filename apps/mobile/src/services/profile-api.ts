import type { ImageProps } from 'expo-image';

import { getApiSetupError, resolveApiUrl, type ApiOptions } from './api';
import { uploadToyFile, type ToyUploadFile } from './toy-upload-api';

type ProfileImageSource = ImageProps['source'];

const DefaultProfileTimeoutMs = 10_000;

export interface GetProfile {
  id: string;
  name: string;
  handle: string;
  avatar_url: ProfileImageSource | null;
  toys: Toy[];
}

export interface Toy {
  id: string;
  media_url: ProfileImageSource | null;
  description: string;
  tries: number;
  cost_per_try: number;
  caught: boolean;
}

export type ProfileApiOptions = ApiOptions;

export interface FetchProfileOptions extends ProfileApiOptions {
  accessToken?: string;
  timeoutMs?: number;
}

export interface CreateAvatarUploadUrlRequest {
  fileName: string;
  contentType: string;
}

export interface AvatarUploadUrl {
  upload_url: string;
  object_url: string;
  object_key: string;
}

export interface UpdateAvatarRequest {
  objectKey: string;
}

export interface UploadAvatarRequest extends CreateAvatarUploadUrlRequest {
  file: ToyUploadFile;
}

export const getProfileEndpoint = (options: ProfileApiOptions = {}) => {
  return `${resolveApiUrl(options)}/profile`;
};

export const getAvatarUploadUrlEndpoint = (options: ProfileApiOptions = {}) => {
  return `${resolveApiUrl(options)}/profile/avatar/upload-url`;
};

export const getUpdateAvatarEndpoint = (options: ProfileApiOptions = {}) => {
  return `${resolveApiUrl(options)}/profile/avatar`;
};

const fetchWithTimeout = async (
  endpoint: string,
  init: RequestInit,
  timeoutMs: number,
  description: string
) => {
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => {
    abortController.abort();
  }, timeoutMs);

  try {
    return await fetch(endpoint, {
      ...init,
      signal: abortController.signal,
    });
  } catch (fetchError) {
    if (abortController.signal.aborted) {
      throw new Error(`${description} from ${endpoint}: timed out after ${timeoutMs}ms`);
    }

    const message = fetchError instanceof Error ? fetchError.message : 'Unknown network error';

    throw new Error(`${description} from ${endpoint}: ${message}`);
  } finally {
    clearTimeout(timeoutId);
  }
};

export const fetchProfile = async ({
  accessToken,
  timeoutMs = DefaultProfileTimeoutMs,
  ...apiOptions
}: FetchProfileOptions = {}): Promise<GetProfile> => {
  const setupError = getApiSetupError(apiOptions);

  if (setupError) {
    throw setupError;
  }

  const profileEndpoint = getProfileEndpoint(apiOptions);
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => {
    abortController.abort();
  }, timeoutMs);
  let response: Response;

  try {
    response = await fetch(profileEndpoint, {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      signal: abortController.signal,
    });
  } catch (fetchError) {
    if (abortController.signal.aborted) {
      throw new Error(
        `Failed to fetch profile from ${profileEndpoint}: timed out after ${timeoutMs}ms`
      );
    }

    const message = fetchError instanceof Error ? fetchError.message : 'Unknown network error';

    throw new Error(`Failed to fetch profile from ${profileEndpoint}: ${message}`);
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch profile: ${response.status}`);
  }

  return response.json() as Promise<GetProfile>;
};

const requireAccessToken = (accessToken: string | undefined, description: string) => {
  if (!accessToken) {
    throw new Error(`${description}: missing access token`);
  }

  return accessToken;
};

export const createAvatarUploadUrl = async ({
  fileName,
  contentType,
  accessToken,
  timeoutMs = DefaultProfileTimeoutMs,
  ...apiOptions
}: CreateAvatarUploadUrlRequest & FetchProfileOptions): Promise<AvatarUploadUrl> => {
  const setupError = getApiSetupError(apiOptions);

  if (setupError) {
    throw setupError;
  }

  const token = requireAccessToken(accessToken, 'Failed to create avatar upload URL');
  const endpoint = getAvatarUploadUrlEndpoint(apiOptions);
  const response = await fetchWithTimeout(
    endpoint,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file_name: fileName,
        content_type: contentType,
      }),
    },
    timeoutMs,
    'Failed to create avatar upload URL'
  );

  if (!response.ok) {
    throw new Error(`Failed to create avatar upload URL: ${response.status}`);
  }

  return response.json() as Promise<AvatarUploadUrl>;
};

export const updateAvatar = async ({
  objectKey,
  accessToken,
  timeoutMs = DefaultProfileTimeoutMs,
  ...apiOptions
}: UpdateAvatarRequest & FetchProfileOptions): Promise<GetProfile> => {
  const setupError = getApiSetupError(apiOptions);

  if (setupError) {
    throw setupError;
  }

  const token = requireAccessToken(accessToken, 'Failed to update avatar');
  const endpoint = getUpdateAvatarEndpoint(apiOptions);
  const response = await fetchWithTimeout(
    endpoint,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        object_key: objectKey,
      }),
    },
    timeoutMs,
    'Failed to update avatar'
  );

  if (!response.ok) {
    throw new Error(`Failed to update avatar: ${response.status}`);
  }

  return response.json() as Promise<GetProfile>;
};

export const uploadAvatar = async ({
  fileName,
  contentType,
  file,
  ...apiOptions
}: UploadAvatarRequest & FetchProfileOptions): Promise<GetProfile> => {
  const uploadTarget = await createAvatarUploadUrl({
    fileName,
    contentType,
    ...apiOptions,
  });

  await uploadToyFile({
    uploadUrl: uploadTarget.upload_url,
    file,
    contentType,
  });

  return updateAvatar({
    objectKey: uploadTarget.object_key,
    ...apiOptions,
  });
};
