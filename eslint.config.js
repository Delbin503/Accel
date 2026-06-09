import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

// Design-system guardrail: ban arbitrary text-[Npx] sizes — use the type scale
// tokens (text-2xs … text-4xl) defined in src/index.css instead.
const noArbitraryTextSize = [
  'error',
  {
    selector: 'Literal[value=/text-\\[[0-9.]+px\\]/]',
    message:
      'Use a type-scale token (text-3xs, text-2xs, text-xs, text-sm, text-base, text-md, text-lg, text-xl, text-2xl, text-3xl, text-4xl) instead of an arbitrary text-[Npx] size.',
  },
  {
    selector: 'TemplateElement[value.raw=/text-\\[[0-9.]+px\\]/]',
    message:
      'Use a type-scale token (text-3xs … text-4xl) instead of an arbitrary text-[Npx] size.',
  },
]

export default defineConfig([
  globalIgnores(['dist', 'storybook-static']),
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
    // Enforce the type scale in app code (not stories/foundations docs, which
    // intentionally reference legacy tokens as examples, nor the .storybook config).
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/**/*.stories.{ts,tsx}', 'src/foundations/**', '.storybook/**'],
    rules: {
      'no-restricted-syntax': noArbitraryTextSize,
    },
  },
])
