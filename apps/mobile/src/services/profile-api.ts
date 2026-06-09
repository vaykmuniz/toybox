import type { ImageProps } from 'expo-image';

import { getApiSetupError, resolveApiUrl, type ApiOptions } from './api';

type ProfileImageSource = ImageProps['source'];

const DefaultProfileTimeoutMs = 10_000;

export interface GetProfile {
  id: string;
  name: string;
  handle: string;
  avatar_url: ProfileImageSource;
  bio: string;
  stats: ProfileStats;
  badges: Badge[];
  toys: Toy[];
}

export interface ProfileStats {
  posts: number;
  followers: number;
  following: number;
}

export interface Toy {
  id: string;
  media_url: ProfileImageSource;
  caption?: string;
}

export interface Badge {
  description: string;
  text: string;
}

export type ProfileApiOptions = ApiOptions;

export interface FetchProfileOptions extends ProfileApiOptions {
  timeoutMs?: number;
}

export const getProfileEndpoint = (options: ProfileApiOptions = {}) => {
  return `${resolveApiUrl(options)}/profile`;
};

export const fetchProfile = async ({
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
    response = await fetch(profileEndpoint, { signal: abortController.signal });
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
