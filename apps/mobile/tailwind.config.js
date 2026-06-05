/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        ink: '#111111',
        toybox: {
          blue: '#5ba7ff',
          pink: '#ff74b8',
        },
      },
      fontFamily: {
        display: [
          'Spline Sans',
          'Inter',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
          'Apple Color Emoji',
          'Segoe UI Emoji',
          'Segoe UI Symbol',
          'Noto Color Emoji',
        ],
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'Liberation Mono',
          'Courier New',
          'monospace',
        ],
        rounded: ['SF Pro Rounded', 'Hiragino Maru Gothic ProN', 'Meiryo', 'MS PGothic', 'sans-serif'],
        serif: ['Georgia', 'Times New Roman', 'serif'],
      },
      maxWidth: {
        content: '800px',
      },
    },
  },
  plugins: [],
};
