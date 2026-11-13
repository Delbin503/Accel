# Accel Design System — Roadmap

**Goal:** a design system that can be reused in other products and survives redesigns, new themes and new platforms without a rewrite.

**How to use this:** work top to bottom. Each phase ends with a **Done when** check. Tick boxes as you go. To continue, ask Claude: *"next step on the design system roadmap"*.

Sizes: **S** ≈ under half a day · **M** ≈ 1–2 days · **L** ≈ 3–5 days (one person; rough).

---

## ▶ Start here (next session)

*Updated 2026-11-13, end of day.*

**State of the branch:** Phases 0–2 are committed and pushed (Bitbucket `design-updates-nov-6`, last push `02d6687`). **Today's later work is NOT committed yet** (Phase 2A below): layer names on every component, the slot/registry checks and the page guardrails. Your own WIP (`run-analysis/index.tsx`, `runAnalysisReport.ts`, email templates, website files) is still uncommitted and was never touched.

**Do these in order:**

1. ~~Commit + push Phase 2A~~ ✅ `d70e0b7`
2. ~~Phase 2B: prototypes~~ ✅ tokens + raw elements done; needs committing
3. ~~Phase 2C: name page sections~~ ✅ done 2026-11-14 (1,331 section names in 167 page files); needs committing
4. Commit your run-analysis WIP when it's ready. That unblocks removing the deprecated aliases (end of Phase 2).
5. Then **Phase 3** (component APIs).

**Open questions for you** (none block the steps above):
- Dialogs, sheets and popovers render text at the browser default **16px**, because `body` sets no font size. Was 16px intended, or should it be the 13px `text-base`? It's a one-line fix either way.
- `DepartmentSelect` uses v3 syntax `w-[--radix-popover-trigger-width]`, which Tailwind v4 ignores, so the dropdown width is probably wrong. Fix it?
- Brand artwork (coin icon, sidebar logo, draw-zone placeholder) keeps raw hex. Add brand tokens, or leave it as artwork?

---

## Where we are (2026-11-13)

| Layer | Status | Evidence |
|---|---|---|
| Tokens | 🟢 Strong | 3 tiers (`--palette-*` → semantic → component), light/dark, elevation, media, fill/ink tokens; **0 WCAG AA text failures**; `npm run lint:tokens` |
| Guardrails (app `src/`) | 🟢 Strong | ESLint bans off-system classes; pages can't hand-roll primitives; component registry; every component element named. Debt baselined (572) |
| Layer naming | 🟢 Strong | 693 layers in 76 component files (every element); 1,331 section names in 167 page/prototype files |
| **Prototypes (the main UI)** | 🟢 Strong | Guardrails + type-check cover them; 0 token issues, 0 raw elements, 0 type errors (except your email WIP) |
| Primitives (`components/ui`) | 🟢 Strong | 26 shadcn components, 24 with stories |
| App composites (`components/shared`) | 🟠 Weak | 43 components, 10 with stories; design-system and app-only pieces mixed |
| Prop vocabulary | 🟠 Weak | `StatusBadge tone=`, `KpiCard accent=`, `Button variant=` |
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
- [ ] **Remove deprecated aliases.** ⏸ *Blocked on:* (a) your run-analysis work being committed, and (b) Phase 2B migrating the prototypes. Then delete every `DEPRECATED` / `@deprecated` line (`purple`, `sev-*`, `*-soft`, `primary-muted`, KpiCard/StatusBadge aliases) and run `npm run lint:prune`
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

- [ ] Run `/design-system-ops:component-audit` across `ui/`, `shared/`, `custom/`, `charts/`, `layout/`
- [ ] **Split `shared/`**:
  - **Design system** (reusable): StatusBadge, KpiCard, EmptyState, PageStates, SectionCard, DataTable, Toolbar, FilterDropdown/Panel, Modal/ModalForm/ConfirmDialog, OtpField, PhoneField, TimeSelect, ChoiceDropdown, DateRangeBar, ProgressRow, TruncatedText, FloatingBar, PasswordStrengthBar, …
  - **App** (Accel-specific): UserMenu, NotificationsBell/Drawer, RequireRole, RequireOnboarding, CommandPalette, DrawZoneModal, PaymentSuccessModal, SyncProgressModal, SystemStatusMenu, DownloadsIndicator, … → move to `components/app/` (or feature folders)
- [ ] **Unify prop vocabulary** with `/design-system-ops:component-api-validator`: one name per concept, e.g.
  - `variant` = visual style (solid/outline/ghost)
  - `tone` = semantic colour (success/warning/severity-critical/violet…), replacing `accent`
  - `size` = sm/md/lg
  - Codemod the call sites (`/design-system-ops:codemod-generator`)
- [ ] Run `/design-system-ops:naming-audit` on component names
- [ ] Add spacing role tokens (`p-card`, `gap-section`, `gap-inline`) once components share one rhythm (moved from Phase 2)
- [ ] Migrate raw `<button>` / `<input>` / `<table>` in `src/pages` to components (baseline: 384 / 47 / 19). Each migrated element gets its name for free
- [ ] Split `registry.json` into `design-system` vs `app` groups to match the folder split
- [ ] Write a decision tree for overlapping pieces (Modal vs Dialog vs Sheet; ChoiceDropdown vs Select vs FilterDropdown) with `/design-system-ops:component-decision-tree`

**Done when:** every component is in exactly one of design system / app; every design-system component uses the shared prop vocabulary; there's a written "which one do I use" decision tree.
**Then →** Phase 4.

---

## Phase 4: Documentation and Storybook · L

**Why:** a component nobody can find or understand gets rebuilt. Storybook is the catalogue other projects will browse.

- [ ] Stories for **every** design-system component (today: shared 10/43, custom 0/2, layout 0/3, charts 1/4). Each covers default, variants, sizes, and loading/empty/error states where data-driven
- [ ] Zero violations in the Storybook **a11y** panel (addon already installed)
- [ ] `/design-system-ops:token-documentation`: token reference pages generated from `index.css`
- [ ] `/design-system-ops:usage-guidelines`: do/don't for the top 10 components
- [ ] `/design-system-ops:pattern-documentation`: page patterns (list page = KPI row + toolbar + table + drawer; detail drawer; wizard)
- [ ] Update the Introduction story with the tier model, naming rules and roadmap link
- [ ] Run `/design-system-ops:docs-coverage` to check for gaps

**Done when:** docs-coverage shows every design-system component has a story and usage notes; a11y panel is clean; a newcomer can build a list page from Storybook alone.
**Then →** Phase 5.

---

## Phase 5: Quality gates · M

**Why:** futureproof = you can change things safely. Without tests, every token tweak is a gamble.

- [ ] Add Vitest + Testing Library; interaction tests for stateful components (DataTable sort/paginate, FilterPanel, OtpField, Modal focus trap, TimeSelect)
- [ ] Visual regression via Chromatic (addon already installed): snapshot every story in light **and** dark
- [ ] Storybook a11y checks run in CI (`@storybook/test-runner` + axe)
- [ ] `/design-system-ops:cicd-integration`: CI on every PR runs lint, typecheck, tests, Storybook build, Chromatic
- [ ] `/design-system-ops:accessibility-per-component` for keyboard and screen-reader notes

**Done when:** a PR that changes a token shows a visual diff of every affected component before merge, and CI is green on main.
**Then →** Phase 6.

---

## Phase 6: Make it reusable · L

**Why:** "future reuse" means another product can install the system instead of copying files.

- [ ] **Decide** packaging (see Decisions): monorepo package `packages/ui` (recommended) vs published npm package
- [ ] `/design-system-ops:codebase-index`: dependency map, so nothing app-specific leaks into the package
- [ ] Extract: tokens (`index.css` + `lib/tokens.ts`), `ui/`, design-system part of `shared/`, `charts/`, formatters, `cn()` → package with a barrel export and `peerDependencies` (react, tailwind, radix)
- [ ] Point `prototypes/` at the package as the first consumer (proves it works outside the app)
- [ ] Versioning: semver + `CHANGELOG.md`; use `/design-system-ops:version-bump-advisor` and `/design-system-ops:release-check` before each release
- [ ] Theming hook for other brands: document which semantic tokens a product overrides (`--primary`, `--palette-*` brand ramp) to re-skin

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
