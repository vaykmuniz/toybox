import { getApiSetupError, resolveApiUrl, type ApiOptions } from './api';

const DefaultAuthTimeoutMs = 10_000;

export const AuthLoginErrorMessage =
  "We couldn't log you in. Check your username and password and try again.";
export const AuthRegisterErrorMessage =
  "We couldn't create your account. Please check your details and try again.";
export const AuthConnectivityErrorMessage =
  "We couldn't reach Toybox. Check your connection and try again.";

export type AuthApiErrorKind = 'login' | 'register' | 'connectivity';

export class AuthApiError extends Error {
  kind: AuthApiErrorKind;

  constructor(kind: AuthApiErrorKind) {
    super(getAuthErrorMessage(kind));
    this.name = 'AuthApiError';
    this.kind = kind;
  }
}

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

export type AuthApiOptions = ApiOptions;

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
    throw new AuthApiError('connectivity');
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
  } catch {
    throw new AuthApiError('connectivity');
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new AuthApiError(endpointName);
  }

  return response.json() as Promise<ResponseBody>;
};

const getAuthErrorMessage = (kind: AuthApiErrorKind) => {
  if (kind === 'login') {
    return AuthLoginErrorMessage;
  }

  if (kind === 'register') {
    return AuthRegisterErrorMessage;
  }

  return AuthConnectivityErrorMessage;
};
