import Constants from 'expo-constants';

const DefaultApiUrl = 'http://localhost:8000';
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

export interface ApiOptions {
  apiUrl?: string;
  expoDevHost?: string | null;
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
}: ApiOptions = {}) => {
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
}: ApiOptions = {}) => {
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
