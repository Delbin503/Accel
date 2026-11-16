# Changelog — @accel/ui

All notable changes to the design system. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning: semver, as defined for this design system in the [README](./README.md#versioning).

Every pull request that changes `packages/ui/` adds a line under **Unreleased** — CI checks it (`scripts/check-changelog.mjs`). Write for the people using the components: what changed for them and what they must do.

## [Unreleased]

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
