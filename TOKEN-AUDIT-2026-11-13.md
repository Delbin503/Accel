# Accel token audit — 2026-11-13

Accel's semantic layer is strong. It is well named, theme-aware for surfaces, and heavily used. But there is no primitive tier underneath it, so all ~100 raw values are typed straight into the semantic tokens. Three structural problems sit on top of that: (1) the status/severity colors are aliases-by-copy of each other, and `sev-high` is indistinguishable from the brand orange; (2) the `-soft` tint tokens lost to ad-hoc opacity modifiers, about 650 of them on status colors alone; (3) there is no elevation or spacing tier at all. Fix the primitive layer first, because every other fix gets cheaper once it exists.

> **Remediation log, 2026-11-13: "Fix first" tier done.**
> - TA-01 ✅ Primitive tier added to `src/index.css` (neutral, orange, feedback and categorical scales). All semantic/component tokens are now `var()` references, and `.dark` overrides only semantic tokens. Resolved values were verified identical (≤1/255) in both themes, except `sev-high`.
> - TA-02 ✅ `sev-medium` → `var(--warning)`, `sev-low` → `var(--info)`, all `-soft` tints derived via `color-mix` + `--soft-alpha` (12% light / 15% dark). `sev-high` moved to `--tangerine-500` `hsl(30 95% 52%)`, off the brand hue. `destructive` vs `sev-critical` is kept as a documented intentional divergence (softened action color in dark).
> - TA-03 ✅ partially. `src/lib/tokens.ts` holds the paper palette; the `CaseDrawer` PDF export uses it (printed "low" severity now blue to match screen, was green). Floor-plan SVG in `SiteDetailDrawer` uses `var(--primary|success|sev-critical|destructive)`. **Open:** `run-analysis/runAnalysisReport.ts` (uncommitted work in progress, left untouched), `mocks/sites.ts` `AREA_PALETTE` (user data), always-dark map neutrals (`#0f1115`, `#9CA3AF`).
> - Also: TA-10 `secondary: var(--muted)`, TA-13 `:root` comment fixed.

> **Remediation log, 2026-11-13: "Fix next" tier.**
> - TA-07 ✅ Feedback and severity tokens are theme-aware. Light uses ink primitives (`--green-700`, `--amber-700`, `--blue-600`, `--violet-600`, `--red-600`, `--tangerine-700`); all clear 4.5:1 on cards and the page background. Dark keeps the bright 500s. `destructive` light → `--red-600`.
> - TA-04 ✅ 73 `*-soft` / `primary-muted` uses in 21 files → opacity modifiers (`/15`, `/10`). The tint scale is documented in `index.css` + CLAUDE.md. The `-soft` tokens are kept as **deprecated** aliases for `prototypes/` and `run-analysis/index.tsx` (uncommitted work in progress, untouched).
> - TA-05 ✅ `--elevation-raised/overlay/modal` (deeper in dark) → `shadow-raised/overlay/modal` utilities; 42 call sites migrated incl. 15 shadcn primitives (commented). Left: 3 auth logo badges (`shadow-lg shadow-secondary` colored glow), `run-analysis` WIP. New Storybook story: Foundations › Elevation.
> - TA-09 ✅ Button `default` now uses `hover:bg-primary-hover active:bg-primary-active` (previously only `<a>` buttons had hover); `--destructive-foreground` added and used by Badge.
> - TA-08 ✅ `purple` → `violet` (decided: categorical tone name). 129 references in 28 files: token, `bg/text/border-violet` classes, `tone`/`accent` prop values, `PRINT_TONE.violet`. Deprecated aliases kept: `--purple`, `--purple-soft`, `bg-purple*` utilities and `"purple"` in `KpiCard`/`StatusBadge`, for `prototypes/` (38 refs) and `run-analysis/index.tsx` (WIP, untouched).
> - New observation: light-mode `text-primary` (brand orange on white) is 2.99:1, below AA for body text. Dark-mode `purple` (4.43) and `destructive` (4.09) are just under 4.5 on cards.

> **Naming fixes, 2026-11-13.**
> - Primitives prefixed: `--{hue}-{step}` → `--palette-{hue}-{step}` (83 refs, index.css only). They no longer look like Tailwind's built-in `neutral-900`/`red-500`.
> - `sev-*` → `severity-*`: 695 class/prop refs + 13 dynamic `var(--severity-${…})` in 97 files. `KpiAccent` values renamed. Deprecated aliases kept (`--sev-*`, `bg-sev-*`, `accent="sev-critical"`) for prototypes/ (47 files) and run-analysis WIP.
> - `shadow-overlay` → `shadow-floating` (`--elevation-floating`), so it no longer collides with `--z-overlay` (the backdrop layer). 14 refs.
> - Naming rules are written into the index.css header and CLAUDE.md.

*Baseline audit — no `.ds-ops-config.yml`, so default severities apply. Trend analysis will be available from the next run.*

---

## Discovery

```
Token sources found:
- src/index.css  @theme inline     95 declarations (fonts, type scale, ease, duration, z-index, color bridge, radius)
- src/index.css  :root  (light)    51 declarations (raw HSL values)
- src/index.css  .dark             50 declarations (raw HSL values)
- src/components/charts/palette.ts  CHART_PALETTE → var(--chart-1…5)   (correct — references only)
- src/App.css                      Vite scaffold leftovers: --accent-bg, --accent-border, --social-bg, --text-h, --shadow
                                   (none defined; file not imported anywhere)
- Hardcoded parallel palettes in TS: CaseDrawer.tsx (PRINT_SEVERITY hex), SiteDetailDrawer.tsx (markerFill hex),
                                   mocks/sites.ts (zone colors hex), runAnalysisReport.ts (email/print hex)
Total: ~196 declarations in one CSS file (≈110 unique token names) + 4 hex palettes in TS
```

Tokens are mostly centralized: one CSS file, with Tailwind v4 `@theme inline` bridging to the `:root`/`.dark` values. That is the right shape. The fragmentation is the hex palettes in TS that duplicate token values for print, PDF, email and SVG contexts.

## Orphan detection

```
- 52 color tokens checked against app source (stories excluded)
- 49 referenced at least once
- 3 orphaned: --primary-active, --sidebar-primary, --sidebar-primary-foreground
- Near-orphans (1 use): --chart-1…5 (only via palette.ts), --card-foreground, --warning-soft
```

The orphan rate is low (~6%), so no cleanup pass is needed before the structural work. The near-orphan `-soft` tokens are the more interesting story (TA-04).

---

## Token audit report

### Summary

The semantic layer does its job. Names like `background`, `muted-foreground`, `destructive` and `sev-critical` describe roles, the Tailwind bridge makes them the path of least resistance, and usage confirms it (`muted-foreground` 2,169 refs, `foreground` 1,140, `primary` 1,139). Arbitrary `text-[Npx]` sizes are nearly gone (6 left). The problem is underneath: no primitive palette exists. `hsl(20 95% 55%)` is typed five times in light mode and five more in dark. `warning` and `sev-medium` hold the same literal rather than one referencing the other, and the brand orange doubles as "high severity". A rebrand or palette tweak today means hand-editing ~20 lines and hoping you caught every copy. That includes the hex copies in TS, which you would certainly miss.

### Tier structure

| Tier | Status | Notes |
|---|---|---|
| Primitive | ❌ absent | No `--orange-500`, `--gray-*` etc. All values are inline HSL in semantic tokens. Type scale, duration, z-index and radius *are* primitive-style scales (✅). |
| Semantic | ✅ present | 52 color roles + bridge, theme-aware for surfaces. Gaps: elevation, spacing, focus, disabled, `destructive-foreground`. |
| Component | ⚠️ partial | Only `sidebar-*` (8 tokens). Reasonable scope, since there are no white-label requirements, so the lack of others is not a finding. `bg-camera-feed` is a de facto component token, defined as a utility with raw HSL. |
| Tier leakage | 7 instances | `sidebar-primary`/`sidebar-ring` and `chart-1` duplicate primary's raw value instead of referencing `--primary`; status pairs duplicate each other (TA-02). |

### Check results

| Check | Result | Evidence |
|---|---|---|
| Descriptive vs prescriptive naming | ⚠️ WARN | `--purple` / `--purple-soft` name a hue, not a role (used for "action-taken" cases, recording type chips, run-analysis panels) |
| Tier leakage | ❌ FAIL | Sidebar, chart and status tokens copy raw values instead of referencing |
| Ambiguity | ⚠️ WARN | `accent` (shadcn convention: hover tint, not brand accent), `secondary` ≡ `muted` in both themes, `-soft` vs `-muted` suffixes for the same concept |
| Platform suffix abuse | ✅ PASS | None |
| Hardcoded values at semantic tier | ❌ FAIL | All 101 `:root`/`.dark` values are raw HSL (expected, given no primitives) |
| Duplicate raw values | ❌ FAIL | 11 literals repeated in `:root`; `hsl(20 95% 55%)` ×5 |
| Out-of-tier references | ✅ PASS | No semantic → component references |
| Interaction states | ⚠️ WARN | `primary` has hover/active; nothing else does. No `disabled`, `focus` or `selected` tokens. `primary-active` is declared but unused. |
| Theme aliases | ⚠️ WARN | Surfaces swap per theme; status, severity, chart and primary values are identical in light and dark |
| Elevation / spacing coverage | ❌ FAIL | No shadow tokens (65 raw `shadow-*` uses across 7 sizes); spacing rhythm only exists as a comment |

---

### Findings

**TA-01 · 🟠 High · Value — No primitive tier**
Every color is a raw HSL literal in a semantic slot.
*Example:* `--primary`, `--ring`, `--sev-high` (≈), `--chart-1`, `--sidebar-primary`, `--sidebar-ring` all hard-code `hsl(20 95% 55%)` (and again in `.dark`).
*Action:* Add a primitive palette block (`--orange-50…950`, `--neutral-0…1000`, `--red-*`, `--amber-*`, `--green-*`, `--blue-*`, `--violet-*`) and rewrite semantic tokens as `var()` references. See the recommended structure below.

**TA-02 · 🟠 High · Value — Status and severity tokens are copies, not aliases, and `sev-high` collides with brand**
*Examples:*
- `--warning` ≡ `--sev-medium` = `hsl(40 96% 50%)`
- `--info` ≡ `--sev-low` = `hsl(214 87% 60%)`
- `--destructive` ≡ `--sev-critical` = `hsl(0 84% 60%)` (light only; dark diverges to `0 70% 55%`, so they now drift)
- `--sev-high` = `hsl(21 95% 55%)` vs `--primary` = `hsl(20 95% 55%)`: a 1° hue difference, visually identical

A "high" severity pill reads as a brand-orange button/link. In a surveillance product where severity is the primary signal, that is a real usability issue, not just a token-hygiene one.
*Action:* Decide intentionally: either `--sev-medium: var(--warning)` (an explicit alias), or keep them separate with distinct values. Move `sev-high` off the brand hue (e.g. a red-orange `hsl(12 …)` or amber-orange) so brand ≠ alarm.

**TA-03 · 🟠 High · Coverage — Hardcoded parallel palettes in TS**
*Examples:* `CaseDrawer.tsx:732` `PRINT_SEVERITY` (`#b91c1c`, `#fef2f2` …), `SiteDetailDrawer.tsx:67` `markerFill: "#22C55E" / "#E15554"`, `SiteDetailDrawer.tsx:103` `stroke="#DD7224"`, `mocks/sites.ts:11` zone palette (`#DD7224`, `#508CB4` …), `runAnalysisReport.ts` (43 literals).
Some of these are legitimate: print, PDF and email can't read CSS vars. But they're unlinked copies, and `#DD7224` isn't even the current primary.
*Action:* Export a `src/lib/tokens.ts` with resolved primitive hex values (generated from, or kept beside, the CSS primitives) and import it wherever a raw value is genuinely required. SVG on-screen fills (`markerFill`) should use `var(--success)` etc.

**TA-04 · 🟡 Medium · Coverage — `-soft` tint tokens bypassed by opacity modifiers**
*Example:* status colors use opacity modifiers (`bg-success/10`, `border-sev-critical/30` …) ~650 times, plus 347 on `primary`, against 46 uses of the `-soft` tokens (74 including `primary-muted`). The `bg-*` opacities drift: `/5` 42×, `/10` 208×, `/15` 189×, `/20` 14×, `/25`, `/30`.
The `-soft` tokens are also theme-aware (0.12 light / 0.15 dark), which the `/15` modifiers silently override.
*Action:* Pick one model. Recommended: keep the opacity-modifier pattern (it's what the team reaches for), drop the `-soft` tokens, and standardize on two steps documented as tokens (`--tint-subtle: 10%`, `--tint-strong: 15%` via `color-mix`). Alternatively, enforce `-soft` with an ESLint rule. Either way, it should not be both.

**TA-05 · 🟡 Medium · Coverage — No elevation tokens**
*Example:* 65 raw shadow uses spread over 7 sizes (`shadow` 21, `shadow-sm` 11, `shadow-lg` 11, `shadow-xs` 10, `shadow-md` 5, `shadow-2xl` 5, `shadow-xl` 2). Tailwind's default shadows are black-based and nearly invisible on the dark theme (the default).
*Action:* Add `--shadow-raised`, `--shadow-overlay`, `--shadow-modal` (theme-aware: lighter alpha and a hairline ring in dark), mapped in `@theme` as `--shadow-*` so `shadow-overlay` becomes a utility.

**TA-06 · 🟡 Medium · Coverage — Spacing rhythm exists only as a comment**
*Example:* `index.css:74–78` documents card `p-4`, section `gap-3`, inline `gap-1.5`, page `space-y-4`, but nothing enforces or names it. Arbitrary spacing is rare (1 `p-[3px]`), so Tailwind's 4px scale is effectively your primitive tier, which is fine.
*Action:* Add a small semantic spacing layer only for the documented roles (`--spacing-card`, `--spacing-section`, `--spacing-inline`, `--spacing-page`) so `p-card` / `gap-section` utilities exist. Don't tokenize the whole scale.

**TA-07 · 🟡 Medium · Value — Status, severity and chart colors are not theme-aware**
*Example:* `.dark` comment: "Severity tokens — same hues, dark mode unchanged". Light-mode `text-warning` (`hsl(40 96% 50%)`) on white is ≈2.0:1 and `text-success` ≈2.3:1, both below the 4.5:1 AA threshold for text. `text-warning` is used 326 times.
*Action:* Add darker light-mode text variants (`--warning-fg`, or simply shift light `--warning` to `hsl(35 92% 33%)`-ish and keep the bright value for fills/dots). Run `/design-system-ops:theme-audit` for the full contrast pass.

**TA-08 · 🟡 Medium · Naming — Hue-named semantic token `purple`**
*Example:* `--purple`, `--purple-soft`, used for the "action-taken" case status, recording type chips and run-analysis highlights (≈130 refs).
*Action:* Rename by role. If it means "AI / analysis / model output", use `--ai` / `--ai-soft`. If it's a categorical fifth status, use `--status-review`. Codemod-able (`/design-system-ops:codemod-generator`).

**TA-09 · 🟡 Medium · Coverage — Missing interaction-state tokens**
*Example:* `--primary-hover` exists (3 uses) and `--primary-active` exists (0 uses). There is no `destructive-hover`, `destructive-foreground`, `disabled-*` or `focus-ring` beyond `--ring`.
*Action:* Add `--destructive-foreground` (shadcn v4 dropped it, but Accel's destructive buttons need a defined on-color). Either adopt `primary-active` in Button or delete it. Add `--disabled-opacity` or `--disabled-fg` only if Button/Input don't already standardize it.

**TA-10 · ⚪ Low · Naming — `secondary` ≡ `muted` and the `-soft` / `-muted` suffix split**
*Example:* `--secondary` and `--muted` are both `hsl(0 0% 92%)` / `hsl(0 0% 13%)`. `--primary-muted` and `--sev-*-soft` mean the same thing (translucent tint).
*Action:* Make `--secondary: var(--muted)` explicit (shadcn needs both names). Rename `--primary-muted` → `--primary-soft` to match the rest.

**TA-11 · ⚪ Low · Coverage — Orphans and dead files**
*Example:* `--primary-active`, `--sidebar-primary`, `--sidebar-primary-foreground` are unused. `src/App.css` is an unimported Vite scaffold that references 5 undefined vars (`--accent-bg`, `--social-bg`, `--text-h` …) and sets `font-size: 16px`.
*Action:* Delete `App.css`. Keep the `sidebar-primary*` pair (shadcn's Sidebar expects it) but point it at `var(--primary)`.

**TA-12 · ⚪ Low · Value — Raw values in utilities and the token bridge**
*Examples:* `bg-camera-feed` (`hsl(24 50% 11%)`, `hsl(0 0% 10%)`); `--radius-xs` is used (`rounded-xs` 2×) but not defined in `@theme` (it falls back to Tailwind's default); `rounded-[1px]` / `rounded-[2px]` 7×; a few `z-10` / `z-50` / `z-[100]` remain alongside the `--z-*` scale; `duration-200` 12× vs the `--duration-normal` (200ms) token.
*Action:* Route the camera-feed gradient through primitives, then run `/design-system-ops:token-compliance` to sweep the z/duration/radius stragglers.

**TA-13 · ⚪ Low · Naming — Misleading comment on `:root`**
*Example:* `index.css:151` says "applied when `<html class="light">`", but `:root` always applies; `.dark` overrides it.
*Action:* Reword the comment to "base (light) values; `.dark` overrides".

---

### Dependency map (blast radius)

| Token | Refs | Risk |
|---|---|---|
| `muted-foreground` | 2,169 | Very high: any value change shifts most secondary text |
| `foreground` / `primary` | ~1,140 each | Very high |
| `border` | 879 (+ `*` base layer) | Very high |
| `sev-critical` | 675 (+200 via `/N`) | High: alarm color across the feed, cases and live monitoring |
| `muted`, `success`, `warning`, `info` | 290–450 | High |
| `purple` | ~130 incl. modifiers | Medium: the rename codemod touches ~10 files |
| `chart-1…5` | 1 each (palette.ts) | Low: single choke point, safe to change |
| `sidebar-*` | 0–16 | Low |

Introducing primitives (TA-01) changes **no resolved values**, so it carries zero visual risk despite touching the highest-fan-out tokens. TA-02 and TA-07 *do* change values for `sev-high`, `warning` and `success`. Screenshot-diff the detection feed, cases and live monitoring before shipping those.

---

### DTCG readiness (informational)

Accel isn't on DTCG and has no build pipeline (Style Dictionary or similar), so this section is informational only.

- **Tokens needing `$type`:** ~110 unique: 52 color, 22 dimension (type scale + line heights), 7 dimension (radius), 3 duration, 2 cubicBezier, 8 number (z-index), 3 fontFamily.
- **Composites:** the 11 type-scale size + line-height pairs map naturally to DTCG `typography` composites. There are no shadow/border/transition composites yet (TA-05 would add shadow).
- **Modes:** light/dark map to a resolver with 2 modes. Today, only ~25 of 52 color tokens actually differ between modes.
- **Color space:** all sRGB HSL. OKLCH primitives would make the hover/active ramps (`primary` → `-hover` → `-active`) perceptually even. Optional.

**Recommendation:** don't migrate to DTCG JSON now. One CSS file with Tailwind v4 `@theme` is a good source of truth for a single-app system. Revisit if you need Figma variable sync, or the same tokens in emails/PDF at scale. At that point, Style Dictionary → `index.css` + `tokens.ts` would also solve TA-03.

---

## Recommended token structure for Accel

Keep the single-file, three-block shape you already have. Add a primitive block underneath and make semantic tokens reference it.

```css
/* ── 1. PRIMITIVES — raw values, never used in components ───────────── */
:root {
  /* Brand */
  --orange-50:  hsl(20 95% 95%);   --orange-100: hsl(20 95% 90%);
  --orange-400: hsl(20 95% 62%);   --orange-500: hsl(20 95% 55%);
  --orange-600: hsl(20 95% 48%);   --orange-700: hsl(20 95% 40%);
  --orange-900: hsl(20 80% 12%);
  /* Neutrals (dark-first product: dense low end) */
  --neutral-0: hsl(0 0% 100%);  --neutral-50: hsl(0 0% 97%);  --neutral-100: hsl(0 0% 96%);
  --neutral-200: hsl(0 0% 92%); --neutral-300: hsl(0 0% 85%); --neutral-500: hsl(0 0% 60%);
  --neutral-600: hsl(0 0% 40%); --neutral-850: hsl(0 0% 15%); --neutral-870: hsl(0 0% 13%);
  --neutral-910: hsl(0 0% 9%);  --neutral-930: hsl(0 0% 7%);  --neutral-950: hsl(0 0% 5%);
  /* Status hues — fill (500) + readable-text (700) per hue */
  --red-500: hsl(0 84% 60%);     --red-700: hsl(0 72% 42%);
  --amber-500: hsl(40 96% 50%);  --amber-700: hsl(32 92% 33%);
  --green-500: hsl(142 70% 45%); --green-700: hsl(142 72% 29%);
  --blue-500: hsl(214 87% 60%);  --blue-700: hsl(221 83% 45%);
  --violet-500: hsl(270 95% 65%);--violet-700: hsl(270 70% 45%);
  --vermilion-500: hsl(10 90% 55%);  /* new: sev-high, distinct from brand */
}

/* ── 2. SEMANTIC — roles; the only layer that swaps per theme ──────── */
:root {
  /* surfaces */   --background: var(--neutral-50); --card: var(--neutral-0); …
  /* brand */      --primary: var(--orange-500); --primary-hover: var(--orange-600);
                   --primary-active: var(--orange-700); --ring: var(--primary);
  /* feedback */   --success: var(--green-500);  --success-fg: var(--green-700);
                   --warning: var(--amber-500);  --warning-fg: var(--amber-700);
                   --info: var(--blue-500);      --danger: var(--red-500);
                   --destructive: var(--danger); --destructive-foreground: var(--neutral-0);
  /* severity */   --sev-critical: var(--danger); --sev-high: var(--vermilion-500);
                   --sev-medium: var(--warning);  --sev-low: var(--info);
  /* role, was purple */ --ai: var(--violet-500);
  /* elevation */  --shadow-raised:  0 1px 2px hsl(0 0% 0% / .06);
                   --shadow-overlay: 0 8px 24px hsl(0 0% 0% / .12);
                   --shadow-modal:   0 16px 48px hsl(0 0% 0% / .18);
  /* tint steps */ --tint-subtle: 10%; --tint-strong: 15%;
}
.dark { /* only semantic tokens are overridden here — never primitives */
  --background: var(--neutral-930); --card: var(--neutral-910); …
  --success-fg: var(--green-500); --warning-fg: var(--amber-500);   /* bright text is fine on dark */
  --shadow-overlay: 0 0 0 1px hsl(0 0% 100% / .06), 0 8px 24px hsl(0 0% 0% / .5);
}

/* ── 3. COMPONENT — only where a real override point is needed ─────── */
:root {
  --sidebar-primary: var(--primary);  --sidebar-ring: var(--ring);
  --chart-1: var(--primary); --chart-2: var(--info); …
  --camera-feed-from: hsl(24 50% 11%); --camera-feed-to: var(--neutral-910);
}

/* ── @theme inline bridge — unchanged pattern, plus new utilities ──── */
@theme inline {
  --color-sev-high: var(--sev-high);  --color-ai: var(--ai);  --color-warning-fg: var(--warning-fg); …
  --shadow-raised: var(--shadow-raised); --shadow-overlay: var(--shadow-overlay); --shadow-modal: var(--shadow-modal);
  --spacing-card: 1rem; --spacing-section: 0.75rem; --spacing-inline: 0.375rem;
  --radius-xs: calc(var(--radius) * 0.4);
}
```

Plus `src/lib/tokens.ts`: a hex export of the primitives for print, PDF, email and SVG-on-canvas contexts (closes TA-03).

---

## Remediation priority

**1. Fix first: structural, affects downstream consumers**
- TA-01 Add primitive tier; rewrite semantics as references (zero visual change)
- TA-02 Explicit status/severity aliases; move `sev-high` off brand orange
- TA-03 `lib/tokens.ts` for the hex palettes

**2. Fix next: debt that compounds**
- TA-07 Light-mode readable status text (`-fg` tokens)
- TA-04 Settle `-soft` vs `/N` opacity
- TA-05 Elevation tokens
- TA-08 Rename `purple` → role name
- TA-09 Interaction-state tokens

**3. Address eventually**
- TA-06 Spacing role tokens · TA-10 `secondary`/`muted` alias, suffix naming · TA-11 Orphans + delete `App.css` · TA-12 Utility raw values and stragglers · TA-13 Comment fix

## Effort estimates

| Finding | Estimate | Assumptions | Confidence |
|---|---|---|---|
| TA-01 | 3–5 h | Single file, no value changes; verify with before/after screenshots of Storybook `Colors` story | High |
| TA-02 | 2–4 h token side + 2–3 h visual QA | Product agrees on a new `sev-high` hue; no consumer code changes since names stay | Medium |
| TA-03 | 3–6 h | Print/email contexts keep hex; on-screen SVGs switch to `var()` | Medium |
| TA-07 | 2–4 h + review of ~326 `text-warning` / ~438 `success` uses | Swap only where used as text; fills keep bright values | Medium |
| TA-04 | 4–10 h | Range depends on direction: dropping `-soft` ≈ 4 h, enforcing `-soft` over ~650 modifiers ≈ 10 h with a codemod | Low (decision-dependent) |
| TA-05 | 3–5 h | 65 call sites map onto 3 levels | Medium |
| TA-08 | 1–2 h | Codemod over ~10 files | High |
| TA-09 | 1–3 h | Limited to Button/destructive variants | Medium |
| Tier 3 (TA-06, 10–13) | 3–6 h total | — | Medium |

Token-side estimates only. Consumer migration (TA-04, TA-07) is called out separately because it scales with call sites. Total ≈ 25–50 h, which is about 4–8 days at 6 productive hours per day.

---

> **A note on context:** This audit sees your token files — it does not see the decisions behind them. Some findings may flag patterns your team chose deliberately. If any finding describes an intentional decision, let me know — I'll exclude it from future runs and learn your system's conventions. The goal is to surface problems you haven't seen yet, not to second-guess choices you've already made.
