/* global __dirname */

const assert = require('node:assert/strict');
const Module = require('node:module');
const fs = require('node:fs');
const path = require('node:path');

require('sucrase/register/ts');
require('sucrase/register/tsx');

const appRoot = path.resolve(__dirname, '../../..');
let mockedExpoConstants = {};
let mockedPlatformOS = 'android';
let manipulateCalls = [];
const originalLoad = Module._load;
const originalResolveFilename = Module._resolveFilename;

Module._load = function load(request, parent, isMain) {
  if (request === 'expo-constants') {
    return {
      __esModule: true,
      default: mockedExpoConstants,
    };
  }

  if (request === 'expo-image-manipulator') {
    return {
      manipulateAsync: async (uri, actions, saveOptions) => {
        manipulateCalls.push({ uri, actions, saveOptions });

        return { uri: 'file:///cache/converted-toy.jpg' };
      },
      SaveFormat: {
        JPEG: 'jpeg',
        PNG: 'png',
        WEBP: 'webp',
      },
    };
  }

  if (request === 'react-native') {
    return {
      Platform: {
        get OS() {
          return mockedPlatformOS;
        },
      },
    };
  }

  return originalLoad.call(this, request, parent, isMain);
};

Module._resolveFilename = function resolveFilename(request, parent, isMain, options) {
  if (request.startsWith('@/assets/')) {
    return originalResolveFilename.call(
      this,
      path.join(appRoot, request.slice(2)),
      parent,
      isMain,
      options
    );
  }

  if (request.startsWith('@/')) {
    return originalResolveFilename.call(
      this,
      path.join(appRoot, 'src', request.slice(2)),
      parent,
      isMain,
      options
    );
  }

  try {
    return originalResolveFilename.call(this, request, parent, isMain, options);
  } catch (error) {
    if (request.startsWith('.') && parent?.filename) {
      const basePath = path.resolve(path.dirname(parent.filename), request);

      for (const extension of ['.ts', '.tsx']) {
        const candidate = `${basePath}${extension}`;

        if (fs.existsSync(candidate)) {
          return candidate;
        }
      }
    }

    throw error;
  }
};

const {
  createToy,
  createToyUploadUrl,
  getCreateToyEndpoint,
  getToyUploadUrlEndpoint,
  uploadToy,
  uploadToyFile,
} = require('../toy-upload-api');
const {
  getFileNameFromUri,
  preparePickedToyImage,
} = require('../toy-upload-image');

const test = async (name, fn) => {
  try {
    await fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
};

const withFetch = async (fetchImplementation, fn) => {
  const originalFetch = global.fetch;
  global.fetch = fetchImplementation;

  try {
    await fn();
  } finally {
    global.fetch = originalFetch;
  }
};

const withXMLHttpRequest = async (XMLHttpRequestImplementation, fn) => {
  const originalXMLHttpRequest = global.XMLHttpRequest;
  global.XMLHttpRequest = XMLHttpRequestImplementation;

  try {
    await fn();
  } finally {
    global.XMLHttpRequest = originalXMLHttpRequest;
  }
};

(async () => {
  await test('toy upload endpoints use the configured API URL', () => {
    assert.equal(
      getToyUploadUrlEndpoint({ apiUrl: 'http://192.168.1.20:8000/' }),
      'http://192.168.1.20:8000/toys/upload-url'
    );
    assert.equal(
      getCreateToyEndpoint({ apiUrl: 'http://192.168.1.20:8000/' }),
      'http://192.168.1.20:8000/toys'
    );
  });

  await test('createToyUploadUrl posts file metadata', async () => {
    const fetchCalls = [];

    await withFetch(
      async (url, options) => {
        fetchCalls.push({ url, options });

        return {
          ok: true,
          status: 200,
          json: async () => ({
            upload_url: 'https://uploads.example.com/robot.png',
            object_url: 'https://cdn.example.com/toys/robot.png',
            object_key: 'toys/robot.png',
          }),
        };
      },
      async () => {
        const response = await createToyUploadUrl({
          apiUrl: 'http://localhost:8000',
          fileName: 'robot.png',
          contentType: 'image/png',
        });

        assert.equal(fetchCalls[0].url, 'http://localhost:8000/toys/upload-url');
        assert.equal(fetchCalls[0].options.method, 'POST');
        assert.deepEqual(JSON.parse(fetchCalls[0].options.body), {
          file_name: 'robot.png',
          content_type: 'image/png',
        });
        assert.equal(response.object_key, 'toys/robot.png');
      }
    );
  });

  await test('createToy posts toy metadata', async () => {
    const fetchCalls = [];

    await withFetch(
      async (url, options) => {
        fetchCalls.push({ url, options });

        return {
          ok: true,
          status: 200,
          json: async () => ({
            id: 'toy-1',
            name: 'Desk robot',
            media_url: 'https://cdn.example.com/toys/robot.png',
            object_key: 'toys/robot.png',
            created_at: '2026-06-07T12:00:00+00:00',
          }),
        };
      },
      async () => {
        const toy = await createToy({
          apiUrl: 'http://localhost:8000',
          name: 'Desk robot',
          imageUrl: 'https://cdn.example.com/toys/robot.png',
          objectKey: 'toys/robot.png',
        });

        assert.equal(fetchCalls[0].url, 'http://localhost:8000/toys');
        assert.deepEqual(JSON.parse(fetchCalls[0].options.body), {
          name: 'Desk robot',
          image_url: 'https://cdn.example.com/toys/robot.png',
          object_key: 'toys/robot.png',
        });
        assert.equal(toy.name, 'Desk robot');
      }
    );
  });

  await test('getFileNameFromUri ignores query strings and falls back to jpg', () => {
    assert.equal(getFileNameFromUri('file:///cache/robot.png?width=100'), 'robot.png');
    assert.equal(getFileNameFromUri('file:///'), 'toy.jpg');
  });

  await test('preparePickedToyImage converts native images to jpeg upload metadata', async () => {
    mockedPlatformOS = 'android';
    manipulateCalls = [];

    const preparedImage = await preparePickedToyImage({
      uri: 'file:///cache/photo.heic',
      fileName: 'photo.heic',
      width: 3000,
      height: 2000,
      type: 'image',
      mimeType: 'image/heic',
    });

    assert.deepEqual(manipulateCalls, [
      {
        uri: 'file:///cache/photo.heic',
        actions: [],
        saveOptions: {
          compress: 0.9,
          format: 'jpeg',
        },
      },
    ]);
    assert.deepEqual(preparedImage, {
      uri: 'file:///cache/converted-toy.jpg',
      fileName: 'photo.jpg',
      contentType: 'image/jpeg',
    });
  });

  await test('preparePickedToyImage keeps supported web image files', async () => {
    mockedPlatformOS = 'web';
    const file = { name: 'robot.png', type: 'image/png' };

    const preparedImage = await preparePickedToyImage({
      uri: 'blob:https://example.test/robot',
      fileName: null,
      file,
      width: 600,
      height: 600,
      type: 'image',
      mimeType: null,
    });

    assert.deepEqual(preparedImage, {
      uri: 'blob:https://example.test/robot',
      fileName: 'robot.png',
      contentType: 'image/png',
      file,
    });
  });

  await test('preparePickedToyImage rejects unsupported web image formats', async () => {
    mockedPlatformOS = 'web';

    await assert.rejects(
      () =>
        preparePickedToyImage({
          uri: 'blob:https://example.test/robot',
          fileName: 'robot.heic',
          width: 600,
          height: 600,
          type: 'image',
          mimeType: 'image/heic',
        }),
      /Choose a JPEG, PNG, or WebP image to upload/
    );
  });

  await test('uploadToy presigns, uploads to S3, then saves the toy', async () => {
    const fetchCalls = [];

    await withFetch(
      async (url, options = {}) => {
        fetchCalls.push({ url, options });

        if (url === 'http://localhost:8000/toys/upload-url') {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              upload_url: 'https://uploads.example.com/robot.png',
              object_url: 'https://cdn.example.com/toys/robot.png',
              object_key: 'toys/robot.png',
            }),
          };
        }

        if (url === 'https://uploads.example.com/robot.png') {
          return {
            ok: true,
            status: 200,
          };
        }

        return {
          ok: true,
          status: 200,
          json: async () => ({
            id: 'toy-1',
            name: 'Desk robot',
            media_url: 'https://cdn.example.com/toys/robot.png',
            object_key: 'toys/robot.png',
            created_at: '2026-06-07T12:00:00+00:00',
          }),
        };
      },
      async () => {
        const toy = await uploadToy({
          apiUrl: 'http://localhost:8000',
          name: 'Desk robot',
          fileName: 'robot.png',
          contentType: 'image/png',
          file: new Blob(['image'], { type: 'image/png' }),
        });

        assert.deepEqual(
          fetchCalls.map((call) => [call.url, call.options.method]),
          [
            ['http://localhost:8000/toys/upload-url', 'POST'],
            ['https://uploads.example.com/robot.png', 'PUT'],
            ['http://localhost:8000/toys', 'POST'],
          ]
        );
        assert.equal(fetchCalls[1].options.headers['Content-Type'], 'image/png');
        assert.equal(toy.media_url, 'https://cdn.example.com/toys/robot.png');
      }
    );
  });

  await test('uploadToyFile uploads native URI files with XMLHttpRequest', async () => {
    const requests = [];

    class MockXMLHttpRequest {
      headers = {};
      status = 200;

      open(method, url) {
        this.method = method;
        this.url = url;
      }

      setRequestHeader(name, value) {
        this.headers[name] = value;
      }

      send(body) {
        requests.push({
          method: this.method,
          url: this.url,
          headers: this.headers,
          body,
        });
        this.onload();
      }
    }

    await withXMLHttpRequest(MockXMLHttpRequest, async () => {
      await uploadToyFile({
        uploadUrl: 'https://uploads.example.com/robot.png',
        contentType: 'image/png',
        file: {
          uri: 'file:///cache/robot.png',
          name: 'robot.png',
          type: 'image/png',
        },
      });
    });

    assert.deepEqual(requests, [
      {
        method: 'PUT',
        url: 'https://uploads.example.com/robot.png',
        headers: {
          'Content-Type': 'image/png',
        },
        body: {
          uri: 'file:///cache/robot.png',
          name: 'robot.png',
          type: 'image/png',
        },
      },
    ]);
  });

  await test('uploadToyFile explains localhost native upload URLs', async () => {
    await assert.rejects(
      () =>
        uploadToyFile({
          uploadUrl: 'http://localhost:9000/toybox-bucket/toys/robot.png?signature=test',
          contentType: 'image/png',
          file: {
            uri: 'file:///cache/robot.png',
            name: 'robot.png',
            type: 'image/png',
          },
        }),
      /upload URL points to http:\/\/localhost:9000/
    );
  });

  await test('uploadToyFile includes upload origin on native network errors', async () => {
    class MockXMLHttpRequest {
      open(method, url) {
        this.method = method;
        this.url = url;
      }

      setRequestHeader() {}

      send() {
        this.onerror();
      }
    }

    await withXMLHttpRequest(MockXMLHttpRequest, async () => {
      await assert.rejects(
        () =>
          uploadToyFile({
            uploadUrl: 'https://uploads.example.com/robot.png',
            contentType: 'image/png',
            file: {
              uri: 'file:///cache/robot.png',
              name: 'robot.png',
              type: 'image/png',
            },
          }),
        /Failed to upload toy image: network error from https:\/\/uploads.example.com/
      );
    });
  });

  await test('uploadToy fails when S3 upload fails', async () => {
    await withFetch(
      async (url) => {
        if (url === 'http://localhost:8000/toys/upload-url') {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              upload_url: 'https://uploads.example.com/robot.png',
              object_url: 'https://cdn.example.com/toys/robot.png',
              object_key: 'toys/robot.png',
            }),
          };
        }

        return {
          ok: false,
          status: 403,
          text: async () => '<Error><Code>AccessDenied</Code></Error>',
        };
      },
      async () => {
        await assert.rejects(
          () =>
            uploadToy({
              apiUrl: 'http://localhost:8000',
              name: 'Desk robot',
              fileName: 'robot.png',
              contentType: 'image/png',
              file: new Blob(['image'], { type: 'image/png' }),
            }),
          /Failed to upload toy image: 403 - <Error><Code>AccessDenied<\/Code><\/Error>/
        );
      }
    );
  });

  await test('createToyUploadUrl fails before request on Expo tunnel API misconfiguration', async () => {
    mockedExpoConstants.expoConfig = {
      hostUri: 'uc2i2ko-anonymous-8081.exp.direct',
    };
    let fetchWasCalled = false;

    await withFetch(
      async () => {
        fetchWasCalled = true;
      },
      async () => {
        try {
          await assert.rejects(
            () => createToyUploadUrl({ fileName: 'robot.png', contentType: 'image/png' }),
            /Cannot reach the API through Expo tunnel host/
          );
          assert.equal(fetchWasCalled, false);
        } finally {
          mockedExpoConstants = {};
        }
      }
    );
  });
})();
