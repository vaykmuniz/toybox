const assert = require('node:assert/strict');
const Module = require('node:module');
const fs = require('node:fs');
const path = require('node:path');
const React = require('react');

global.React = React;

require('sucrase/register/ts');
require('sucrase/register/tsx');

const appRoot = path.resolve(__dirname, '../../../..');
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

  if (request === 'expo-linear-gradient') {
    return {
      LinearGradient: (props) => React.createElement('LinearGradient', props),
    };
  }

  if (request === 'expo-constants') {
    return {
      __esModule: true,
      default: {},
    };
  }

  if (request === 'expo-secure-store') {
    return {
      deleteItemAsync: async () => {},
      getItemAsync: async () => null,
      setItemAsync: async () => {},
    };
  }

  if (request === '@/hooks/use-auth-session.hook') {
    return {
      useAuthSession: () => ({
        clearSession: async () => {},
        isLoading: false,
        user: sampleUser,
      }),
    };
  }

  if (request === '@/hooks/use-get-profile.hook') {
    return {
      useGetProfile: () => ({
        error: null,
        isLoading: false,
        profile: sampleProfile,
        refetch: async () => {},
      }),
    };
  }

  if (request === 'react-native') {
    return {
      ActivityIndicator: (props) => React.createElement('ActivityIndicator', props),
      Pressable: (props) => React.createElement('Pressable', props),
      ScrollView: (props) => React.createElement('ScrollView', props),
      StyleSheet: {
        absoluteFill: {
          bottom: 0,
          left: 0,
          position: 'absolute',
          right: 0,
          top: 0,
        },
      },
      Text: (props) => React.createElement('Text', props),
      View: (props) => React.createElement('View', props),
    };
  }

  if (request === 'expo-image') {
    return {
      Image: (props) => React.createElement('ExpoImage', props),
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

const { applyUserToProfile, default: ProfileScreen } = require('../profile');

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
  badges: [],
  toys: [
    {
      id: 'toy-1',
      media_url: 'http://localhost:8000/static/mocks/toy-1.png',
      caption: 'Newest catch',
    },
  ],
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

const getOnlyChild = (element) => React.Children.only(element.props.children);

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

const collectText = (element, result = []) => {
  if (!element || typeof element !== 'object') {
    return result;
  }

  if (typeof element.type === 'function') {
    collectText(element.type(element.props), result);
    return result;
  }

  if (element.type === 'Text') {
    result.push(React.Children.toArray(element.props.children).join(''));
  }

  React.Children.forEach(element.props?.children, (child) => {
    collectText(child, result);
  });

  return result;
};

const findPressableByText = (element, text) =>
  collectPressables(element).find((pressable) => collectText(pressable).includes(text));

test('applyUserToProfile uses persisted user identity and keeps collection metadata', () => {
  const profile = applyUserToProfile(sampleProfile, sampleUser);

  assert.equal(profile.id, 'user-1');
  assert.equal(profile.name, 'Toy Collector');
  assert.equal(profile.handle, '@collector');
  assert.equal(profile.stats, sampleProfile.stats);
  assert.equal(profile.toys, sampleProfile.toys);
  assert.equal(profile.avatar_url, sampleProfile.avatar_url);
});

test('applyUserToProfile falls back to API profile identity without a user', () => {
  assert.equal(applyUserToProfile(sampleProfile, null), sampleProfile);
});

test('ProfileScreen routes upload action to upload screen', () => {
  routerCalls.length = 0;

  const screen = ProfileScreen();
  const uploadButton = findPressableByText(getOnlyChild(screen), 'Upload');

  assert.ok(uploadButton);
  uploadButton.props.onPress();

  assert.deepEqual(routerCalls, [['push', '/upload']]);
});
