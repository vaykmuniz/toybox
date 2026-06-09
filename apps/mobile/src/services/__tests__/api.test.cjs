/* global __dirname */

const assert = require('node:assert/strict');
const Module = require('node:module');
const fs = require('node:fs');
const path = require('node:path');

require('sucrase/register/ts');
require('sucrase/register/tsx');

const appRoot = path.resolve(__dirname, '../../..');
let mockedExpoConstants = {};
const originalLoad = Module._load;
const originalResolveFilename = Module._resolveFilename;

Module._load = function load(request, parent, isMain) {
  if (request === 'expo-constants') {
    return {
      __esModule: true,
      default: mockedExpoConstants,
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

const { getApiSetupError, resolveApiUrl } = require('../api');

const test = async (name, fn) => {
  try {
    await fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
};

const withoutApiEnv = async (fn) => {
  const originalApiUrl = process.env.EXPO_PUBLIC_API_URL;
  delete process.env.EXPO_PUBLIC_API_URL;

  try {
    await fn();
  } finally {
    if (originalApiUrl === undefined) {
      delete process.env.EXPO_PUBLIC_API_URL;
    } else {
      process.env.EXPO_PUBLIC_API_URL = originalApiUrl;
    }
  }
};

(async () => {
  await test('resolveApiUrl defaults to localhost for local runtimes', async () => {
    await withoutApiEnv(async () => {
      assert.equal(resolveApiUrl(), 'http://localhost:8000');
    });
  });

  await test('resolveApiUrl uses EXPO_PUBLIC_API_URL and trims trailing slash', () => {
    assert.equal(
      resolveApiUrl({ apiUrl: 'http://192.168.1.20:8000/' }),
      'http://192.168.1.20:8000'
    );
  });

  await test('resolveApiUrl replaces localhost with the Expo dev host for a phone', () => {
    assert.equal(
      resolveApiUrl({ apiUrl: 'http://localhost:8000', expoDevHost: '192.168.1.20' }),
      'http://192.168.1.20:8000'
    );
    assert.equal(
      resolveApiUrl({ apiUrl: 'http://127.0.0.1:8000/', expoDevHost: '192.168.1.20' }),
      'http://192.168.1.20:8000'
    );
  });

  await test('resolveApiUrl keeps explicit non-local API hosts unchanged', () => {
    assert.equal(
      resolveApiUrl({ apiUrl: 'http://10.0.2.2:8000', expoDevHost: '192.168.1.20' }),
      'http://10.0.2.2:8000'
    );
    assert.equal(
      resolveApiUrl({ apiUrl: 'http://192.168.1.30:8000/', expoDevHost: '192.168.1.20' }),
      'http://192.168.1.30:8000'
    );
  });

  await test('resolveApiUrl does not use Expo tunnel hosts for the API', () => {
    assert.equal(
      resolveApiUrl({
        apiUrl: 'http://localhost:8000',
        expoDevHost: 'uc2i2ko-anonymous-8081.exp.direct',
      }),
      'http://localhost:8000'
    );
  });

  await test('getApiSetupError explains Expo tunnel API misconfiguration', () => {
    const setupError = getApiSetupError({
      apiUrl: 'http://localhost:8000',
      expoDevHost: 'uc2i2ko-anonymous-8081.exp.direct',
    });

    assert.match(setupError.message, /Cannot reach the API through Expo tunnel host/);
    assert.match(setupError.message, /EXPO_PUBLIC_API_URL/);
  });

  await test('getApiSetupError reads Expo constants hostUri', () => {
    mockedExpoConstants.expoConfig = {
      hostUri: 'uc2i2ko-anonymous-8081.exp.direct',
    };

    try {
      const setupError = getApiSetupError({ apiUrl: 'http://localhost:8000' });

      assert.match(setupError.message, /Cannot reach the API through Expo tunnel host/);
    } finally {
      mockedExpoConstants = {};
    }
  });
})();
