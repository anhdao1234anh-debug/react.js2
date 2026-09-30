// ESLint flat config dùng chung cho toàn bộ monorepo (backend + frontend + scripts).
// Prettier lo phần format -> eslint-config-prettier tắt các rule xung đột về style.
import js from '@eslint/js';
import vitest from '@vitest/eslint-plugin';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';

export default defineConfig([
  globalIgnores(['**/node_modules', '**/dist', '**/coverage', '.backup']),

  // ----- Rule chung cho mọi file JS -----
  {
    files: ['**/*.{js,jsx,mjs}'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'no-throw-literal': 'error',
      'prefer-template': 'warn',
    },
  },

  // ----- Node: backend, scripts, file config -----
  {
    files: ['backend/**/*.js', 'scripts/**/*.js', '*.config.js', 'frontend/*.config.js'],
    languageOptions: { globals: globals.node },
  },
  {
    // Backend dùng logger (pino), không dùng console trực tiếp
    files: ['backend/src/**/*.js'],
    ignores: ['backend/src/scripts/**', 'backend/src/config/env.js'],
    rules: { 'no-console': 'error' },
  },

  // ----- Frontend React -----
  {
    files: ['frontend/src/**/*.{js,jsx}'],
    extends: [reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    // File khai báo route / provider / test export cả component lẫn giá trị khác
    files: ['frontend/src/routes/**', 'frontend/src/test/**', 'frontend/src/**/*.test.{js,jsx}'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },

  // ----- Test (Vitest) -----
  {
    files: ['**/*.test.{js,jsx}', 'backend/tests/**/*.js', 'frontend/src/test/**/*.{js,jsx}'],
    plugins: { vitest },
    rules: {
      ...vitest.configs.recommended.rules,
      'vitest/expect-expect': ['error', { assertFunctionNames: ['expect', 'request.**.expect'] }],
    },
    languageOptions: { globals: { ...globals.node } },
  },

  prettier,
]);
