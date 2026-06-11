const assert = require('node:assert/strict');
const Module = require('node:module');
const fs = require('node:fs');
const path = require('node:path');
const React = require('react');

global.React = React;

require('sucrase/register/ts');
require('sucrase/register/tsx');

const appRoot = path.resolve(__dirname, '../../../../..');
const originalLoad = Module._load;
const originalResolveFilename = Module._resolveFilename;
const routerCalls = [];

Module._load = function load(request, parent, isMain) {
  if (request === 'expo-router') {
    return {
      router: {
        push: (path) => routerCalls.push(['push', path]),
        replace: (path) => routerCalls.push(['replace', path]),
      },
    };
  }

  if (request === 'react-native') {
    return {
      Pressable: (props) => React.createElement('Pressable', props),
      Text: (props) => React.createElement('Text', props),
      View: (props) => React.createElement('View', props),
    };
  }

  if (request === 'expo-image') {
    return {
      Image: (props) => React.createElement('ExpoImage', props),
    };
  }

  if (request === '@/hooks/use-auth-session.hook') {
    return {
      useAuthSession: () => ({
        clearSession: async () => {},
        user: sampleUser,
      }),
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

const { ProfileHeaderCard } = require('../profile-header-card.component');

const sampleProfile = {
  id: 'user-1',
  name: 'Toy Collector',
  handle: '@collector',
  avatar_url: null,
  toys: [],
};

const sampleUser = {
  id: 'user-1',
  email: 'user@example.com',
  username: 'collector',
  name: 'Toy Collector',
  access_token: 'signed.jwt.token',
  token_type: 'bearer',
  expires_at: '2026-06-07T13:00:00',
};

const test = (name, fn) => {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
};

const collectPressables = (element, result = []) => {
  if (!element || typeof element !== 'object') {
    return result;
  }

  if (typeof element.type === 'function') {
    collectPressables(element.type(element.props), result);
    return result;
  }

  if (element.type === 'Pressable') {
    result.push(element);
  }

  React.Children.forEach(element.props?.children, (child) => {
    collectPressables(child, result);
  });

  return result;
};

test('ProfileHeaderCard routes avatar press to settings', () => {
  routerCalls.length = 0;

  const card = ProfileHeaderCard({ profile: sampleProfile });
  const avatarButton = collectPressables(card).find(
    (pressable) => pressable.props.accessibilityLabel === 'Open Toy Collector settings'
  );

  assert.ok(avatarButton);
  avatarButton.props.onPress();

  assert.deepEqual(routerCalls, [['push', '/settings']]);
});
