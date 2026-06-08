import { getApiSetupError, resolveApiUrl, type FeedApiOptions } from './feed-api';

const DefaultAuthTimeoutMs = 10_000;

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  id: string;
  email: string;
  username: string;
  name: string;
  access_token: string;
  token_type: 'bearer';
  expires_at: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  name: string;
  password: string;
}

export interface RegisterResponse {
  id: string;
  email: string;
  username: string;
  name: string;
  token_expires_at: string;
}

export type AuthApiOptions = FeedApiOptions;

export interface AuthRequestOptions extends AuthApiOptions {
  timeoutMs?: number;
}

export interface LoginOptions extends AuthRequestOptions {
  payload: LoginRequest;
}

export interface RegisterOptions extends AuthRequestOptions {
  payload: RegisterRequest;
}

type AuthEndpoint = 'login' | 'register';

export const getLoginEndpoint = (options: AuthApiOptions = {}) => {
  return `${resolveApiUrl(options)}/login`;
};

export const getRegisterEndpoint = (options: AuthApiOptions = {}) => {
  return `${resolveApiUrl(options)}/register`;
};

export const login = async ({
  payload,
  timeoutMs = DefaultAuthTimeoutMs,
  ...apiOptions
}: LoginOptions): Promise<LoginResponse> => {
  return postAuthJson<LoginResponse>({
    endpointName: 'login',
    payload,
    timeoutMs,
    url: getLoginEndpoint(apiOptions),
    ...apiOptions,
  });
};

export const register = async ({
  payload,
  timeoutMs = DefaultAuthTimeoutMs,
  ...apiOptions
}: RegisterOptions): Promise<RegisterResponse> => {
  return postAuthJson<RegisterResponse>({
    endpointName: 'register',
    payload,
    timeoutMs,
    url: getRegisterEndpoint(apiOptions),
    ...apiOptions,
  });
};

const postAuthJson = async <ResponseBody>({
  endpointName,
  payload,
  timeoutMs,
  url,
  ...apiOptions
}: AuthRequestOptions & {
  endpointName: AuthEndpoint;
  payload: LoginRequest | RegisterRequest;
  url: string;
}): Promise<ResponseBody> => {
  const setupError = getApiSetupError(apiOptions);

  if (setupError) {
    throw setupError;
  }

  const abortController = new AbortController();
  const timeoutId = setTimeout(() => {
    abortController.abort();
  }, timeoutMs);
  let response: Response;

  try {
    response = await fetch(url, {
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      signal: abortController.signal,
    });
  } catch (fetchError) {
    if (abortController.signal.aborted) {
      throw new Error(
        `Failed to ${endpointName} through ${url}: timed out after ${timeoutMs}ms`
      );
    }

    const message = fetchError instanceof Error ? fetchError.message : 'Unknown network error';

    throw new Error(`Failed to ${endpointName} through ${url}: ${message}`);
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const detail = await getResponseDetail(response);
    const suffix = detail ? `: ${detail}` : '';

    throw new Error(`Failed to ${endpointName}: ${response.status}${suffix}`);
  }

  return response.json() as Promise<ResponseBody>;
};

const getResponseDetail = async (response: Response) => {
  try {
    const body = (await response.json()) as { detail?: unknown };

    if (typeof body.detail === 'string') {
      return body.detail;
    }

    if (Array.isArray(body.detail)) {
      return body.detail
        .map((item) => {
          if (typeof item === 'string') {
            return item;
          }

          if (item && typeof item === 'object' && 'msg' in item) {
            return String(item.msg);
          }

          return null;
        })
        .filter(Boolean)
        .join(' ');
    }
  } catch {
    return '';
  }

  return '';
};
