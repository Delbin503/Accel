# Accel Design System — Roadmap

**Goal:** a design system that can be reused in other products and survives redesigns, new themes and new platforms without a rewrite.

**How to use this:** work top to bottom. Each phase ends with a **Done when** check. Don't start the next phase until it passes, because later phases build on earlier ones. Tick boxes as you go. To continue, ask Claude: *"next step on the design system roadmap"*.

Sizes: **S** ≈ under half a day · **M** ≈ 1–2 days · **L** ≈ 3–5 days (one person; rough).

---

## Where we are (2026-11-13)

| Layer | Status | Evidence |
|---|---|---|
| Tokens | 🟡 Functional | Three tiers in `src/index.css` (palette → semantic → component); light/dark; elevation; naming rules. Open: contrast gaps, deprecated aliases, tier-3 audit items |
| Primitives (`components/ui`) | 🟢 Strong | 26 shadcn components, 24 with stories |
| App composites (`components/shared`) | 🟠 Weak | 43 components, **10 with stories**. Generic pieces (KpiCard, StatusBadge, OtpField) mixed with app-only ones (UserMenu, RequireRole, NotificationsBell) |
| Other component folders | 🟠 Weak | `custom` 0/2 stories, `layout` 0/3, `charts` 1 story for 4 charts |
| Prop vocabulary | 🟠 Weak | Same concept, different names: `StatusBadge tone=`, `KpiCard accent=`, `Button variant=` |
| Guardrails | 🟠 Weak | ESLint blocks `text-[Npx]` only. Nothing blocks raw palette, old shadows or deprecated names |
| Tests | 🔴 Absent | 0 test files. Storybook a11y and Chromatic addons installed but not wired into CI |
| Reuse outside this app | 🔴 Absent | Design system lives inside the app's `src/`; `prototypes/` imports by path |
| Design ↔ code | 🔴 Absent | No Figma library linked (`SHARED_CONTEXT.md` placeholder) |

Reference: [TOKEN-AUDIT-2026-11-13.md](TOKEN-AUDIT-2026-11-13.md) (all token findings + remediation log).

---

## Phase 0: Lock in today's work · S

**Why:** ~115 files of token work are uncommitted and mixed with in-progress feature work (run-analysis, email templates). Every day this sits, separating them gets harder.

- [x] Commit token work only, leaving run-analysis/email-template/website files unstaged: `ac79a97` (tokens + migrations) and `6b60b13` (docs). Kept as one code commit, because the three rounds touched the same files and depend on each other
- [ ] Push to your branch

**Done when:** `git status` shows only your feature work, and the token commits stand alone.
**Then →** Phase 1.

---

## Phase 1: Guardrails, so the system stays clean · S–M

**Why:** without enforcement, every new screen (human- or AI-written) erodes the tokens. Everything after this phase is protected by it.

- [ ] Extend ESLint `no-restricted-syntax` (same mechanism as the `text-[Npx]` ban) to block in `className`:
  - Tailwind's built-in colours: `bg|text|border-(red|neutral|orange|…)-NNN`, `bg-white`, `text-black`
  - Old shadow sizes `shadow-sm … shadow-2xl`
  - Deprecated names: `sev-*`, `purple`, `*-soft`, `primary-muted`
  - Arbitrary `z-[N]` and `rounded-[Npx]`
- [ ] Block `var(--palette-*)` anywhere outside `src/index.css`
- [ ] Add a stylelint `custom-property-pattern` for `index.css` matching the naming rules in its header
- [ ] Record the current violation count as a baseline (don't fix yet; Phase 2 does)
- [ ] Add a `.ds-ops-config.yml` so design-system-ops skills know the stack (copy from `~/.claude/skills/design-system-ops/ds-ops-config.example.yml`)

**Done when:** `npm run lint` fails on a new `bg-red-500` or `shadow-lg`, and existing violations are listed with a count.
**Then →** Phase 2.

---

## Phase 2: Finish the tokens · M

**Why:** tokens are the foundation for everything else. Fix them before documenting or packaging, so they aren't renamed twice.

- [ ] **Contrast:** run `/design-system-ops:theme-audit`. Known gaps: light `text-primary` 2.99:1 (≈1,100 uses; add a darker text-only brand ink), dark `violet` 4.43:1, dark `destructive` 4.09:1
- [ ] **Hardcoded values:** run `/design-system-ops:token-compliance`, then fix the Phase 1 baseline: ~20 raw palette classes (mostly camera overlays → add a `camera-overlay` token set), `z-10/50/[100]`, `duration-200`, `rounded-[1px]`
- [ ] **Tier-3 audit items:** define `--radius-xs`; delete unused `src/App.css`; route `bg-camera-feed` gradient through palette tokens; add spacing role tokens (`p-card`, `gap-section`, `gap-inline`) from the documented rhythm
- [ ] **Remove deprecated aliases.** Prerequisite: your run-analysis work is merged. Migrate `prototypes/` (47 files) and run-analysis, then delete every `DEPRECATED` / `@deprecated` line (`purple`, `sev-*`, `*-soft`, `primary-muted`, KpiCard/StatusBadge aliases)
- [ ] Re-run `/design-system-ops:token-audit` to confirm

**Done when:** theme-audit shows no AA failures in either theme; lint baseline from Phase 1 is zero; `grep -r DEPRECATED src/index.css` returns nothing.
**Then →** Phase 3.

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
| Phase 2 | Light-mode brand text: darker ink for text only, or darken `--primary` everywhere? | Text-only ink (`--primary-text`); buttons keep the bright brand orange |
| Phase 3 | `tone` vs `accent` vs `variant` naming | `variant` = style, `tone` = semantic colour, `size` = scale |
| Phase 6 | Monorepo package vs published npm package | Monorepo `packages/ui` first; publish later only if a separate repo needs it |
| Phase 7 | Is Figma the design source of truth? | If designers work in Figma: yes, sync variables from code tokens. If not: code-first, Storybook as the reference |
| Phase 7 | When to adopt DTCG / Style Dictionary | When email/PDF hex syncing becomes painful, or a native app appears |

---

## Critical path

```
0 Commit → 1 Guardrails → 2 Finish tokens → 3 Component APIs → 4 Docs → 5 Quality gates → 6 Package → 7 Futureproof
                              ↑ needs run-analysis work merged (to remove deprecated aliases)
```

Rough total: **~4–6 weeks** part-time (one person), most of it in Phases 3–6. Phases 0–2 (~1 week) give the biggest protection for the least effort.
