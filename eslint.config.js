import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

// ── Design-system guardrails ─────────────────────────────────────────────────
// Each rule bans a class/token pattern in string literals and template strings
// (className values, cva variants, style maps). Conventions live in CLAUDE.md
// and the src/index.css header. Violations that predate a rule are recorded in
// eslint-suppressions.json (ESLint bulk suppressions): lint fails only on NEW
// ones. After fixing old ones, run `npm run lint:prune` to shrink the baseline.
//
// esquery regexes can't contain "/", so patterns end at \b instead of matching
// opacity suffixes like /15.
const COLOR_UTIL = '(bg|text|border|ring|fill|stroke|from|to|via|outline|divide|decoration|accent|caret|placeholder)'
const TW_PALETTE =
  '(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)'

/** Ban `pattern` in plain strings and template-literal chunks. */
function ban(pattern, message) {
  return [
    { selector: `Literal[value=/${pattern}/]`, message },
    { selector: `TemplateElement[value.raw=/${pattern}/]`, message },
  ]
}

const designSystemGuardrails = [
  'error',
  // Type scale — use text-3xs … text-4xl.
  ...ban(
    'text-\\[[0-9.]+px\\]',
    'Use a type-scale token (text-3xs, text-2xs, text-xs, text-sm, text-base, text-md, text-lg, text-xl, text-2xl, text-3xl, text-4xl) instead of an arbitrary text-[Npx] size.',
  ),
  // Tailwind's built-in palette bypasses theming — use semantic tokens.
  ...ban(
    `(^|[\\s:])${COLOR_UTIL}-${TW_PALETTE}-[0-9]{2,3}\\b`,
    'Tailwind palette colours (bg-red-500, bg-neutral-950…) bypass the theme. Use a semantic token: bg-card, text-muted-foreground, text-severity-critical, bg-success/15…',
  ),
  ...ban(
    `(^|[\\s:])${COLOR_UTIL}-(white|black)\\b`,
    'Raw white/black ignores dark mode. Use a semantic token (bg-card, text-foreground, text-primary-foreground…).',
  ),
  // Elevation — Tailwind's shadow sizes vanish on the dark theme.
  ...ban(
    '(^|[\\s:])shadow(-(xs|sm|md|lg|xl|2xl))?($|\\s)',
    'Use an elevation token: shadow-raised (cards, inputs), shadow-floating (popovers, dropdowns, toasts) or shadow-modal (dialogs, sheets).',
  ),
  // Deprecated token names (kept as aliases only for prototypes/ and in-flight work).
  ...ban(
    '(^|[\\s:-])sev-(critical|high|medium|low)\\b',
    'sev-* is deprecated — use severity-* (text-severity-critical, accent="severity-critical").',
  ),
  ...ban(
    '(^|[\\s:-])purple\\b',
    'purple is deprecated — use violet (bg-violet, tone="violet").',
  ),
  ...ban(
    '\\b[a-z]+-soft\\b|primary-muted',
    '*-soft and primary-muted are deprecated — use an opacity modifier: bg-success/15, bg-primary/10.',
  ),
  // Brand orange as text fails AA on light surfaces — use the ink token.
  ...ban(
    '(^|[\\s:])text-primary\\b(?!-)',
    'Use text-primary-ink for orange text (text-primary fails AA on light surfaces). On a solid primary-fill use text-primary-foreground.',
  ),
  // Scales — use the z-index and radius tokens.
  ...ban(
    '(^|[\\s:])z-\\[[0-9]+\\]',
    'Use a z-index token: z-[var(--z-dropdown|sticky|overlay|drawer|modal|toast|tooltip)].',
  ),
  ...ban(
    '(^|[\\s:])rounded(-[a-z]+)?-\\[[0-9.]+px\\]',
    'Use a radius token (rounded-sm, rounded-md, rounded-lg…) instead of an arbitrary px radius.',
  ),
  // Tier rule — primitives are for src/index.css only.
  ...ban(
    'var\\(--palette-',
    'Palette primitives (--palette-*) are internal to src/index.css. Use a semantic token (var(--primary), var(--severity-high)…).',
  ),
]

// Pages compose existing components — they never hand-roll a primitive that
// the design system already has. Need something new? Ask first (CLAUDE.md →
// "Building page UI"), then add it to src/components and the registry.
const RAW_TO_COMPONENT = {
  button: 'Button (components/ui/button)',
  input: 'Input, OtpField, PhoneField, TimeSelect or ModalTextInput',
  select: 'Select, ChoiceDropdown, FilterDropdown or DepartmentSelect',
  textarea: 'Textarea (components/ui/textarea)',
  table: 'DataTable (components/shared) or Table (components/ui/table)',
  dialog: 'Modal / Dialog / Sheet',
}
const pageGuardrails = [
  ...designSystemGuardrails,
  ...Object.entries(RAW_TO_COMPONENT).map(([tag, use]) => ({
    selector: `JSXOpeningElement[name.name='${tag}']`,
    message: `Pages use existing components, not a raw <${tag}>. Use ${use}. If none fits, ask before creating a new component (CLAUDE.md → "Building page UI").`,
  })),
  {
    selector: "ImportDeclaration[source.value=/^(@radix-ui|radix-ui)/]",
    message: 'Pages import components from @/components/*, never Radix directly. If a primitive is missing, ask before adding it to components/ui.',
  },
]

export default defineConfig([
  // legacy/ holds generated, frozen copies of pre-redesign modals for the Modal
  // Gallery's compare view; they keep the lint debt they had when frozen.
  globalIgnores(['dist', 'storybook-static', 'src/pages/dev/modals/legacy/**']),
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
    // Enforce the design system in app code (not stories/foundations docs, which
    // name banned patterns as examples, nor the .storybook config).
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/**/*.stories.{ts,tsx}', 'src/foundations/**', '.storybook/**'],
    rules: {
      'no-restricted-syntax': designSystemGuardrails,
    },
  },
  {
    // Pages and prototypes: everything above, plus "use existing components only".
    // Prototypes are the main UI and load the real tokens + components.
    files: ['src/pages/**/*.{ts,tsx}', 'prototypes/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': pageGuardrails,
    },
  },
])
