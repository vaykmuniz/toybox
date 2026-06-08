/* global __dirname */

const assert = require('node:assert/strict');
const Module = require('node:module');
const fs = require('node:fs');
const path = require('node:path');

require('sucrase/register/ts');
require('sucrase/register/tsx');

require.extensions['.png'] = (module, filename) => {
  module.exports = filename;
};

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

const {
  getLoginEndpoint,
  getRegisterEndpoint,
  login,
  register,
} = require('../auth-api');

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

const sampleUser = {
  id: 'user-1',
  email: 'user@example.com',
  username: 'collector',
  name: 'Toy Collector',
};

const sampleLoginResponse = {
  ...sampleUser,
  access_token: 'signed.jwt.token',
  token_type: 'bearer',
  expires_at: '2026-06-07T13:00:00',
};

const loginPayload = {
  username: 'collector',
  password: 'secret',
};

const registerPayload = {
  email: 'user@example.com',
  username: 'collector',
  name: 'Toy Collector',
  password: 'secret',
};

(async () => {
  await test('auth endpoints default to localhost for local runtimes', async () => {
    await withoutApiEnv(async () => {
      assert.equal(getLoginEndpoint(), 'http://localhost:8000/login');
      assert.equal(getRegisterEndpoint(), 'http://localhost:8000/register');
    });
  });

  await test('auth endpoints use EXPO_PUBLIC_API_URL and trim trailing slash', () => {
    assert.equal(
      getLoginEndpoint({ apiUrl: 'http://192.168.1.20:8000/' }),
      'http://192.168.1.20:8000/login'
    );
    assert.equal(
      getRegisterEndpoint({ apiUrl: 'http://192.168.1.20:8000/' }),
      'http://192.168.1.20:8000/register'
    );
  });

  await test('login posts credentials to the FastAPI login endpoint', async () => {
    const fetchCalls = [];

    await withFetch(
      async (url, options) => {
        fetchCalls.push({ body: JSON.parse(options.body), method: options.method, url });

        return {
          ok: true,
          status: 200,
          json: async () => sampleLoginResponse,
        };
      },
      async () => {
        const user = await login({
          apiUrl: 'http://localhost:8000',
          payload: loginPayload,
        });

        assert.deepEqual(fetchCalls, [
          {
            body: loginPayload,
            method: 'POST',
            url: 'http://localhost:8000/login',
          },
        ]);
        assert.equal(user.username, 'collector');
        assert.equal(user.access_token, 'signed.jwt.token');
        assert.equal(user.token_type, 'bearer');
        assert.equal(user.expires_at, '2026-06-07T13:00:00');
      }
    );
  });

  await test('register posts account data to the FastAPI register endpoint', async () => {
    const fetchCalls = [];

    await withFetch(
      async (url, options) => {
        fetchCalls.push({
          body: JSON.parse(options.body),
          contentType: options.headers['Content-Type'],
          method: options.method,
          url,
        });

        return {
          ok: true,
          status: 201,
          json: async () => ({
            ...sampleUser,
            token_expires_at: '2026-06-07T13:00:00',
          }),
        };
      },
      async () => {
        const user = await register({
          apiUrl: 'http://localhost:8000',
          payload: registerPayload,
        });

        assert.deepEqual(fetchCalls, [
          {
            body: registerPayload,
            contentType: 'application/json',
            method: 'POST',
            url: 'http://localhost:8000/register',
          },
        ]);
        assert.equal(user.token_expires_at, '2026-06-07T13:00:00');
      }
    );
  });

  await test('login includes API detail when credentials are rejected', async () => {
    await withFetch(
      async () => ({
        ok: false,
        status: 401,
        json: async () => ({ detail: 'Invalid username or password.' }),
      }),
      async () => {
        await assert.rejects(
          () => login({ apiUrl: 'http://localhost:8000', payload: loginPayload }),
          /Failed to login: 401: Invalid username or password\./
        );
      }
    );
  });

  await test('register includes API detail when the account conflicts', async () => {
    await withFetch(
      async () => ({
        ok: false,
        status: 409,
        json: async () => ({ detail: 'Username is already used.' }),
      }),
      async () => {
        await assert.rejects(
          () => register({ apiUrl: 'http://localhost:8000', payload: registerPayload }),
          /Failed to register: 409: Username is already used\./
        );
      }
    );
  });

  await test('login includes the endpoint when the network request fails', async () => {
    await withFetch(
      async () => {
        throw new Error('connect ECONNREFUSED');
      },
      async () => {
        await assert.rejects(
          () => login({ apiUrl: 'http://192.168.1.20:8000', payload: loginPayload }),
          /Failed to login through http:\/\/192\.168\.1\.20:8000\/login: connect ECONNREFUSED/
        );
      }
    );
  });

  await test('register fails before the request when Expo tunnel is the only host', async () => {
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
            () => register({ payload: registerPayload }),
            /Cannot reach the API through Expo tunnel host/
          );
          assert.equal(fetchWasCalled, false);
        } finally {
          delete mockedExpoConstants.expoConfig;
        }
      }
    );
  });

  await test('login times out when the network request hangs', async () => {
    await withFetch(
      async (_url, options) =>
        new Promise((_resolve, reject) => {
          options.signal.addEventListener('abort', () => {
            reject(new Error('aborted'));
          });
        }),
      async () => {
        await assert.rejects(
          () =>
            login({
              apiUrl: 'http://192.168.1.20:8000',
              payload: loginPayload,
              timeoutMs: 1,
            }),
          /Failed to login through http:\/\/192\.168\.1\.20:8000\/login: timed out after 1ms/
        );
      }
    );
  });
})();
