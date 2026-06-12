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
  fetchRecentCatches,
  getRecentCatchesEndpoint,
} = require('../odds-api');

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

(async () => {
  await test('recent catches endpoint uses the configured API URL', () => {
    assert.equal(
      getRecentCatchesEndpoint({ apiUrl: 'http://192.168.1.20:8000/' }),
      'http://192.168.1.20:8000/odds/recent-catches'
    );
  });

  await test('fetchRecentCatches requests recent catches with auth token', async () => {
    const fetchCalls = [];

    await withFetch(
      async (url, options) => {
        fetchCalls.push({ url, options });

        return {
          ok: true,
          status: 200,
          json: async () => [
            {
              id: 'toy-1',
              description: 'Desk robot',
              media_url: 'https://uploads.example.com/toys/robot.png?signature=test',
              tries: 7,
              cost_per_try: 250,
              caught: true,
              created_at: '2026-06-11T15:25:00',
              owner: {
                id: 'user-1',
                name: 'Toy Collector',
                handle: '@collector',
                avatar_url: null,
              },
            },
          ],
        };
      },
      async () => {
        const catches = await fetchRecentCatches({
          accessToken: 'signed.jwt.token',
          apiUrl: 'http://localhost:8000',
        });

        assert.equal(fetchCalls[0].url, 'http://localhost:8000/odds/recent-catches');
        assert.deepEqual(fetchCalls[0].options.headers, {
          Authorization: 'Bearer signed.jwt.token',
        });
        assert.equal(catches[0].description, 'Desk robot');
        assert.equal(catches[0].cost_per_try, 250);
        assert.equal(catches[0].owner.handle, '@collector');
      }
    );
  });

  await test('fetchRecentCatches throws when the API responds with an error', async () => {
    await withFetch(
      async () => ({
        ok: false,
        status: 500,
        json: async () => ({}),
      }),
      async () => {
        await assert.rejects(
          () => fetchRecentCatches({ apiUrl: 'http://localhost:8000' }),
          /Failed to fetch recent catches: 500/
        );
      }
    );
  });

  await test('fetchRecentCatches fails before request when Expo tunnel is the only host', async () => {
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
            () => fetchRecentCatches(),
            /Cannot reach the API through Expo tunnel host/
          );
          assert.equal(fetchWasCalled, false);
        } finally {
          delete mockedExpoConstants.expoConfig;
        }
      }
    );
  });
})();
