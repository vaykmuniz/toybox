import Constants from 'expo-constants';
import type { ImageProps } from 'expo-image';

type FeedImageSource = ImageProps['source'];

const DefaultApiUrl = 'http://localhost:8000';
const DefaultFeedTimeoutMs = 10_000;
const LocalApiHostPattern = /^(localhost|127(?:\.\d{1,3}){3})$/i;
const PrivateLanHostPattern =
  /^(10(?:\.\d{1,3}){3}|172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2}|192\.168(?:\.\d{1,3}){2})$/;

type ExpoConstantsWithDevHost = typeof Constants & {
  expoConfig?: {
    hostUri?: string | null;
  } | null;
  manifest?: {
    debuggerHost?: string | null;
  } | null;
  manifest2?: {
    extra?: {
      expoClient?: {
        hostUri?: string | null;
      } | null;
    } | null;
  } | null;
};

export interface GetFeed {
  items: FeedItem[];
}

export interface FeedItem {
  id: string;
  author: FeedAuthor;
  media_url: FeedImageSource;
  caption: string;
  location: string;
  posted_at: string;
}

export interface FeedAuthor {
  id: string;
  name: string;
  handle: string;
  avatar_url: FeedImageSource;
}

export interface FeedApiOptions {
  apiUrl?: string;
  expoDevHost?: string | null;
}

export interface FetchFeedOptions extends FeedApiOptions {
  timeoutMs?: number;
}

const parseHostFromExpoUri = (hostUri?: string | null) => {
  if (!hostUri) {
    return null;
  }

  try {
    return new URL(hostUri.includes('://') ? hostUri : `http://${hostUri}`).hostname;
  } catch {
    return null;
  }
};

export const getExpoDevHost = () => {
  const constants = Constants as ExpoConstantsWithDevHost;

  return (
    parseHostFromExpoUri(constants.expoConfig?.hostUri) ??
    parseHostFromExpoUri(constants.manifest2?.extra?.expoClient?.hostUri) ??
    parseHostFromExpoUri(constants.manifest?.debuggerHost)
  );
};

export const resolveApiUrl = ({
  apiUrl = process.env.EXPO_PUBLIC_API_URL ?? DefaultApiUrl,
  expoDevHost = getExpoDevHost(),
}: FeedApiOptions = {}) => {
  try {
    const url = new URL(apiUrl);

    if (
      LocalApiHostPattern.test(url.hostname) &&
      expoDevHost &&
      PrivateLanHostPattern.test(expoDevHost)
    ) {
      url.hostname = expoDevHost;
    }

    return url.toString().replace(/\/+$/, '');
  } catch {
    return apiUrl.replace(/\/+$/, '');
  }
};

export const getApiSetupError = ({
  apiUrl = process.env.EXPO_PUBLIC_API_URL ?? DefaultApiUrl,
  expoDevHost = getExpoDevHost(),
}: FeedApiOptions = {}) => {
  try {
    const url = new URL(apiUrl);

    if (
      LocalApiHostPattern.test(url.hostname) &&
      expoDevHost &&
      !PrivateLanHostPattern.test(expoDevHost)
    ) {
      return new Error(
        `Cannot reach the API through Expo tunnel host ${expoDevHost}. Set EXPO_PUBLIC_API_URL to your computer LAN API URL, for example http://192.168.1.20:8000.`
      );
    }
  } catch {
    return null;
  }

  return null;
};

export const getFeedEndpoint = (options: FeedApiOptions = {}) => {
  return `${resolveApiUrl(options)}/feed`;
};

export const fetchFeed = async ({
  timeoutMs = DefaultFeedTimeoutMs,
  ...apiOptions
}: FetchFeedOptions = {}): Promise<GetFeed> => {
  const setupError = getApiSetupError(apiOptions);

  if (setupError) {
    throw setupError;
  }

  const feedEndpoint = getFeedEndpoint(apiOptions);
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => {
    abortController.abort();
  }, timeoutMs);
  let response: Response;

  try {
    response = await fetch(feedEndpoint, { signal: abortController.signal });
  } catch (fetchError) {
    if (abortController.signal.aborted) {
      throw new Error(`Failed to fetch feed from ${feedEndpoint}: timed out after ${timeoutMs}ms`);
    }

    const message = fetchError instanceof Error ? fetchError.message : 'Unknown network error';

    throw new Error(`Failed to fetch feed from ${feedEndpoint}: ${message}`);
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch feed: ${response.status}`);
  }

  return response.json() as Promise<GetFeed>;
};
