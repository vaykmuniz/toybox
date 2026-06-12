import type { ImageProps } from 'expo-image';

import { getApiSetupError, resolveApiUrl, type ApiOptions } from './api';

type OddsImageSource = ImageProps['source'];

const DefaultOddsTimeoutMs = 10_000;

export interface RecentCatchOwner {
  id: string;
  name: string | null;
  handle: string;
  avatar_url: OddsImageSource | null;
}

export interface RecentCatch {
  id: string;
  description: string;
  media_url: OddsImageSource | null;
  tries: number;
  cost_per_try: number;
  caught: boolean;
  created_at: string;
  owner: RecentCatchOwner;
}

export type OddsApiOptions = ApiOptions;

export interface FetchRecentCatchesOptions extends OddsApiOptions {
  accessToken?: string;
  timeoutMs?: number;
}

export const getRecentCatchesEndpoint = (options: OddsApiOptions = {}) => {
  return `${resolveApiUrl(options)}/odds/recent-catches`;
};

export const fetchRecentCatches = async ({
  accessToken,
  timeoutMs = DefaultOddsTimeoutMs,
  ...apiOptions
}: FetchRecentCatchesOptions = {}): Promise<RecentCatch[]> => {
  const setupError = getApiSetupError(apiOptions);

  if (setupError) {
    throw setupError;
  }

  const endpoint = getRecentCatchesEndpoint(apiOptions);
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => {
    abortController.abort();
  }, timeoutMs);
  let response: Response;

  try {
    response = await fetch(endpoint, {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      signal: abortController.signal,
    });
  } catch (fetchError) {
    if (abortController.signal.aborted) {
      throw new Error(`Failed to fetch recent catches from ${endpoint}: timed out after ${timeoutMs}ms`);
    }

    const message = fetchError instanceof Error ? fetchError.message : 'Unknown network error';

    throw new Error(`Failed to fetch recent catches from ${endpoint}: ${message}`);
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch recent catches: ${response.status}`);
  }

  return response.json() as Promise<RecentCatch[]>;
};
