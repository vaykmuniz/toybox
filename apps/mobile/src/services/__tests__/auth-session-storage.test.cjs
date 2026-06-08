const assert = require('node:assert/strict');
const Module = require('node:module');
const fs = require('node:fs');
const path = require('node:path');

require('sucrase/register/ts');

const appRoot = path.resolve(__dirname, '../../..');
const secureStore = new Map();
const originalLoad = Module._load;
const originalResolveFilename = Module._resolveFilename;

Module._load = function load(request, parent, isMain) {
  if (request === 'expo-secure-store') {
    return {
      deleteItemAsync: async (key) => {
        secureStore.delete(key);
      },
      getItemAsync: async (key) => secureStore.get(key) ?? null,
      setItemAsync: async (key, value) => {
        secureStore.set(key, value);
      },
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
  clearStoredAuthSession,
  getStoredAuthSession,
  storeAuthSession,
} = require('../auth-session-storage');

const sampleSession = {
  id: 'user-1',
  email: 'user@example.com',
  username: 'collector',
  name: 'Toy Collector',
  access_token: 'signed.jwt.token',
  token_type: 'bearer',
  expires_at: '2026-06-07T13:00:00',
};

const test = async (name, fn) => {
  secureStore.clear();

  try {
    await fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
};

(async () => {
  await test('stores and restores a valid auth session', async () => {
    await storeAuthSession(sampleSession);

    assert.deepEqual(await getStoredAuthSession(), sampleSession);
  });

  await test('returns null when no auth session is stored', async () => {
    assert.equal(await getStoredAuthSession(), null);
  });

  await test('clears corrupted stored auth session data', async () => {
    secureStore.set('toybox.authSession', '{');

    assert.equal(await getStoredAuthSession(), null);
    assert.equal(secureStore.has('toybox.authSession'), false);
  });

  await test('clears invalid stored auth session shapes', async () => {
    secureStore.set(
      'toybox.authSession',
      JSON.stringify({
        ...sampleSession,
        token_type: 'basic',
      })
    );

    assert.equal(await getStoredAuthSession(), null);
    assert.equal(secureStore.has('toybox.authSession'), false);
  });

  await test('deletes stored auth sessions', async () => {
    await storeAuthSession(sampleSession);
    await clearStoredAuthSession();

    assert.equal(await getStoredAuthSession(), null);
  });
})();
