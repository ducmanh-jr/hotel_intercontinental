import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'
import { featureBoundaries } from './tools/eslint/feature-boundaries.mjs'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    // Integration tests can exercise private implementations across feature seams.
    ignores: ['**/*.test.{ts,tsx}'],
    plugins: { architecture: { rules: { 'feature-boundaries': featureBoundaries } } },
    rules: { 'architecture/feature-boundaries': 'error' },
  },
])
