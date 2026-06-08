/* global __dirname */

const assert = require('node:assert/strict');
const Module = require('node:module');
const fs = require('node:fs');
const path = require('node:path');
const React = require('react');

global.React = React;

const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const ignoreOutdatedJsxTransformWarning = (message) =>
  typeof message === 'string' && message.includes('outdated JSX transform');

console.error = (...args) => {
  if (ignoreOutdatedJsxTransformWarning(args[0])) {
    return;
  }

  originalConsoleError(...args);
};

console.warn = (...args) => {
  if (ignoreOutdatedJsxTransformWarning(args[0])) {
    return;
  }

  originalConsoleWarn(...args);
};

require('sucrase/register/ts');
require('sucrase/register/tsx');

const appRoot = path.resolve(__dirname, '../../../..');
const originalLoad = Module._load;
const originalResolveFilename = Module._resolveFilename;

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

Module._load = function load(request, parent, isMain) {
  if (request === 'expo-image') {
    return {
      Image: (props) => React.createElement('ExpoImage', props),
    };
  }

  if (request === 'react-native') {
    return {
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

  return originalLoad.call(this, request, parent, isMain);
};

const Avatar = require('../avatar/avatar.component').default;
const {
  avatarBaseClassName,
  avatarImageClassName,
  avatarSizeClassNames,
  avatarSizeStyles,
} = require('../avatar/avatar.styles');
const Card = require('../card/card.component').default;
const { cardBaseClassName } = require('../card/card.styles');
const CustomImage = require('../custom-image/custom-image.component').default;
const { customImageBaseClassName } = require('../custom-image/custom-image.styles');
const Pill = require('../pill/pill.component').default;
const { ProfileToyGrid } = require('../../views/profile/profile-toy-grid.component');
const {
  pillBaseClassName,
  pillTextBaseClassName,
  pillTextVariantClassNames,
  pillVariantClassNames,
} = require('../pill/pill.styles');
const CustomText = require('../text/text.component').default;
const { textVariants } = require('../text/text.styles');

const getOnlyChild = (element) => React.Children.only(element.props.children);

const collectTextChildren = (element, result = []) => {
  if (!element || typeof element !== 'object') {
    return result;
  }

  if (typeof element.type === 'function') {
    collectTextChildren(element.type(element.props), result);
    return result;
  }

  if (element.type === 'Text') {
    result.push(React.Children.toArray(element.props.children).join(''));
  }

  React.Children.forEach(element.props?.children, (child) => {
    collectTextChildren(child, result);
  });

  return result;
};

const classNameIncludes = (actual, expected) => {
  for (const token of expected.split(' ')) {
    assert.match(actual, new RegExp(`(^| )${token.replace('/', '\\/')}( |$)`));
  }
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

test('Card applies base styles and caller className overrides', () => {
  const element = Card({ children: 'content', className: 'p-0', testID: 'card' });

  assert.equal(element.props.testID, 'card');
  assert.equal(element.props.children, 'content');
  classNameIncludes(element.props.className, cardBaseClassName);
  classNameIncludes(element.props.className, 'p-0');
});

test('CustomText applies the requested variant style', () => {
  const element = CustomText({ children: 'Title', variant: 'lg' });

  assert.equal(element.props.children, 'Title');
  assert.equal(element.props.className, textVariants.lg);
});

test('CustomText exposes auth screen variants', () => {
  const element = CustomText({ children: 'Toybox', variant: 'authBrand' });

  assert.equal(element.props.children, 'Toybox');
  assert.equal(element.props.className, textVariants.authBrand);
});

test('CustomText falls back to xl when variant is unknown at runtime', () => {
  const element = CustomText({ children: 'Title', variant: 'unknown' });

  assert.equal(element.props.className, textVariants.xl);
});

test('Pill applies base styles, variant styles, text styles, and label', () => {
  const element = Pill({ label: 'RARE', variant: 'emerald', className: 'self-start' });
  const text = getOnlyChild(element);

  classNameIncludes(element.props.className, pillBaseClassName);
  classNameIncludes(element.props.className, pillVariantClassNames.emerald);
  classNameIncludes(element.props.className, 'self-start');
  classNameIncludes(text.props.className, pillTextBaseClassName);
  classNameIncludes(text.props.className, pillTextVariantClassNames.emerald);
  assert.equal(text.props.children, 'RARE');
});

test('Pill defaults to the pink variant', () => {
  const element = Pill({ label: 'FIRE' });
  const text = getOnlyChild(element);

  classNameIncludes(element.props.className, pillVariantClassNames.pink);
  classNameIncludes(text.props.className, pillTextVariantClassNames.pink);
});

test('CustomImage fills its parent by default and preserves image props', () => {
  const source = { uri: 'https://example.test/image.png' };
  const style = { opacity: 0.5 };
  const element = CustomImage({
    accessibilityLabel: 'Toy image',
    className: 'rounded-full',
    source,
    style,
  });

  classNameIncludes(element.props.className, customImageBaseClassName);
  classNameIncludes(element.props.className, 'rounded-full');
  assert.equal(element.props.contentFit, 'cover');
  assert.equal(element.props.source, source);
  assert.equal(element.props.accessibilityLabel, 'Toy image');
  assert.deepEqual(element.props.style[1], style);
});

test('CustomImage can opt out of fill styles', () => {
  const style = { height: 24, width: 24 };
  const element = CustomImage({ fill: false, source: 1, style });

  assert.deepEqual(element.props.style, style);
});

test('Avatar applies every size variant to wrapper classes and native styles', () => {
  for (const size of ['xs', 'sm', 'md', 'lg']) {
    const element = Avatar({ source: 1, size });

    classNameIncludes(element.props.className, avatarBaseClassName);
    classNameIncludes(element.props.className, avatarSizeClassNames[size]);
    classNameIncludes(element.props.className, 'shrink-0');
    assert.deepEqual(element.props.style, avatarSizeStyles[size]);
  }
});

test('Avatar passes image props to CustomImage and keeps rounded image styles', () => {
  const source = { uri: 'https://example.test/avatar.png' };
  const element = Avatar({
    accessibilityLabel: 'Profile photo',
    className: 'border-0',
    contentFit: 'contain',
    source,
    style: { opacity: 0.75 },
  });
  const image = getOnlyChild(element);

  classNameIncludes(element.props.className, 'border-0');
  classNameIncludes(image.props.className, avatarImageClassName);
  assert.equal(image.props.contentFit, 'contain');
  assert.equal(image.props.source, source);
  assert.equal(image.props.accessibilityLabel, 'Profile photo');
  assert.deepEqual(image.props.style, { opacity: 0.75 });
});

test('ProfileToyGrid renders toy captions visibly', () => {
  const element = ProfileToyGrid({
    toys: [
      {
        id: 'toy-1',
        media_url: { uri: 'https://example.test/robot.jpg' },
        caption: 'Desk robot',
      },
    ],
  });

  assert.deepEqual(collectTextChildren(element), ['Toy grid', '1 posts', 'Desk robot']);
});
