const assert = require('node:assert/strict');
const Module = require('node:module');
const fs = require('node:fs');
const path = require('node:path');
const React = require('react');

global.React = React;
React.useState = (initialValue) => [initialValue, () => {}];

require('sucrase/register/ts');
require('sucrase/register/tsx');

const appRoot = path.resolve(__dirname, '../../..');
const originalLoad = Module._load;
const originalResolveFilename = Module._resolveFilename;
const uploadAvatarCalls = [];
const refetchCalls = [];
const clearSessionCalls = [];
const routerCalls = [];

Module._load = function load(request, parent, isMain) {
  if (request === 'expo-router') {
    return {
      router: {
        back: () => routerCalls.push(['back']),
        replace: (path) => routerCalls.push(['replace', path]),
      },
    };
  }

  if (request === 'expo-linear-gradient') {
    return {
      LinearGradient: (props) => React.createElement('LinearGradient', props),
    };
  }

  if (request === 'expo-image') {
    return {
      Image: (props) => React.createElement('ExpoImage', props),
    };
  }

  if (request === 'expo-image-picker') {
    return {
      launchImageLibraryAsync: async () => ({
        canceled: false,
        assets: [{ uri: 'file:///avatar.png', fileName: 'avatar.png', mimeType: 'image/png' }],
      }),
    };
  }

  if (request === 'react-native-safe-area-context') {
    return {
      SafeAreaView: (props) => React.createElement('SafeAreaView', props),
    };
  }

  if (request === 'react-native') {
    return {
      ActivityIndicator: (props) => React.createElement('ActivityIndicator', props),
      Platform: {
        OS: 'web',
      },
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

  if (request === '@/hooks/use-auth-session.hook') {
    return {
      useAuthSession: () => ({
        clearSession: async () => {
          clearSessionCalls.push('session');
        },
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
        refetch: async () => {
          refetchCalls.push('profile');
        },
      }),
    };
  }

  if (request === '@/services/profile-api') {
    return {
      uploadAvatar: async (options) => {
        uploadAvatarCalls.push(options);
        return sampleProfile;
      },
    };
  }

  if (request === '@/services/toy-upload-image') {
    return {
      preparePickedToyImage: async () => ({
        uri: 'file:///prepared-avatar.png',
        fileName: 'prepared-avatar.png',
        contentType: 'image/png',
        file: 'web-file',
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

const { default: SettingsScreen } = require('../settings');

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

const test = async (name, fn) => {
  try {
    await fn();
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

test('SettingsScreen renders profile settings', () => {
  const screen = SettingsScreen();
  const text = collectText(getOnlyChild(screen));

  assert.ok(text.includes('Settings'));
  assert.ok(text.includes('Toy Collector'));
  assert.ok(text.includes('@collector'));
  assert.ok(text.includes('Change avatar'));
  assert.ok(text.includes('Log out'));
});

test('SettingsScreen uploads a changed avatar', async () => {
  uploadAvatarCalls.length = 0;
  refetchCalls.length = 0;

  const screen = SettingsScreen();
  const changeAvatarButton = findPressableByText(getOnlyChild(screen), 'Change avatar');

  assert.ok(changeAvatarButton);
  await changeAvatarButton.props.onPress();

  assert.deepEqual(uploadAvatarCalls, [
    {
      accessToken: 'signed.jwt.token',
      fileName: 'prepared-avatar.png',
      contentType: 'image/png',
      file: 'web-file',
    },
  ]);
  assert.deepEqual(refetchCalls, ['profile']);
});

test('SettingsScreen logs out from the bottom action', async () => {
  clearSessionCalls.length = 0;
  routerCalls.length = 0;

  const screen = SettingsScreen();
  const logoutButton = findPressableByText(getOnlyChild(screen), 'Log out');

  assert.ok(logoutButton);
  await logoutButton.props.onPress();

  assert.deepEqual(clearSessionCalls, ['session']);
  assert.deepEqual(routerCalls, [['replace', '/']]);
});
