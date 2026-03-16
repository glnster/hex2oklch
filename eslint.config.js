import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      quotes: ['error', 'single'],
      'no-unused-vars': 'off',
    },
  },
  {
    files: ['test/visual/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
  },
  {
    ignores: ['coverage/**', 'playwright-report/**', 'test-results/**'],
  },
];
