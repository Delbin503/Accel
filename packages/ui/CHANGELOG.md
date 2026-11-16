# Changelog — @accel/ui

All notable changes to the design system. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning: semver, as defined for this design system in the [README](./README.md#versioning).

Every pull request that changes `packages/ui/` adds a line under **Unreleased** — CI checks it (`scripts/check-changelog.mjs`). Write for the people using the components: what changed for them and what they must do.

## [Unreleased]

## [1.1.0] — 2026-11-16

Backwards compatible: new spacing tokens and a SectionCard prop, plus accessibility fixes. Nothing to change in your code.

### Added
- Spacing role tokens `--spacing-card` (16px), `--spacing-section` (16px), `--spacing-inline` (8px), `--spacing-page` (24px) → `p-card`, `gap-section`, `gap-inline`, `p-page`. KpiCard, DescriptionList and Toolbar use them (same values, no visual change).
- SectionCard `headingLevel` (2 | 3 | 4, default 3) to keep the page outline in order under a page `h1`.

### Fixed
- DateRangeBar preset pills and FilterDropdown options expose their selected state to screen readers (`aria-pressed`).
- Clickable KpiCards (filter toggles) announce their state with `aria-pressed`.
- Dialog and Sheet (so Modal, ConfirmDialog, DetailDrawer) return keyboard focus to whatever opened them when they close. Before, focus fell to the page body unless they were opened from a `DialogTrigger`.

## [1.0.0] — 2026-11-17

First stable version. Removes everything 0.1.0 deprecated.

### Removed (breaking)
- **Tokens and their utilities:** `sev-critical|high|medium|low` (and `*-soft`) → `severity-*`; `purple` / `purple-soft` → `violet`; `success-soft`, `warning-soft`, `info-soft` → `bg-{tone}/15`; `primary-muted` → `bg-primary/10`; the internal `--soft-alpha`. 29 tokens in all (223 → 194).
- **KpiCard:** the `accent` prop (use `tone`) and the `KpiAccent` type (use `KpiTone`).
- **Tone values** `"purple"` and `"sev-critical" | "sev-medium" | "sev-low"` on KpiCard and StatusBadge → `"violet"`, `"severity-*"`.
- **App import paths** `@/components/ui|shared|charts|custom|layout` and `@/lib/utils|formatters|…` → `@accel/ui/…` (the compatibility aliases are gone).

### Changed (breaking)
- Dialog, Sheet and Popover content default to the 13px body size (`text-base`) instead of 16px (`text-lg/6`). Text you sized explicitly is unaffected.

### Added
- Brand artwork tokens `--brand-mark`, `--brand-coin`, `--brand-coin-ink` (utilities `fill-brand-mark`, `fill-brand-coin`, `stroke-brand-coin-ink`…) and primitives `--palette-orange-450`, `--palette-orange-550`.
- Chromatic modes: every story is snapshotted in light and dark.

### Migrating
Find and replace in class strings: `-sev-` → `-severity-`, `-purple` → `-violet`, `bg-X-soft` → `bg-X/15`, `bg-primary-muted` → `bg-primary/10`; in KpiCard props, `accent=` → `tone=`. ESLint still flags the old names, so `npm run lint` lists anything missed.

## [0.1.0] — 2026-11-16

First version as a package. Everything below existed in the app before and was extracted to `packages/ui` unchanged in behaviour.

### Added
- **Tokens** (`styles.css`): three tiers (palette primitives → semantic → component), light and dark themes, WCAG AA text contrast, type scale (`text-3xs`…`text-4xl`), elevation (`shadow-raised|floating|modal`), z-index, motion, radius, media surfaces, status and severity colours. Paper palette for email/PDF in `lib/tokens.ts`.
- **Primitives** (`components/ui`): shadcn-based Button, Badge, Card, Input, Textarea, Select, Checkbox, RadioGroup, Switch, Slider, Tabs, SegmentedControl, Item / ItemButton, Table, Pagination, Dialog, Sheet, Popover, DropdownMenu, Tooltip, Command, Collapsible, Progress, Skeleton, Avatar, Label, Separator, Sidebar, Chart.
- **Composites** (`components/shared`): StatusBadge, KpiCard / KpiGrid, SectionCard, EmptyState, PageStates, FilterDropdown, FilterPanel, Toolbar / ToolbarSearch, DateRangeBar, Modal / ModalForm / ConfirmDialog, DataTable (list variant, selection, sticky header and column, keyboard rows, inline empty), DetailDrawer, DescriptionList, Stepper, ChoiceDropdown, OtpField, PhoneField, TimeSelect, ProgressRow, TruncatedText, FloatingBar, PlaybackControls, PasswordStrengthBar.
- **Charts** (`components/charts`): AreaChart, BarChart, LineChart (axes, dots, reference lines, value formatter), DonutChart.
- **Layout**: PageHeader. **Custom**: CoachMark, GuideGifModal.
- **Utilities**: `cn()`, formatters, `use-mobile`.
- **Docs**: Storybook foundations (generated token reference), usage guidelines, page patterns; 0 axe violations across all stories in both themes.

### Deprecated
Kept for in-flight pages; removed in the next **major** version.
- Tokens: `sev-*` (→ `severity-*`), `purple` (→ `violet`), `*-soft` (→ `bg-{tone}/15`), `primary-muted` (→ `bg-primary/10`).
- `KpiCard` `accent` prop and `KpiAccent` type (→ `tone`, `KpiTone`); `"purple"` / `"sev-*"` tone values on KpiCard and StatusBadge (→ `"violet"`, `"severity-*"`).
- Import paths `@/components/ui|shared|charts|custom|layout`, `@/lib/utils|formatters|…` (→ `@accel/ui/…`), resolved by compatibility aliases in the app.
