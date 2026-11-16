# Accel Design System — Roadmap

**Goal:** a design system that can be reused in other products and survives redesigns, new themes and new platforms without a rewrite.

**How to use this:** work top to bottom. Each phase ends with a **Done when** check. Tick boxes as you go. To continue, ask Claude: *"next step on the design system roadmap"*.

Sizes: **S** ≈ under half a day · **M** ≈ 1–2 days · **L** ≈ 3–5 days (one person; rough).

---

## ▶ Start here (next session)

*Updated 2026-11-16.*

**State:** Phases 0–6 are done except items that need you. Everything after commit `cf0ee2d` is **uncommitted** in the working tree, and `cf0ee2d` itself isn't pushed (the Bitbucket token returns 403).

**Needs you:**
1. **Renew the Bitbucket token**, then commit and push (push branch `design-updates-nov-6` on `sigmawaveai/vibe-coding-accel`). The first PR runs the new pipeline (checks + a11y).
2. ~~Commit your run-analysis and email-template work~~ ✅ committed (`0f98bfc`); its lint errors and the compatibility import aliases are done (`3b3614a`). Removing the deprecated tokens/props (a major version) is now unblocked
3. **Chromatic:** create a project and add `CHROMATIC_PROJECT_TOKEN` in Bitbucket for visual snapshots.
4. Phase 7 decisions: is Figma the source of truth? When to adopt DTCG / Style Dictionary?

**Open questions** (from earlier, still open): dialog text at 16px vs 13px `text-base`; `DepartmentSelect`'s v3 width syntax; brand artwork as tokens or artwork.

---

## Where we are (2026-11-13)

| Layer | Status | Evidence |
|---|---|---|
| Tokens | 🟢 Strong | 3 tiers (`--palette-*` → semantic → component), light/dark, elevation, media, fill/ink tokens; **0 WCAG AA text failures**; `npm run lint:tokens` |
| Guardrails (app `src/`) | 🟢 Strong | ESLint bans off-system classes; pages can't hand-roll primitives; component registry; every component element named. Debt baselined (572) |
| Layer naming | 🟢 Strong | 693 layers in 76 component files (every element); 1,331 section names in 167 page/prototype files |
| **Prototypes (the main UI)** | 🟢 Strong | Guardrails + type-check cover them; 0 token issues, 0 raw elements, 0 type errors (except your email WIP) |
| Primitives (`components/ui`) | 🟢 Strong | 26 shadcn components, 24 with stories |
| Composites | 🟡 Functional | `shared/` = 22 reusable (10 with stories), `app/` = 21 Accel-specific; no leaks between them |
| Prop vocabulary | 🟢 Strong | `variant` / `tone` / `size` everywhere (`accent` deprecated alias) |
| Tests | 🔴 Absent | 0 test files; Storybook a11y + Chromatic addons not wired to CI |
| Reuse outside this app | 🔴 Absent | Design system lives in the app's `src/` |
| Design ↔ code | 🔴 Absent | No Figma library linked |

Reference: [TOKEN-AUDIT-2026-11-13.md](TOKEN-AUDIT-2026-11-13.md) (all token findings + remediation log).

**Lint commands:** `npm run lint` runs everything below, then ESLint:
- `lint:tokens`: naming and tier rules in `index.css`
- `lint:slots`: every component element has a `data-slot`
- `lint:components`: component registry
- `lint:prune`: shrinks the ESLint baseline after you fix debt

ESLint still reports **226 problems that predate this work** (mostly React-hooks rules). These are separate from the design-system guardrails, which are at 0.

---

## Phase 0: Lock in today's work · S

**Why:** ~115 files of token work are uncommitted and mixed with in-progress feature work (run-analysis, email templates). Every day this sits, separating them gets harder.

- [x] Commit token work only, leaving run-analysis/email-template/website files unstaged: `ac79a97` (tokens + migrations) and `6b60b13` (docs). Kept as one code commit, because the three rounds touched the same files and depend on each other
- [x] Push to your branch: Bitbucket `design-updates-nov-6` (`c59ac0f..68db341`)

**Done when:** `git status` shows only your feature work, and the token commits stand alone.
**Then →** Phase 1.

---

## Phase 1: Guardrails, so the system stays clean · S–M

**Why:** without enforcement, every new screen (human- or AI-written) erodes the tokens. Everything after this phase is protected by it.

- [x] Extend ESLint `no-restricted-syntax` (same mechanism as the `text-[Npx]` ban) to block in `className`:
  - Tailwind's built-in colours: `bg|text|border-(red|neutral|orange|…)-NNN`, `bg-white`, `text-black`
  - Old shadow sizes `shadow-sm … shadow-2xl`
  - Deprecated names: `sev-*`, `purple`, `*-soft`, `primary-muted`
  - Arbitrary `z-[N]` and `rounded-[Npx]`
- [x] Block `var(--palette-*)` anywhere outside `src/index.css`
- [x] ~~stylelint `custom-property-pattern`~~ → `scripts/check-tokens.mjs` (`npm run lint:tokens`). No new dependency, and it also checks tier placement, `.dark` overrides and broken `var()` references, which a name pattern can't
- [x] Record the current violation count as a baseline (don't fix yet; Phase 2 does). `eslint-suppressions.json`: **226 in 41 files**
  | Rule | Count | Where |
  |---|---|---|
  | Raw `white`/`black` | 110 | camera/video overlays, auth screens |
  | Deprecated `sev-*` | 64 | 58 in run-analysis (WIP), 6 KpiCard aliases |
  | Tailwind palette | 20 | `bg-neutral-9xx` overlays, DrawZoneModal, RecordingCard |
  | Deprecated `purple` / `*-soft` | 11 | run-analysis (WIP), KpiCard alias |
  | `rounded-[Npx]` | 7 | shadcn chart/checkbox internals |
  | `text-[Npx]` | 6 | pre-existing |
  | `z-[N]` / old shadows | 8 | AppLayout, model-management, auth logo glow |
- [x] Add a `.ds-ops-config.yml` so design-system-ops skills know the stack

**Done when:** `npm run lint` fails on a new `bg-red-500` or `shadow-lg`, and existing violations are listed with a count. ✅ *Done 2026-11-13.*
**Then →** Phase 2.

---

## Phase 2: Finish the tokens · M

**Why:** tokens are the foundation for everything else. Fix them before documenting or packaging, so they aren't renamed twice.

- [x] **Contrast.** Measured every text token × surface × theme, plus status text on its own `/15` chip. 29 failures → 0.
  - Status inks re-tuned (light darker, dark brighter); dark `destructive` and `severity-critical` share one red
  - Brand orange: `--primary-fill` (deeper orange) for 65 labelled fills incl. Button and Badge; `--primary-ink` for orange text (285 uses codemodded). Bright `--primary` stays for rings, tints, dots and charts
  - `--status-foreground` for labels on solid status fills, and `destructive-foreground` dark text in dark mode
  - New guardrail: bare `text-primary` is now a lint error
- [x] **Hardcoded values.** Baseline 226 → **124**; everything outside run-analysis WIP is fixed or deliberate.
  - New media tokens (`media`, `media-raised`, `scrim`, `media-foreground`) replace 169 raw black/white/neutral classes on video and camera surfaces, with no visual change
  - `z-[N]` → tokens (added `--z-popover: 55`); `rounded-[Npx]` → `rounded-xs`/`sm`/`lg`; `text-[12px]` → `text-sm`; `duration-150/200/300` → duration tokens (15)
  - Bug fixed: "Most popular" badge in onboarding was white on light grey (invisible in light mode)
  - Remaining 124: 114 in `run-analysis/index.tsx` (WIP), 7 `KpiCard` deprecated aliases, 3 auth logo glows (coloured `shadow-secondary`, accepted exception)
- [x] **Tier-3 audit items:** `--radius-xs` defined; `src/App.css` deleted; `bg-camera-feed` routed through `--camera-feed-from/to` → palette. *Spacing role tokens moved to Phase 3*: components don't follow one rhythm yet (SectionCard alone mixes px-4/px-5 and four py values), so they get named when component APIs are unified
- [x] **Removed deprecated names (2026-11-17, @accel/ui 1.0.0):** 29 tokens (`sev-*`, `purple`, `*-soft`, `primary-muted`, `--soft-alpha`), KpiCard `accent` / `KpiAccent`, `"purple"` / `"sev-*"` tones; last callers (run-analysis, email templates) migrated; lint baseline pruned 184 → 110. ESLint keeps rejecting the old names
- [x] Re-check: `npm run lint:tokens` passes (223 tokens, 40 primitives); contrast matrix shows 0 AA failures; typecheck and production build pass

**Done when:** theme-audit shows no AA failures in either theme; lint baseline from Phase 1 is zero; `grep -r DEPRECATED src/index.css` returns nothing.
*Status 2026-11-13:* contrast ✅ · baseline zero outside WIP and accepted exceptions ✅ · deprecated aliases ⏸ (waiting on run-analysis). Phase 3 can start; finish the alias removal whenever run-analysis lands.
**Then →** Phase 3.

---

## Phase 2A: Layer naming + component guardrails · M — ✅ done, ⚠ not committed

**Why:** every element should say what it is (inspector, tests, design imports), and new pages must be built from existing components, not hand-rolled.

- [x] Every HTML element in all 76 component files has a `data-slot`, shadcn-style: root `kpi-card`, parts `kpi-card-value`. **693 named layers.** Charts got `area-chart` / `bar-chart` / `line-chart`
- [x] Text: every text element has a type-scale size and a colour token, on itself or its component root
- [x] Leftover `z-50` / `z-10` / `min-w-[16px]` in components → tokens (same stacking)
- [x] `scripts/check-slots.mjs` (`npm run lint:slots`): fails on an unnamed element, a name that isn't kebab-case, or a name that doesn't start with its component's name
- [x] **Page guardrail (ESLint, `src/pages/**`):**
  - Raw `<button>`, `<input>`, `<select>`, `<textarea>`, `<table>`, `<dialog>` are errors; the message names the component to use
  - Direct Radix imports are errors
  - Existing debt (384 buttons, 47 inputs, 19 tables) is baselined
- [x] **Component registry:** `src/components/registry.json` lists the 78 approved components. `scripts/check-components.mjs` (`npm run lint:components`) fails on any unregistered component file or folder
- [x] **CLAUDE.md, "0. Building page UI":** look in the registry and Storybook first, then compose. If nothing fits, **stop and ask** with a proposal (name, folder, props, why existing ones don't fit). After approval: build it, add `data-slot` + a story, then register it
- [x] **Commit + push**: `d70e0b7`

**Done when:** `npm run lint` shows the token, slot and registry checks passing, with 0 guardrail errors. ✅

---

## Phase 2B: Prototypes follow the system · M

**Why:** the prototypes in `prototypes/` are the main UI. They load the real tokens (`proto.css` imports `src/index.css`) and reuse `src` components (155 `ui` imports, 136 `shared`, 65 wrapped `src/pages`). But ESLint guardrails don't cover `prototypes/` at all, so they still use old names and raw values. Deprecated aliases keep them rendering.

**Audit (2026-11-13), 121 files:**

| Issue | Count | Fix |
|---|---|---|
| Deprecated `sev-*` | 465 | codemod → `severity-*` (mechanical) |
| Raw `<button>` / `<input>` / `<table>` / `<select>` | 388 | → `Button` / `Input` / `DataTable` / `Select` (manual, page by page) |
| Bare `text-primary` (fails AA in light) | 209 | codemod → `text-primary-ink` |
| Arbitrary `text-[Npx]` | 122 | → type-scale tokens (mapping in CLAUDE.md) |
| Raw `white` / `black` | 90 | → media tokens or `status-foreground` (same rules as Phase 2) |
| Hex / rgb literals | 81 | → tokens; email templates and PDF use `src/lib/tokens.ts` |
| Deprecated `purple` / `*-soft` / `primary-muted` | 77 | codemod → `violet`, `/15`, `/10` |
| Tailwind palette (`bg-red-500`…) | 60 | → semantic tokens |
| Old shadows / `z-[N]` / `rounded-[Npx]` | 67 | → elevation / z / radius tokens |

By prototype:
- **`PRD_Phase_1_3`: 715** (its own ~28k lines: assessment, re-ID, AAR dashboards)
- `PRD_Detection_Feed` 113, `PRD_Live_Monitoring` 33, `PRD_Dashboard` 27, `PRD_Invite_Signup` 26, `PRD_Interactive_Demo` 23
- 20 more at ≤12 each; these are mostly thin wrappers around real `src/pages`
- `PRD_Billing` and `PRD_Training_Assessment` are already clean

Steps:
- [x] ESLint guardrails now cover `prototypes/**` (same `pageGuardrails` as pages). Added `npm run typecheck:prototypes` (`tsconfig.protocheck.json`), since prototypes weren't type-checked at all; 1 error predates this work (`RecordingSchedule.tsx`)
- [x] Codemods across 88 files (~1,070 fixes): `sev-*` → `severity-*` (467), `text-primary` → `text-primary-ink` (207), `purple` → `violet` (63), labelled `bg-primary` → `bg-primary-fill` (41), black/white on media → media tokens (96), old shadows → elevation (46), `*-soft` / `primary-muted` → opacity (15)
- [x] `text-[Npx]` → type scale (122). `z-[90]`/`z-[100]` tester chrome → `--z-tooltip` (16 wrappers). Re-ID floor-plan and scene SVG greys → media tokens at matching opacity. Chart `var(--purple)` → `var(--violet)`. **Token violations in prototypes: 0** (except 6 in your email-template WIP)
- [x] Load check of all 26 prototypes: every one renders, no runtime errors. Spot-checked the riskiest migrations (camera tiles, state tester, config sliders and segmented controls)
- [x] Raw elements → components: **383 → 0** (only 2 hidden file inputs stay raw, with a documented lint exception). Used Button (icon/link/variants), Input, Checkbox, Switch, Select, Table, plus three **new approved components**: `SegmentedControl` (option groups, view switchers, chips, state testers), `Item`/`ItemButton` (clickable cards and rows) and `Slider` (range inputs). Each has stories, layer names and a registry entry. Prototype type errors are now 0 (fixed a leftover `TONE_CLASSES.purple`, which had also made the Recording Schedule standby band colourless)
- [x] `npm run lint:prune`: prototype baseline 394 → 11 (all in your email-template WIP)

**Done when:** the prototypes' guardrail baseline is 0 for token and deprecated-name rules (raw elements may still be burning down), and every prototype renders correctly in both themes.

---

## Phase 2C: Name page sections · S–M

**Why:** components are fully named. Pages need a root and region names so any area can be found in the inspector, in tests or in design imports. Naming every one of the ~5,500 page elements would mostly name layout glue, so the decision was **sections only**.

- [x] Every page (`src/pages/**` + prototype pages) gets a root `data-slot="{page}-page"` and region names (**1,331 names in 167 files**). Prototype copies use the same names as their app page (`dashboard-page`, `nvr-devices-page`…). Page-local drawers and modals get their own root (`event-drawer`, `case-drawer`, `invoice-detail-drawer`). Example:
  ```
  detection-feed-page
  ├─ detection-feed-page-header    (PageHeader)
  ├─ detection-feed-page-kpis      (KpiCard × 6)
  ├─ detection-feed-page-filters   (DateRangeBar, FilterPanel)
  ├─ detection-feed-page-list
  └─ detection-feed-page-event
  ```
  About 5–15 names per page, ~400–800 in total
- [x] `scripts/check-slots.mjs` now also fails any page or prototype file that renders DOM without section names. Exempt: `src/pages/dev/` (gallery and frozen copies) and your two WIP files (`run-analysis/index.tsx`, `PRD_Email_Templates/index.tsx`). Remove those from `PAGE_EXEMPT` once committed
- [ ] Raw elements inside pages get named automatically as they're migrated to components (Phase 2B / 3)

**Done when:** every page has a named root and named regions, and the slot check enforces it.

---

## Phase 3: Components: one purpose, one API · L

**Why:** reuse means a component means the same thing everywhere. Today `shared/` mixes design-system pieces with app logic, and props name the same idea three ways.

- [x] Component audit (usage, app dependencies, style props) across all component folders
- [x] **Split `shared/`**: 22 reusable design-system composites stay in `components/shared/`; 21 Accel-specific components moved to `components/app/` (anything importing stores, router, mocks or the theme provider, plus auth/onboarding/product-flow pieces). 42 files had imports rewritten. No design-system component imports an app component
- [x] **Prop vocabulary**: `variant` = style, `tone` = semantic colour, `size` = scale. Only outlier was `KpiCard accent=` → `tone=` (88 uses, 25 type refs); `accent` / `KpiAccent` stay as deprecated aliases
- [x] **Raw elements in `src/pages` → components**: 450 → 0 (one hidden file input excepted; run-analysis WIP and the dev gallery not touched). Same mapping as the prototypes. Follow-up fixes: `ItemButton variant="plain"` keeps its keyboard focus ring; table rows keep their dividers
- [x] `registry.json` has separate `shared` (22) and `app` (21) groups; slot check covers `components/app`
- [x] **Adopt the built-but-unused components** (2026-11-15):
  - ✅ `ToolbarSearch` / `Toolbar`: 19 search fields and 2 filter rows converted (app pages + Phase 1.3)
  - ✅ `DataTable` (was: 0 of ~25 tables fit the old API; fixed by the additions below). Old blockers: the house list style (muted header, eyebrow headers, `px-4`, dividers), row selection, sticky headers, clicks inside cells, keyboard row activation
  - ✅ Chart wrappers (was: 0 dashboard charts fit; fixed below). Old blockers: no Y axis, no angled X labels, no dots, series keys with spaces break `var(--color-<key>)`. Sport-analytics charts (reference lines, dual axes, sparklines) legitimately stay on Recharts
  - ✅ **API additions approved and built (2026-11-15)**, each with a story:
    1. `DataTable variant="list"` (house list style) + `column.headClassName`
    2. `column.stopRowClick` (clicks and keys inside the cell don't open the row)
    3. `DataTable selection={{ selectedIds, onToggle, onToggleAll, getRowLabel }}` (checkbox column, indeterminate header)
    4. `DataTable stickyHeader` + `containerClassName` (scroll height) + `column.sticky: "right"` (opaque fills match header, hover and selected rows); `ui/table` gained `containerClassName`
    5. `getRowClassName(row)` + keyboard row activation (rows focusable, Enter/Space, focus outline)
    6. `empty.variant="inline"`
    7. Chart wrappers: `yAxis`, `xAxis` (angle adds left margin), `dots`, `referenceLines`, `valueFormatter` (new `ChartTooltipContent valueFormatter` in `ui/chart`). Marks use the resolved series colour, so keys with spaces work; an explicit Y domain clips bars
    8. `ToolbarSearch size="sm"` + `inputClassName`
  - ✅ **Adopted (2026-11-15):** 25 tables → `DataTable` (14 in app pages, 11 in Phase 1.3; selection on recordings, model-deployment ×3 and TaSessions; sticky headers on model-deployment, members tables and the AAR shot table; inline empty on billing and NVR). 8 dashboard charts (4 dashboards × trend line + cameras bar) → chart wrappers; those pages no longer import Recharts. 3 country-code searches → `ToolbarSearch size="sm"`. Left on ui/table by design: permission matrices (system-config ×3), A-vs-B comparison tables (gym, golf), the AAR cue×shot grid and grades table, the golf swing table (colSpan rows). `selection.selectAllLabel` added along the way
  - Then: lint rule banning direct `recharts` imports in pages (baseline the sport charts)
- [x] Move remaining tab/picker groups to `SegmentedControl` or `Tabs` (2026-11-15): 15 groups in 11 files — TaSessions (header switcher, units chips), ActivitiesPicker chips, TaModelDeployment (All/Cameras/Devices, Deploy/Models), Re-ID Live Monitoring + Model Deployment drawer tabs (`Tabs` line), Re-ID Deploy/Models, RecordingSchedule weekdays, golf/gym drawing tools (clicking the active tool still turns it off), TaPoseDefaults use case, TaSystemConfig time format + week start. Sign-up monthly/annual became a `Switch`. Kept: rich option cards (→ `ItemButton selected`), single toggles (`Button aria-pressed`), the prototype index tabs (plain HTML outside the design system)
- [x] Component naming audit (2026-11-15). Names are clear overall; file naming follows the folder (ui/custom kebab-case like shadcn, others PascalCase). Findings, **proposals awaiting your OK** (renames change APIs):
  - 🟠 **Duplicate concepts under different names:** `OptionChips` (ModalForm) duplicates `SegmentedControl type="multiple" variant="outline"`; `ModalSearchInput` duplicates `ToolbarSearch`; `IconButton` (PlaybackControls) duplicates `Button size="icon*"`. Proposal: migrate callers, deprecate the duplicates
  - 🟡 **Player parts lack a common prefix:** `ChipRow`, `ScrubTrack`, `ZoomSurface` (exported from PlaybackControls) → `PlaybackChipRow`, `PlaybackScrubTrack`, `PlaybackZoomSurface`, matching `PlaybackSettingsMenu`
  - 🟡 **`custom/` is a fourth bucket** with 2 components: `CoachMark` is reusable (→ shared), `GuideGifModal` is product onboarding (→ app). Proposal: fold `custom/` away
  - ⚪ `ConfirmDialog` is built on `Modal`, not `Dialog` (fine as a common idiom; leave). `PageStates.tsx` exports `ListLoadingState` / `ListErrorState` (file name ≠ exports). `MODAL_NOTE` and `NAV_GROUPS` constants exported from component files trigger fast-refresh warnings → move to `lib/`
- [ ] Add spacing role tokens (`p-card`, `gap-section`, `gap-inline`) once components share one rhythm (moved from Phase 2)
- [x] Decision guide: [docs/choosing-components.md](docs/choosing-components.md), covering overlays, single and multi choice, actions, data display, empty/loading/error, inputs and page structure. Linked from CLAUDE.md step 1 of "Building page UI"

**Done when:** every component is in exactly one of design system / app; every design-system component uses the shared prop vocabulary; there's a written "which one do I use" decision tree.
**Then →** Phase 4.

---

## Phase 4: Documentation and Storybook · L

**Why:** a component nobody can find or understand gets rebuilt. Storybook is the catalogue other projects will browse.

- [x] Stories for **every** design-system component: 23 new story files (ui command/sidebar, 12 shared, 2 custom, 3 layout) + 5 more chart stories → **182 stories, all render without errors** (checked one by one in a running Storybook, 2026-11-15). `npm run storybook` or the `storybook` preview config
- [x] Component issues found while writing stories, fixed: DateRangeBar `onClear` now renders its Clear link and its From/To labels are linked to their inputs; PhoneField option buttons get `type="button"` and its inputs get aria-labels; ModalField labels link to their control; ChoiceDropdown gets `disabled` + `className`; ProgressRow gets `className`; arbitrary `h-[88px]` / `max-w-[220px]` → `h-22` / `max-w-55`; `components/layout/index.ts` exports its components. Still open: TruncatedText reads a ref during render (`react-hooks/refs`) and needs a TooltipProvider above it; chart wrappers have no empty state
- [x] Zero violations in the Storybook **a11y** panel (2026-11-15): axe over all 189 stories × light/dark went **108 → 0** (story×rule).
  - Storybook fixes: the theme class now goes on `<html>` before render (`.storybook/theme.ts`, `beforeEach`), so root-resolved tokens and portalled overlays match the theme; a `TooltipProvider` wraps stories
  - Tokens: light status inks (green/amber/blue/violet/red/tangerine) 4 lightness points darker so badges clear 4.5:1 on their /15 tint; light `--muted-foreground` 40% → 37%; light orange ink 36% → 33%; dark red-500 66% → 69%
  - Components: DataTable list headers and ModalForm section titles use full `text-muted-foreground` (were /60, /80); sidebar group labels, version and credits likewise; inactive Tabs use `text-muted-foreground`; KpiCard badge tint /10; sidebar collapsible no longer puts a `<div>` inside the menu `<ul>`; CoachMark has a dialog name; decorative Command separators are `aria-hidden`; `Slider` puts `aria-label` on its thumbs (new `thumbLabels`); `ModalTextInput` / `ModalPasswordInput` take the `id` ModalField links its label to; DataTable `selection.selectAllLabel`
  - Stories: labelled demo controls, `text-secondary` (a background token) no longer used as text, heading order
  - Documented exceptions (story `parameters.a11y`): Command "Empty" (cmdk's empty listbox), CoachMark "Default" (pulse animation), ModalForm "Checklist" (disabled rows are exempt)
  - Follow-up: page code still uses `text-muted-foreground/60`–`/70` for eyebrow labels in places; the same contrast issue applies there (Phase 5 a11y CI will catch it)
- [x] Token reference generated from `index.css` (2026-11-15): Storybook **Foundations/Token Reference** (semantic colours by section, primitives, scales, deprecated → replacement). `src/foundations/tokenParser.ts` parses the CSS at build time (also runs in Node), so the page can't drift; 223 tokens, matching `check-tokens`. Comment/grouping slips it found in `index.css` fixed
- [x] Usage guidelines (2026-11-15): Storybook **Guidelines/Usage** — live Do / Don't + rules for Button, StatusBadge, KpiCard, SectionCard, DataTable, Toolbar, Modal/ModalForm/ConfirmDialog, Sheet, SegmentedControl vs Tabs, EmptyState/PageStates
- [x] Page patterns (2026-11-15): Storybook **Guidelines/Page patterns** — working list page (search, filters, KPI filter, row → drawer, delete via ConfirmDialog, loading/empty/error switch), detail drawer, 3-step form wizard (+ validation errors), each with a numbered anatomy
  - ✅ **New components, approved and built (2026-11-15)**, each with stories, data-slots, registry entry and 0 axe violations:
    - `DescriptionList` / `DescriptionItem` (shared): a real `<dl>`; `layout` stacked (drawer info grid) · inline (label left, value right), `columns` 1–3, `variant` card · plain, `mono`, `wide`, an em dash for empty values
    - `Stepper` (shared): `<ol>` with `aria-current="step"`, done / active / upcoming states, `labels` always · sm-up (names stay available to screen readers). `AuthStepBar` and `OnPremStepBar` are now thin wrappers over it
    - `DetailDrawer` (shared) on `Sheet`: `size` md · lg (today's `min(860px,58vw)`) · xl; `DetailDrawerHeader` (+ `actions`, built-in close), `Title`, `Description`, `Body`, `Section` (eyebrow title + action), `Footer` / `FooterStart`
    - Page patterns and Usage guidelines now use them; decision guide and CLAUDE.md list them
  - [x] **Adopted `DetailDrawer` + `DescriptionList` in every app drawer** (2026-11-15): 15 drawers in 12 files — recordings, cameras, NVR (detail + not-found), site overview, user management (+ suspension / deleted cards), external devices, event, dismissed, incident case (3 states), entity, notifications (shell only), Re-ID calibration. No `SheetContent` left in pages or prototypes. Hand-made close buttons removed (one built-in close each); info grids → `DescriptionList`; eyebrow sections → `DetailDrawerSection`; left-pushed footer items → `DetailDrawerFooterStart`. Checked headlessly and in the preview
    - Component fixes from the migration: `DetailDrawerBody` children no longer shrink (a 280px video frame had collapsed to 0); `DetailDrawer` takes a page `data-slot` for its root
    - Known: tabs in tabbed drawers sit in the header content column (no full-width slot under the header); on open, focus goes to the first control (tab / header action) instead of the close button
  - Fixed on the way: `ModalSelect` takes ModalField's `id`; `ToolbarSearch` defaults its accessible name to the placeholder; Guidelines sort after Foundations in Storybook
- [x] Introduction story: token tiers, naming rules, prop vocabulary, folder split, "ask before creating components"
- [x] Docs coverage (2026-11-15): all 60 design-system components (ui, shared, layout, charts, custom) have stories and a usage note in `docs/choosing-components.md` or Guidelines. The 21 `app/` components have no stories by design (they need stores/router). Faded secondary text in pages (155 places) moved to full `text-muted-foreground`; rule added to CLAUDE.md

**Done when:** docs-coverage shows every design-system component has a story and usage notes; a11y panel is clean; a newcomer can build a list page from Storybook alone.
**Then →** Phase 5.

---

## Phase 5: Quality gates · M

**Why:** futureproof = you can change things safely. Without tests, every token tweak is a gamble.

- [x] Vitest 5 + Testing Library + jsdom (2026-11-16): `npm test`, tests in `src/test/` (the registry check would treat `.tsx` in component folders as components). 14 tests: DataTable (row click + Enter/Space, `stopRowClick`, selection + indeterminate select-all, loading / inline empty), DetailDrawer (named dialog, page slot, close button, Esc), DescriptionList (`<dl>` pairing, em dash), Stepper (states, `aria-current`), ModalField label linking (text / password / select), ToolbarSearch name, OtpField typing, Slider thumb names. Mutation-checked: breaking ModalSelect's `id` fails the suite
  - [ ] More tests as components change: FilterPanel, Modal focus trap, TimeSelect, DateRangeBar, SegmentedControl
- [ ] Visual regression via Chromatic (addon already installed): snapshot every story in light **and** dark. ⏸ **Needs you:** a Chromatic account/project and its token as the `CHROMATIC_PROJECT_TOKEN` repository variable in Bitbucket; then add a `npx chromatic --exit-zero-on-changes` step to the PR pipeline
- [x] Storybook a11y gate (2026-11-16): `npm run test:a11y` builds Storybook and `scripts/check-a11y.mjs` runs axe over every story in light + dark against the static build (serves it itself; puppeteer-core + system Chrome/Chromium via `CHROME_PATH`; honours story `a11y` rule exceptions; report in `.ds-ops-reports/`). Passes: 216 stories × 2 themes, 0 violations
- [x] CI on every pull request (2026-11-16, `bitbucket-pipelines.yml`, Node 22, two parallel steps): (1) token / slot / registry guardrails, `npm run build`, prototype typecheck, `npm test`; (2) Storybook build + a11y gate (Chromium from apt), report kept as an artifact. The existing `main` → Vercel deploy step is unchanged. All steps pass locally. **Not yet run on Bitbucket** — it runs on the first PR after this is pushed
  - [x] **ESLint debt cleared (2026-11-16): 205 errors + 17 warnings → 0** outside run-analysis, and ESLint now **blocks PRs** (`--ignore-pattern src/pages/run-analysis/**`; that page is reported only).
    - Entry files (`main.tsx`, `prototypes/PRD_*/index.tsx`) exempt from fast-refresh in `eslint.config.js` — they mount with `createRoot` and are never a refresh boundary (81 errors)
    - ~70 `set-state-in-effect`: reset-on-open / on-id-change effects → "adjust state during render" (prev-prop) pattern; mount-time reads (URL, `location.state`) → lazy `useState`; derived values computed; `use-mobile` → `useSyncExternalStore`
    - Non-component exports moved to `.ts` files (`ui/button-variants`, `badge-variants`, `tabs-variants`, `sidebar-context`, `shared/status-badge-variants`, `password-strength`, `layout/nav-groups`, `providers/theme-context`, page `shared-data` / `screens` files); public names unchanged
    - Components defined during render moved to lookups / module scope; hooks in story `render:` → named components; statement ternaries → `if`
    - Two stale-memo bugs fixed on the way: custom date ranges in Detection Feed (app + prototype) didn't re-filter after the first apply
    - One `eslint-disable` (with reason): `PasswordStrengthBar` re-exports `isStrongPassword` for the frozen legacy dev profile page
    - All 21 prototype pages load with no console errors; drawers/modals exercised headlessly (open A → B, reset on reopen, prefill)
  - [x] **run-analysis** lint errors fixed (2026-11-17) and the `--ignore-pattern` dropped: ESLint now runs on the whole repo with 0 problems and blocks PRs
  - [ ] `CameraFormModal` re-loads its form whenever its parent re-renders (`initial` is a new object each render) — pre-existing; key the reset on the camera id
- [ ] `/design-system-ops:accessibility-per-component` for keyboard and screen-reader notes

**Done when:** a PR that changes a token shows a visual diff of every affected component before merge, and CI is green on main.
**Then →** Phase 6.

---

## Phase 6: Make it reusable · L

**Why:** "future reuse" means another product can install the system instead of copying files.

- [x] **Decided** (2026-11-16): monorepo package `packages/ui` (`@accel/ui`, npm workspace); publish later only if a separate repo needs it
- [x] Dependency map (2026-11-16). **Package contents:** `ui/`, `shared/`, `charts/`, `custom/`, `layout/PageHeader`, tokens (`index.css`, `lib/tokens.ts`), `lib/{utils, formatters, dialCodes, playback}`, `hooks/use-mobile`. **Stays in the app:** the shell, `lib/{queryClient, quickActions, ruleTemplates, recordingTypes, timezones, zip}`, `hooks/{useGlobalSearch, useSystemStatus}`. **Peer deps:** react, react-dom, radix-ui, @base-ui/react (Button), class-variance-authority, clsx, tailwind-merge, lucide-react, cmdk, recharts, tailwindcss v4
  - The only leak — `AppLayout` / `AppSidebar` / nav groups in `layout/` (router, brand asset, app components) — moved to `components/app/` (30 import lines updated; stories now "App/…"). Design-system folders now import nothing from stores, mocks, pages, assets, providers, app components or the router
- [x] Extracted (2026-11-16) to `packages/ui`: `src/components/{ui,shared,charts,custom,layout}`, `src/lib/{utils,formatters,tokens,dialCodes,playback}`, `src/hooks/use-mobile`, `src/styles.css` (all tokens + theme + base; `@source "./"` so consumers scan it), `src/foundations`, `src/docs`, `test/`. Barrel `src/index.ts`; `exports` for `.`, `./styles.css`, `./*`; peer deps declared. Internal imports are relative (181 rewritten); ESLint blocks `@/…` and `@accel/ui` self-imports inside the package
  - App `src/index.css` now `@import "@accel/ui/styles.css"` + app-only styles (auth animations, toast tweak)
  - 469 imports in ~200 app/prototype files → `@accel/ui/…`. `aliases.ts` is shared by Vite (app + prototypes), Storybook and Vitest; compatibility aliases keep old `@/components/ui|shared|…` paths working for the uncommitted run-analysis / email-template work and the frozen legacy copies (27 files)
  - Tooling moved: token/slot/registry checks, ESLint scopes (one baseline key renamed, same count), Storybook globs, Vitest, tsconfigs, shadcn CLI (`components.json` → writes into the package)
  - Verified: both typechecks, lint, 14 tests, app build (package classes present in the CSS), Storybook build + a11y gate (216 × 2, 0 violations), all prototype pages render with unchanged content
- [x] Prototypes and app consume `@accel/ui`. **Done-when check passed:** a fresh Vite + React app (outside the repo) installing the packed tarball (`npm pack`) imports `Button, KpiCard, KpiGrid, StatusBadge, DataTable, Stepper` from `"@accel/ui"` + `@import "@accel/ui/styles.css"`, builds, and renders correctly in dark and light (fonts must be loaded by the app — documented in `packages/ui/README.md`)
  - [x] Remaining 27 files moved to `@accel/ui` imports and the compatibility aliases deleted (2026-11-17)
- [x] Versioning (2026-11-16): semver policy for a design system in `packages/ui/README.md#versioning` (major = removed/renamed/changed default; minor = new or deprecated; patch = fixes keeping documented behaviour); `packages/ui/CHANGELOG.md` (Keep a Changelog) with 0.1.0 as the baseline and the current deprecations listed; `scripts/check-changelog.mjs` (`npm run lint:changelog`) runs on PRs — package changes need an Unreleased entry or a version bump (tested: fails without, passes with entry / bump / first release). Release steps in the README
- [x] Theming guide (2026-11-16): `docs/theming.md` — override the 7-step brand ramp (`--palette-orange-*`) on `:root`, optionally `--font-sans` / `--radius`; contrast rules per ramp step; a teal example verified on the prototypes (buttons, nav, avatars, rings all switch; only logo artwork stays)

**Done when:** a fresh Vite app can `import { Button, KpiCard } from "@accel/ui"` + import the CSS, and render correctly in both themes; prototypes use the package, not relative paths.
**Then →** Phase 7.

---

## Phase 7: Futureproof · ongoing

**Why:** keep design, code and AI tools in sync as the product grows.

- [ ] **Figma**: create or link a library (`figma-component-bootstrapper` agent), mirror tokens as Figma variables (`/design-system-ops:figma-variable-audit`), and check parity with `/design-system-ops:design-to-code-check`
- [ ] **Token pipeline**: move to DTCG JSON + Style Dictionary **only when** a second platform needs tokens (email templates and PDFs already do: generate `lib/tokens.ts` and email CSS from one source instead of hand-syncing)
- [ ] **Governance**:
  - `/design-system-ops:contribution-workflow` (how to propose a new component)
  - `/design-system-ops:deprecation-process` (formalise what we did with `sev-*` → `severity-*`)
  - `/design-system-ops:decision-record` (ADRs for big calls: tiers, naming, packaging)
- [ ] **AI readiness**:
  - `/design-system-ops:ai-component-description` and `/design-system-ops:metadata-schema-generator`, so Claude and other agents pick the right component
  - `/design-system-ops:governance-encoder` turns the rules into CLAUDE.md / lint rules

### Recurring maintenance

| Cadence | Run | Looks for |
|---|---|---|
| Every PR | CI (Phase 5) | Lint, types, tests, visual diffs |
| Monthly | `/design-system-ops:drift-detection` | Code drifting from the system |
| Monthly | `/design-system-ops:token-compliance` | New hardcoded values |
| Quarterly | `/design-system-ops:system-health` | Overall health across all dimensions |
| Each release | `/design-system-ops:release-check` + `version-bump-advisor` | Breaking changes, changelog |

---

## Decisions you need to make

| When | Decision | Recommendation |
|---|---|---|
| ~~Phase 2~~ | ~~Brand orange contrast~~ | ✅ Decided: `primary-fill` for labelled fills, `primary-ink` for text |
| ~~Phase 2A~~ | ~~Page naming depth~~ | ✅ Decided: name page sections, not every element |
| Now | Dialog/sheet/popover text: keep 16px or use 13px `text-base`? | Probably 13px (matches the rest of the app). Check one dialog first |
| Phase 2B | Should email templates and PDF use the token pipeline? | Yes, via `src/lib/tokens.ts`; generate it later with Style Dictionary (Phase 7) |
| Phase 3 | `tone` vs `accent` vs `variant` naming | `variant` = style, `tone` = semantic colour, `size` = scale |
| Phase 6 | Monorepo package vs published npm package | Monorepo `packages/ui` first; publish later only if a separate repo needs it |
| Phase 7 | Is Figma the design source of truth? | If designers work in Figma: yes, sync variables from code tokens. If not: code-first, Storybook as the reference |
| Phase 7 | When to adopt DTCG / Style Dictionary | When email/PDF hex syncing becomes painful, or a native app appears |

---

## Critical path

```
0 ✅ → 1 ✅ → 2 ✅* → 2A ✅ (commit!) → 2B Prototypes → 2C Page sections → 3 Component APIs → 4 Docs → 5 Quality gates → 6 Package → 7 Futureproof
                ↑ *deprecated-alias removal waits on run-analysis commit + 2B
```

Rough remaining effort: **~4–5 weeks** part-time (one person). Next session's work (commit, 2B guardrails + codemods, 2C) is about 2–3 days and gets the main UI, the prototypes, fully onto the system.
