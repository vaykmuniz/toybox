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

Module._load = function load(request, parent, isMain) {
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

  if (request === '@/hooks/use-get-recent-catches.hook') {
    return {
      useGetRecentCatches: () => ({
        catches: sampleCatches,
        error: null,
        isLoading: false,
        refetch: async () => {},
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

const { default: OddsScreen } = require('../odds');

const sampleCatches = [
  {
    id: 'toy-1',
    name: 'Desk robot',
    media_url: 'https://uploads.example.com/toys/robot.png?signature=test',
    tries: 7,
    created_at: '2026-06-11T15:25:00',
    owner: {
      id: 'user-1',
      name: 'Toy Collector',
      handle: '@collector',
      avatar_url: null,
    },
  },
];

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

test('OddsScreen renders last-hour recent catches', () => {
  const screen = OddsScreen();
  const text = collectText(getOnlyChild(screen));

  assert.ok(text.includes('Desk robot'));
  assert.ok(text.includes('Toy Collector'));
  assert.ok(text.includes('@collector'));
  assert.ok(text.includes('7 tries'));
});

test('OddsScreen does not render a manual refresh button', () => {
  const screen = OddsScreen();
  const text = collectText(getOnlyChild(screen));

  assert.equal(text.includes('Refresh'), false);
  assert.equal(text.includes('Refreshing'), false);
});
