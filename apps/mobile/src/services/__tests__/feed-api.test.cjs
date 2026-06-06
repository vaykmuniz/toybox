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
  fetchFeed,
  getApiSetupError,
  getFeedEndpoint,
  resolveApiUrl,
} = require('../feed-api');

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

const sampleFeed = {
  items: [
    {
      id: 'feed-1',
      author: {
        id: 'user-1',
        name: 'Gabriel',
        handle: '@gabriel',
        avatar_url: 'http://localhost:8000/static/mocks/avatar.png',
      },
      media_url: 'http://localhost:8000/static/mocks/toy-1.png',
      caption: 'Newest pull found a spot on the shelf.',
      location: 'Sao Paulo, BR',
      posted_at: '2026-06-06T12:00:00.000Z',
    },
    {
      id: 'feed-2',
      author: {
        id: 'user-2',
        name: 'Lia',
        handle: '@lia_collects',
        avatar_url: 'http://localhost:8000/static/mocks/avatar.png',
      },
      media_url: 'http://localhost:8000/static/mocks/toy-5.png',
      caption: 'Desk buddy rotation for the week.',
      location: 'Curitiba, BR',
      posted_at: '2026-06-05T18:30:00.000Z',
    },
    {
      id: 'feed-3',
      author: {
        id: 'user-3',
        name: 'Nico',
        handle: '@tinyworlds',
        avatar_url: 'http://localhost:8000/static/mocks/avatar.png',
      },
      media_url: 'http://localhost:8000/static/mocks/toy-9.png',
      caption: 'Collection wall finally has room for one more.',
      location: 'Porto Alegre, BR',
      posted_at: '2026-06-04T21:15:00.000Z',
    },
  ],
};

(async () => {
  await test('getFeedEndpoint defaults to localhost for local runtimes', async () => {
    await withoutApiEnv(async () => {
      assert.equal(getFeedEndpoint(), 'http://localhost:8000/feed');
    });
  });

  await test('getFeedEndpoint uses EXPO_PUBLIC_API_URL and trims trailing slash', () => {
    assert.equal(
      getFeedEndpoint({ apiUrl: 'http://192.168.1.20:8000/' }),
      'http://192.168.1.20:8000/feed'
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

  await test('fetchFeed requests the FastAPI feed endpoint', async () => {
    const fetchCalls = [];

    await withFetch(
      async (url) => {
        fetchCalls.push(url);

        return {
          ok: true,
          status: 200,
          json: async () => sampleFeed,
        };
      },
      async () => {
        const feed = await fetchFeed({ apiUrl: 'http://localhost:8000' });

        assert.deepEqual(fetchCalls, ['http://localhost:8000/feed']);
        assert.equal(Array.isArray(feed.items), true);
        assert.deepEqual(
          feed.items.map((item) => item.id),
          ['feed-1', 'feed-2', 'feed-3']
        );
      }
    );
  });

  await test('fetchFeed returns complete feed item metadata and static image URLs', async () => {
    await withFetch(
      async () => ({
        ok: true,
        status: 200,
        json: async () => sampleFeed,
      }),
      async () => {
        const [item] = (await fetchFeed({ apiUrl: 'http://localhost:8000' })).items;

        assert.equal(item.author.name, 'Gabriel');
        assert.equal(item.author.handle, '@gabriel');
        assert.equal(item.caption, 'Newest pull found a spot on the shelf.');
        assert.equal(item.location, 'Sao Paulo, BR');
        assert.equal(item.posted_at, '2026-06-06T12:00:00.000Z');
        assert.equal(Object.hasOwn(item, 'stats'), false);
        assert.match(item.media_url, /\/static\/mocks\/toy-1\.png$/);
        assert.match(item.author.avatar_url, /\/static\/mocks\/avatar\.png$/);
      }
    );
  });

  await test('fetchFeed throws when the API responds with an error', async () => {
    await withFetch(
      async () => ({
        ok: false,
        status: 500,
        json: async () => ({}),
      }),
      async () => {
        await assert.rejects(
          () => fetchFeed({ apiUrl: 'http://localhost:8000' }),
          /Failed to fetch feed: 500/
        );
      }
    );
  });

  await test('fetchFeed includes the endpoint when the network request fails', async () => {
    await withFetch(
      async () => {
        throw new Error('connect ECONNREFUSED');
      },
      async () => {
        await assert.rejects(
          () => fetchFeed({ apiUrl: 'http://192.168.1.20:8000' }),
          /Failed to fetch feed from http:\/\/192\.168\.1\.20:8000\/feed: connect ECONNREFUSED/
        );
      }
    );
  });

  await test('fetchFeed fails before the request when Expo tunnel is the only host', async () => {
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
            () => fetchFeed(),
            /Cannot reach the API through Expo tunnel host/
          );
          assert.equal(fetchWasCalled, false);
        } finally {
          delete mockedExpoConstants.expoConfig;
        }
      }
    );
  });

  await test('fetchFeed times out when the network request hangs', async () => {
    await withFetch(
      async (_url, options) =>
        new Promise((_resolve, reject) => {
          options.signal.addEventListener('abort', () => {
            reject(new Error('aborted'));
          });
        }),
      async () => {
        await assert.rejects(
          () => fetchFeed({ apiUrl: 'http://192.168.1.20:8000', timeoutMs: 1 }),
          /Failed to fetch feed from http:\/\/192\.168\.1\.20:8000\/feed: timed out after 1ms/
        );
      }
    );
  });
})();
