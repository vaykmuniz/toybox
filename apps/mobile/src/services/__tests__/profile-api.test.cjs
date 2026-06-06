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

const { fetchProfile, getProfileEndpoint } = require('../profile-api');

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

const sampleProfile = {
  id: '1',
  name: 'Gabriel',
  handle: '@gabriel',
  avatar_url: 'http://localhost:8000/static/mocks/avatar.png',
  bio: 'Toy collector, daily discoveries, and tiny worlds from Toybox.',
  stats: {
    posts: 9,
    followers: 1248,
    following: 312,
  },
  badges: [
    {
      description: 'Pega um bixo por dia',
      text: 'FIRE',
    },
    {
      description: 'Perfil em destaque',
      text: 'STAR',
    },
    {
      description: 'Colecao crescendo',
      text: 'RARE',
    },
  ],
  toys: [
    {
      id: 'toy-1',
      media_url: 'http://localhost:8000/static/mocks/toy-1.png',
      caption: 'Newest catch',
    },
    {
      id: 'toy-2',
      media_url: 'http://localhost:8000/static/mocks/toy-2.png',
      caption: 'Shelf favorite',
    },
  ],
};

(async () => {
  await test('getProfileEndpoint defaults to localhost for local runtimes', async () => {
    await withoutApiEnv(async () => {
      assert.equal(getProfileEndpoint(), 'http://localhost:8000/profile');
    });
  });

  await test('getProfileEndpoint uses EXPO_PUBLIC_API_URL and trims trailing slash', () => {
    assert.equal(
      getProfileEndpoint({ apiUrl: 'http://192.168.1.20:8000/' }),
      'http://192.168.1.20:8000/profile'
    );
  });

  await test('fetchProfile requests the FastAPI profile endpoint', async () => {
    const fetchCalls = [];

    await withFetch(
      async (url) => {
        fetchCalls.push(url);

        return {
          ok: true,
          status: 200,
          json: async () => sampleProfile,
        };
      },
      async () => {
        const profile = await fetchProfile({ apiUrl: 'http://localhost:8000' });

        assert.deepEqual(fetchCalls, ['http://localhost:8000/profile']);
        assert.equal(profile.name, 'Gabriel');
        assert.equal(profile.stats.posts, 9);
        assert.deepEqual(
          profile.toys.map((toy) => toy.id),
          ['toy-1', 'toy-2']
        );
      }
    );
  });

  await test('fetchProfile returns complete profile metadata and static image URLs', async () => {
    await withFetch(
      async () => ({
        ok: true,
        status: 200,
        json: async () => sampleProfile,
      }),
      async () => {
        const profile = await fetchProfile({ apiUrl: 'http://localhost:8000' });

        assert.equal(profile.handle, '@gabriel');
        assert.equal(profile.bio, 'Toy collector, daily discoveries, and tiny worlds from Toybox.');
        assert.equal(profile.badges[0].text, 'FIRE');
        assert.match(profile.avatar_url, /\/static\/mocks\/avatar\.png$/);
        assert.match(profile.toys[0].media_url, /\/static\/mocks\/toy-1\.png$/);
      }
    );
  });

  await test('fetchProfile throws when the API responds with an error', async () => {
    await withFetch(
      async () => ({
        ok: false,
        status: 500,
        json: async () => ({}),
      }),
      async () => {
        await assert.rejects(
          () => fetchProfile({ apiUrl: 'http://localhost:8000' }),
          /Failed to fetch profile: 500/
        );
      }
    );
  });

  await test('fetchProfile includes the endpoint when the network request fails', async () => {
    await withFetch(
      async () => {
        throw new Error('connect ECONNREFUSED');
      },
      async () => {
        await assert.rejects(
          () => fetchProfile({ apiUrl: 'http://192.168.1.20:8000' }),
          /Failed to fetch profile from http:\/\/192\.168\.1\.20:8000\/profile: connect ECONNREFUSED/
        );
      }
    );
  });

  await test('fetchProfile fails before the request when Expo tunnel is the only host', async () => {
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
            () => fetchProfile(),
            /Cannot reach the API through Expo tunnel host/
          );
          assert.equal(fetchWasCalled, false);
        } finally {
          delete mockedExpoConstants.expoConfig;
        }
      }
    );
  });

  await test('fetchProfile times out when the network request hangs', async () => {
    await withFetch(
      async (_url, options) =>
        new Promise((_resolve, reject) => {
          options.signal.addEventListener('abort', () => {
            reject(new Error('aborted'));
          });
        }),
      async () => {
        await assert.rejects(
          () => fetchProfile({ apiUrl: 'http://192.168.1.20:8000', timeoutMs: 1 }),
          /Failed to fetch profile from http:\/\/192\.168\.1\.20:8000\/profile: timed out after 1ms/
        );
      }
    );
  });
})();
