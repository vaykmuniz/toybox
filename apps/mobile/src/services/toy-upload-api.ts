import { getApiSetupError, resolveApiUrl, type ApiOptions } from './api';

const DefaultToyUploadTimeoutMs = 20_000;

export interface ToyUploadApiOptions extends ApiOptions {
  timeoutMs?: number;
}

export interface CreateToyUploadUrlRequest {
  fileName: string;
  contentType: string;
}

export interface ToyUploadUrl {
  upload_url: string;
  object_url: string;
  object_key: string;
}

export interface CreateToyRequest {
  name: string;
  imageUrl: string;
  objectKey: string;
  tries: number;
}

export interface Toy {
  id: string;
  name: string;
  media_url: string;
  object_key: string;
  tries: number;
  created_at: string;
}

export type NativeUploadFile = {
  uri: string;
  name?: string;
  type?: string;
};

export type ToyUploadFile = Blob | NativeUploadFile;

const isNativeUploadFile = (file: ToyUploadFile): file is NativeUploadFile => {
  return typeof file === 'object' && file !== null && 'uri' in file;
};

const formatUploadError = (status: number, detail?: string | null) => {
  const cleanDetail = detail?.trim();

  if (!cleanDetail) {
    return `Failed to upload toy image: ${status}`;
  }

  return `Failed to upload toy image: ${status} - ${cleanDetail.slice(0, 500)}`;
};

const getUploadUrlOrigin = (uploadUrl: string) => {
  try {
    return new URL(uploadUrl).origin;
  } catch {
    return uploadUrl;
  }
};

const getLoopbackUploadUrlError = (uploadUrl: string) => {
  try {
    const { hostname, origin } = new URL(uploadUrl);

    if (['localhost', '127.0.0.1', '0.0.0.0', '::1'].includes(hostname)) {
      return (
        `Failed to upload toy image: upload URL points to ${origin}. ` +
        'Use a phone-reachable S3 endpoint URL instead of localhost.'
      );
    }
  } catch {
    return null;
  }

  return null;
};

export const getToyUploadUrlEndpoint = (options: ApiOptions = {}) => {
  return `${resolveApiUrl(options)}/toys/upload-url`;
};

export const getCreateToyEndpoint = (options: ApiOptions = {}) => {
  return `${resolveApiUrl(options)}/toys`;
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

export const createToyUploadUrl = async ({
  fileName,
  contentType,
  timeoutMs = DefaultToyUploadTimeoutMs,
  ...apiOptions
}: CreateToyUploadUrlRequest & ToyUploadApiOptions): Promise<ToyUploadUrl> => {
  const setupError = getApiSetupError(apiOptions);

  if (setupError) {
    throw setupError;
  }

  const endpoint = getToyUploadUrlEndpoint(apiOptions);
  const response = await fetchWithTimeout(
    endpoint,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file_name: fileName,
        content_type: contentType,
      }),
    },
    timeoutMs,
    'Failed to create toy upload URL'
  );

  if (!response.ok) {
    throw new Error(`Failed to create toy upload URL: ${response.status}`);
  }

  return response.json() as Promise<ToyUploadUrl>;
};

export const uploadToyFile = async ({
  uploadUrl,
  file,
  contentType,
}: {
  uploadUrl: string;
  file: ToyUploadFile;
  contentType: string;
}) => {
  if (isNativeUploadFile(file)) {
    await uploadNativeToyFile({
      uploadUrl,
      file,
      contentType,
    });

    return;
  }

  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
    },
    body: file,
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => null);

    throw new Error(formatUploadError(response.status, detail));
  }
};

const uploadNativeToyFile = async ({
  uploadUrl,
  file,
  contentType,
}: {
  uploadUrl: string;
  file: NativeUploadFile;
  contentType: string;
}) => {
  const loopbackError = getLoopbackUploadUrlError(uploadUrl);

  if (loopbackError) {
    throw new Error(loopbackError);
  }

  await new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();
    const uploadOrigin = getUploadUrlOrigin(uploadUrl);

    request.open('PUT', uploadUrl);
    request.setRequestHeader('Content-Type', contentType);
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        resolve();
        return;
      }

      reject(new Error(formatUploadError(request.status, request.responseText)));
    };
    request.onerror = () => {
      reject(new Error(`Failed to upload toy image: network error from ${uploadOrigin}`));
    };
    request.ontimeout = () => {
      reject(new Error(`Failed to upload toy image: timed out from ${uploadOrigin}`));
    };
    request.send(file);
  });
};

export const createToy = async ({
  name,
  imageUrl,
  objectKey,
  tries,
  timeoutMs = DefaultToyUploadTimeoutMs,
  ...apiOptions
}: CreateToyRequest & ToyUploadApiOptions): Promise<Toy> => {
  const setupError = getApiSetupError(apiOptions);

  if (setupError) {
    throw setupError;
  }

  const endpoint = getCreateToyEndpoint(apiOptions);
  const response = await fetchWithTimeout(
    endpoint,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        image_url: imageUrl,
        object_key: objectKey,
        tries,
      }),
    },
    timeoutMs,
    'Failed to save toy'
  );

  if (!response.ok) {
    throw new Error(`Failed to save toy: ${response.status}`);
  }

  return response.json() as Promise<Toy>;
};

export const uploadToy = async ({
  name,
  tries,
  fileName,
  contentType,
  file,
  ...apiOptions
}: CreateToyUploadUrlRequest &
  Omit<CreateToyRequest, 'imageUrl' | 'objectKey'> &
  ToyUploadApiOptions & {
    file: ToyUploadFile;
  }): Promise<Toy> => {
  const uploadTarget = await createToyUploadUrl({
    fileName,
    contentType,
    ...apiOptions,
  });

  await uploadToyFile({
    uploadUrl: uploadTarget.upload_url,
    file,
    contentType,
  });

  return createToy({
    name,
    imageUrl: uploadTarget.object_url,
    objectKey: uploadTarget.object_key,
    tries,
    ...apiOptions,
  });
};
