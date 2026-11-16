# @accel/ui

The Accel design system: design tokens, shadcn-based primitives, design-system composites (StatusBadge, KpiCard, DataTable, DetailDrawer…), charts and page structure. React 19 + Tailwind CSS v4.

It lives in this repo as an npm workspace (`packages/ui`). The Accel app (`src/`) and the prototypes (`prototypes/`) consume it like any other package.

## Use it

```tsx
// Components — the barrel, or a deep path
import { Button, KpiCard, KpiGrid, DataTable } from "@accel/ui";
import { Button } from "@accel/ui/components/ui/button";
import { cn } from "@accel/ui/lib/utils";
```

```css
/* Your app's CSS entry — once. Brings Tailwind, the theme, all tokens and base styles. */
@import "@accel/ui/styles.css";
```

- **Theme:** dark by default. Toggle the `dark` / `light` class on `<html>`.
- **Fonts:** the tokens name **Manrope** (sans) and **JetBrains Mono** (mono), but the package doesn't ship font files. Load them in your app, e.g. Google Fonts in `index.html`.
- **Tooltips:** wrap the app in `<TooltipProvider>` (from `@accel/ui/components/ui/tooltip`).
- **Peer dependencies:** react, react-dom, radix-ui, @base-ui/react, class-variance-authority, clsx, tailwind-merge, lucide-react, cmdk, recharts, tailwindcss v4, tw-animate-css, shadcn (CSS only). npm installs them automatically.
- **Source package:** it ships TypeScript source (`src/`), compiled by the consuming Vite app. A fresh Vite + React app installing the packed tarball builds and renders in both themes; this was verified on 2026-11-16.

## Versioning

Semver, judged from the consumer's side. If an app that followed the docs would break or look different without changing its code, that's a breaking change.

| Bump | When | Examples |
|---|---|---|
| **Major** | Something a consumer uses is removed or renamed, or behaves differently by default | Removing a deprecated token, prop or tone; renaming a component, prop or `data-slot`; changing a default `variant` or `size`; changing a token's value enough to break contrast or layout; a new required peer dependency |
| **Minor** | Something new, backwards compatible | A new component, prop, variant, tone or token; deprecating something (it keeps working); a new optional peer dependency |
| **Patch** | Fixes that keep the documented behaviour | Bug fixes, a11y fixes, small token tuning that keeps AA and layout, docs and story changes |

- **Deprecate before removing.** Mark it `@deprecated` (or `DEPRECATED` in `styles.css`), list it under **Deprecated** in the changelog, and keep it working until the next major.
- **Every change gets a changelog line** under `## [Unreleased]` in `CHANGELOG.md`, and CI checks this on pull requests.
- **To release:** move the Unreleased lines under a new version heading, bump `version` in `package.json` by the table above, and run the full gates (`npm run lint`, `npm test`, `npm run test:a11y`).

## Re-skin

Override the brand ramp on `:root` after the styles import. See [`docs/theming.md`](../../docs/theming.md).

## Work on it

| Command (repo root) | What it does |
|---|---|
| `npm run storybook` | Every component, foundations (token reference) and guidelines (usage, page patterns) |
| `npm test` | Interaction tests in `packages/ui/test/` |
| `npm run test:a11y` | axe over every story, light and dark — must be 0 violations |
| `npm run lint` | Token, layer-name, registry and ESLint guardrails |

Rules (full version in the repo's `CLAUDE.md`):

- **Relative imports only.** Inside the package, ESLint blocks `@/…` (app code) and `@accel/ui` self-imports. A component added with the shadcn CLI arrives with `@accel/ui/…` imports; make them relative.
- **New components need sign-off.** Add them to `src/components/registry.json` with `data-slot` names on every element and a story.
- **Semantic tokens only.** No palette colours, no hex, type-scale tokens for text.
- **Nothing app-specific.** No stores, router, mock data or Accel assets. Those belong in the app's `src/components/app/`.
