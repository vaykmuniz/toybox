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
const originalResolveFilename = Module._resolveFilename;

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

const { useGetFeed } = require('../use-get-feed.hook');

const test = (name, fn) => {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
};

test('useGetFeed returns a stable mocked feed collection', () => {
  const feed = useGetFeed();

  assert.equal(Array.isArray(feed.items), true);
  assert.equal(feed.items.length, 3);
  assert.deepEqual(
    feed.items.map((item) => item.id),
    ['feed-1', 'feed-2', 'feed-3']
  );
});

test('useGetFeed returns complete feed item metadata', () => {
  const [item] = useGetFeed().items;

  assert.equal(item.author.name, 'Gabriel');
  assert.equal(item.author.handle, '@gabriel');
  assert.equal(item.caption, 'Newest pull found a spot on the shelf.');
  assert.equal(item.location, 'Sao Paulo, BR');
  assert.equal(item.posted_at, '2026-06-06T12:00:00.000Z');
  assert.equal(Object.hasOwn(item, 'stats'), false);
});

test('useGetFeed points feed media and avatars at bundled mock assets', () => {
  const feed = useGetFeed();

  assert.match(feed.items[0].media_url, /assets\/images\/mocks\/toy-1\.png$/);
  assert.match(feed.items[1].media_url, /assets\/images\/mocks\/toy-5\.png$/);
  assert.match(feed.items[2].media_url, /assets\/images\/mocks\/toy-9\.png$/);

  for (const item of feed.items) {
    assert.match(item.author.avatar_url, /assets\/images\/mocks\/avatar\.png$/);
  }
});
