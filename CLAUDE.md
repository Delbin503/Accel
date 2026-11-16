# Dashboard Project — AI Coding Rules

This is a **React + TypeScript dashboard**. All code generated here must follow these conventions exactly so components are consistent, composable, and drop-in ready across the project.

---

## Tech Stack

| Tool | Purpose |
|------|---------|
| React + TypeScript + Vite | App framework and bundler |
| Tailwind CSS v4 | Styling — `@tailwindcss/vite` plugin, CSS-first config |
| shadcn/ui | Base design system — owns `packages/ui/src/components/ui/` |
| TanStack Query | Server state — data fetching, caching, loading/error states |
| Zustand | Client state — UI state, preferences, ephemeral app state |
| Lucide React | Icons — only icon library used in this project |
| Recharts | Charts — all chart components live in `components/charts/` |

---

## Folder Structure

```
packages/ui/                 # @accel/ui — the design system (npm workspace; see packages/ui/README.md)
├── src/
│   ├── components/
│   │   ├── ui/          # shadcn primitives — managed by shadcn CLI, we own the code
│   │   ├── shared/      # reusable design-system composites
│   │   ├── custom/      # custom components built on shadcn patterns (see conventions below)
│   │   ├── layout/      # reusable page structure (PageHeader)
│   │   └── charts/      # Recharts-based chart components
│   ├── lib/             # cn(), formatters, tokens (paper palette), dialCodes, playback
│   ├── hooks/           # use-mobile
│   ├── foundations/     # Storybook: token reference, type, colour, motion…
│   ├── docs/            # Storybook: usage guidelines, page patterns
│   └── styles.css       # ALL design tokens + Tailwind theme + base styles
└── test/                # Vitest interaction tests
src/                         # the Accel app
├── components/
│   ├── app/         # Accel-specific components (AppLayout, AppSidebar, UserMenu, NotificationsBell, RequireRole, auth pieces…)
│   └── registry.json    # the approved-component list (package folders + app/)
├── pages/           # one file or folder per route
├── lib/             # app utilities (queryClient, quick actions, rule templates…)
├── hooks/           # app hooks
├── stores/          # Zustand stores
├── types/           # shared TypeScript types and interfaces
└── index.css        # imports @accel/ui/styles.css, adds app-only styles
```

**Imports.** App code and prototypes import the design system from `@accel/ui`: deep paths (`@accel/ui/components/ui/button`, `@accel/ui/lib/utils`) or the barrel (`import { Button, KpiCard } from "@accel/ui"`). Inside `packages/ui`, use relative imports only — ESLint blocks `@/…` (app code) and `@accel/ui` self-imports there. The old `@/components/ui|shared|…` paths no longer exist.

---

## Component Conventions

> **Design system & Storybook.** Run `npm run storybook` to browse the full
> library. Before building anything, check what already exists:
> - **`@accel/ui/components/ui/`** — shadcn primitives (Button, Select, Textarea, Switch, Tabs, Table, Pagination, Dialog, Sheet, Popover, DropdownMenu, Tooltip, Checkbox, RadioGroup, Progress, Label, Card, Chart, Avatar, Badge, Input, Separator, Skeleton, Collapsible), plus **SegmentedControl** (option groups, view switchers, filter chips), **Item / ItemButton** (clickable list rows and cards), **Slider** (range values).
> - **`@accel/ui/components/shared/`** — reusable design-system composites: `StatusBadge` (all status/severity/health pills, `tone=`), `KpiCard` (`tone=`), `SectionCard`, `EmptyState`, `PageStates`, `FilterDropdown`, `FilterPanel`, `Toolbar`/`ToolbarSearch`, `DateRangeBar`, `Modal`/`ModalForm`/`ConfirmDialog`, `DataTable` (`variant="list"`, `selection`, `stickyHeader` — use it for every list table), `DetailDrawer` (record side panels), `DescriptionList` (label/value facts), `Stepper`, `ChoiceDropdown`, `OtpField`, `PhoneField`, `TimeSelect`, `ProgressRow`, `TruncatedText`, `FloatingBar`, `PlaybackControls`. These must never import from `@/stores`, `@/mocks`, `@/pages` or the router.
> - **`components/app/`** — Accel-specific components that depend on app state, routing or product flows (`UserMenu`, `NotificationsBell`, `CommandPalette`, `RequireRole`, `DrawZoneModal`, auth/onboarding pieces). Not part of the reusable design system.
> - **Prop vocabulary** — `variant` = visual style, `tone` = semantic colour (`success`, `warning`, `severity-critical`, `violet`…), `size` = scale.
> - **`components/charts/`** — `AreaChart`, `BarChart`, `LineChart`, `DonutChart`.
> - **`@accel/ui/lib/formatters`** — `formatRelativeTime`, `formatDuration`, `formatBytes`, `formatCurrency`, `daysBetween`, `shiftDate`, `formatDate`.
> - **Re-skinning for another brand** — `docs/theming.md` (override the brand ramp on `:root`).

### 0. Building page UI — existing components only (ask before creating new ones)

Pages in `src/pages/` are **composed from the approved components** in `src/components/registry.json` — never hand-rolled.

1. **Look first.** Check `docs/choosing-components.md` (which component for which job), `src/components/registry.json`, Storybook (`npm run storybook`) and the catalogue below for a component that fits — including its variants/props.
2. **Compose.** Build the page from those components. Small page-local helpers are fine *only* if they just arrange existing components; no new styled primitives (no raw `<button>`, `<input>`, `<select>`, `<textarea>`, `<table>`, `<dialog>`, no direct Radix imports — lint blocks these in pages).
3. **Nothing fits? STOP and ask the user before writing it.** Say what's missing, which existing components you considered and why they don't fit, and propose: name, folder (`ui` / `shared` / `charts` / `layout` / `custom`), props, and variants. Do not create the component until the user approves.
4. **After approval:** build it in `packages/ui/src/components/<folder>/` (Accel-specific: `src/components/app/`) following the conventions below (CVA, `cn()`, tokens), name every element with `data-slot` (`{component}-{part}`), add a `.stories.tsx`, and add it to `src/components/registry.json`.

The same lint rules apply to `prototypes/` (the main UI) — run `npm run typecheck:prototypes` too, since `tsc -b` doesn't cover them. `npm run lint` enforces this: unregistered component files fail (`lint:components`), unnamed elements fail (`lint:slots`), raw primitives in pages fail (ESLint). Existing page debt is baselined in `eslint-suppressions.json` — never add to it.

### 1. Prefer shadcn components from `@accel/ui/components/ui/`

Always reach for a shadcn primitive first. Check `packages/ui/src/components/ui/` before building anything new.

```tsx
// Good — use the shadcn primitive
import { Button } from "@accel/ui/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@accel/ui/components/ui/card";
```

### 2. Modifying a shadcn component

When a shadcn component needs a tweak, **edit the file in `packages/ui/src/components/ui/` directly** — we own this code. Leave a comment explaining why.

```tsx
// In packages/ui/src/components/ui/button.tsx
// Added `loading` variant to support async button states across the dashboard.
const buttonVariants = cva(/* ... */, {
  variants: {
    variant: {
      // ...existing variants
      loading: "opacity-70 cursor-not-allowed",
    },
  },
});
```

### 3. Building a custom component in `components/custom/`

When shadcn doesn't have what we need, build it here following shadcn's exact patterns:

**Use CVA for variants:**
```tsx
import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);
```

**Use `cn()` for class merging:**
```tsx
import { cn } from "@accel/ui/lib/utils"; // inside packages/ui: a relative path

<div className={cn("base-classes", isActive && "active-class", className)} />
```

**Use Radix UI for accessibility on interactive components:**
```tsx
import * as DialogPrimitive from "@radix-ui/react-dialog";
// Build on Radix primitives rather than writing ARIA handling from scratch
```

**Use `forwardRef` and proper TypeScript types:**
```tsx
import * as React from "react";
import { cn } from "@accel/ui/lib/utils"; // inside packages/ui: a relative path

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string;
  trend?: "up" | "down" | "neutral";
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ title, value, trend, className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("rounded-xl border bg-card p-5", className)} {...props}>
        {/* ... */}
      </div>
    );
  }
);
StatCard.displayName = "StatCard";

export { StatCard };
```

**Use CSS variables — never hardcode colors or border-radius:**
```tsx
// Good — uses design tokens
<div className="bg-background text-foreground border-border" />
<div className="rounded-[var(--radius)]" />

// Bad — hardcoded values
<div style={{ backgroundColor: "#fff", borderRadius: "8px" }} />
<div className="bg-white rounded-lg" />
```

### 4. Never install duplicate UI libraries

Do not install component libraries that duplicate shadcn functionality (Chakra UI, MUI, Ant Design, Mantine, etc.). If a component is missing, build it in `components/custom/`.

---

## Styling Conventions

### Tailwind classes only — no inline styles

```tsx
// Good
<div className="flex items-center gap-3 px-4 py-2" />

// Bad
<div style={{ display: "flex", alignItems: "center", gap: "12px" }} />
```

### Type scale — never arbitrary `text-[Npx]`

The dense dashboard type scale lives in `packages/ui/src/styles.css` (`@theme`). Always use a
token; arbitrary pixel sizes are blocked by ESLint (`no-restricted-syntax`).

| Token | Size | Use |
|-------|------|-----|
| `text-3xs` | 9px | Micro labels |
| `text-2xs` | 10px | Uppercase eyebrow labels, table meta |
| `text-xs` | 11px | Table data, captions |
| `text-sm` | 12px | Compact body, list rows |
| `text-base` | 13px | **Body default** |
| `text-md` | 14px | Emphasised body, field labels |
| `text-lg` | 16px | Section headers |
| `text-xl` | 18px | Card values |
| `text-2xl` | 22px | KPI values |
| `text-3xl` | 24px | Page titles |
| `text-4xl` | 28px | Hero numbers |

```tsx
<p className="text-base text-foreground">Body</p>   // Good
<p className="text-[13px]">Body</p>                  // Bad — ESLint error
```

### Other token scales

- **Z-index** — use `z-[var(--z-modal)]` etc. (`--z-base/dropdown/sticky/overlay/drawer/modal/popover/toast/tooltip` — `popover` for menus opened inside a modal or drawer). Never `z-[100]`.
- **Spacing roles** — `p-card` (16px, inside cards/panels), `gap-section` (16px, between page sections), `gap-inline` (8px, items in a row), `p-page` (24px, around page content). Prefer these over raw `p-4`/`gap-4`/`gap-2`/`p-6` when the spacing has that role, so the rhythm changes in one place.
- **Motion** — durations `--duration-fast` / `--duration-normal` / `--duration-slow` (e.g. `duration-[var(--duration-normal)]`) + `ease-standard` / `ease-emphasized`.
- **Icon sizes** — `size-3` (badges), `size-4` (buttons/inputs/rows), `size-5` (section/empty-state), `size-6+` (hero only).
- **Elevation** — `shadow-raised` (cards, inputs, tabs), `shadow-floating` (popovers, dropdowns, tooltips, toasts), `shadow-modal` (dialogs, sheets, drawers). Theme-aware. Never `shadow-sm` … `shadow-2xl`.
- **Tints** — opacity modifiers on the base token: `/5` row hover wash, `/10` subtle fill (chips, selected rows), `/15` status tint (badges), `/20`–`/30` tint borders. (The old `*-soft` and `primary-muted` tokens were removed in @accel/ui 1.0.0.)
- **Secondary text** — always full `text-muted-foreground` (it is tuned to 4.5:1). Never fade text with `text-muted-foreground/60` etc.; opacity modifiers on muted-foreground are for icons and decorative marks only.
- **Brand orange** — `bg-primary-fill` for solid fills that carry a label (with `text-primary-foreground`); `text-primary-ink` for orange text. Bare `bg-primary` / `text-primary` fail WCAG AA there — keep `--primary` for rings, tints (`bg-primary/10`), borders, dots and charts.
- **Labels on solid status fills** — `bg-success` / `bg-severity-critical/95` … take `text-status-foreground` (white in light, near-black in dark).
- **Media** — video, camera tiles, snapshots, floor plans are dark in both themes: `bg-media`, `bg-media-raised`, `bg-scrim/60`, `text-media-foreground/85`, `bg-camera-feed`. Never raw `black`/`white`.
- **Color tiers** — `packages/ui/src/styles.css` has primitives (`--palette-orange-500`, `--palette-neutral-930`…) → semantic tokens → sidebar/chart component tokens. Components use semantic tokens only, never primitives. `violet` is a categorical tone (AI/model, vehicles, NVR, action-taken) (the old name `purple` was removed in 1.0.0). Severity is `severity-critical/high/medium/low` (the old `sev-*` names were removed in 1.0.0). Print/PDF/email HTML that can't read CSS vars uses the paper palette in `src/lib/tokens.ts`.

### Semantic color tokens — never raw Tailwind palette colors

The design uses CSS variable-backed tokens. Always use those.

```tsx
// Good — semantic tokens
<p className="text-foreground" />
<p className="text-muted-foreground" />
<div className="bg-background" />
<div className="bg-card" />
<div className="border-border" />
<span className="text-destructive" />

// Bad — raw palette colors
<p className="text-gray-900" />
<div className="bg-white" />
<div className="border-gray-200" />
<span className="text-red-500" />
```

### Guardrails — `npm run lint` enforces the above

`npm run lint` runs `scripts/check-tokens.mjs` (token naming and tier rules in `packages/ui/src/styles.css`), `scripts/check-slots.mjs` (every element in a component has a `data-slot`), `scripts/check-components.mjs` (component registry) and ESLint, which bans in app code: Tailwind palette colours (`bg-red-500`, `bg-neutral-950`), raw `white`/`black`, `shadow-sm` … `shadow-2xl`, the removed old names (`sev-*`, `purple`, `*-soft`, `primary-muted`), arbitrary `z-[N]`, `rounded-[Npx]` and `text-[Npx]`, and `var(--palette-*)`.

Violations that predate a rule are baselined in `eslint-suppressions.json`. **Never add to it** — fix the code instead. After fixing old violations, run `npm run lint:prune` to shrink the baseline.

### `cn()` for conditional classes

```tsx
import { cn } from "@accel/ui/lib/utils"; // inside packages/ui: a relative path

<button
  className={cn(
    "base-button-classes",
    isActive && "bg-primary text-primary-foreground",
    isDisabled && "opacity-50 pointer-events-none",
    className
  )}
/>
```

### Dark mode must work for every component

All color usage must be expressed with semantic tokens — those automatically handle dark mode via the `.dark` class on `<html>`. Never write `dark:` overrides that use raw palette colors.

```tsx
// Good — tokens switch automatically
<div className="bg-card text-card-foreground border-border" />

// Bad — requires manual dark: override, breaks easily
<div className="bg-white text-gray-900 dark:bg-gray-900 dark:text-white" />
```

---

### Tests and accessibility gates

- `npm test` — Vitest + Testing Library interaction tests in `packages/ui/test/*.test.tsx` (not next to components: the registry check treats every `.tsx` in a component folder as a component). When you change a component's behaviour (keyboard, selection, labelling, open/close), add or update a test there.
- `npm run test:a11y` — builds Storybook and runs axe over every story in light **and** dark (`scripts/check-a11y.mjs`). Must report 0 violations. A justified exception goes in that story's `parameters.a11y.config.rules`, with a comment saying why.
- `npm run test:a11y:pages` — builds the prototypes and runs axe on every page in light and dark (`scripts/check-a11y-pages.mjs`), excluding the dev-state tester panels. Must report 0 violations. New pages are picked up automatically.
- **Changelog** — any change under `packages/ui/` adds a line under `## [Unreleased]` in `packages/ui/CHANGELOG.md`, written for the people using the components (`npm run lint:changelog` checks it). Decide major / minor / patch with the table in `packages/ui/README.md#versioning`; deprecate before removing.
- **Visual snapshots (Chromatic)** — every story is snapshotted in light and dark (`parameters.chromatic.modes` in `.storybook/preview.tsx`). In CI it runs once the `CHROMATIC_PROJECT_TOKEN` repository variable is set; review visual changes in Chromatic before merging. Locally: `CHROMATIC_PROJECT_TOKEN=… npm run chromatic`.
- Pull requests run these in Bitbucket Pipelines (`bitbucket-pipelines.yml`): guardrail checks, `npm run build`, prototype typecheck, tests, the a11y gate and Chromatic.
- **Deploys** — every push to `main` runs the `main` pipeline, which deploys to Vercel production (needs the `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` repository variables). **Bitbucket can take several minutes to start it** (observed 3–10 min, for UI merges and git pushes alike). Check Pipelines after merging; only if no `main` run has appeared after ~10 minutes, use **Run pipeline → branch `main` → `branches: main`** (starting one too early just deploys the same commit twice — harmless, but wasteful).

## Code Conventions

### TypeScript strict mode

All files must pass strict TypeScript. No `any`, no `@ts-ignore` without a comment explaining why.

### Always include loading, empty, and error states for data-driven components

Every component that receives async data must handle all three states explicitly.

```tsx
function UserList() {
  const { data, isLoading, error } = useQuery({ queryKey: ["users"], queryFn: fetchUsers });

  if (isLoading) return <UserListSkeleton />;

  if (error) return (
    <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
      <AlertCircle className="size-5" />
      <p className="text-sm">Failed to load users.</p>
    </div>
  );

  if (!data?.length) return (
    <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
      <Users className="size-5" />
      <p className="text-sm">No users found.</p>
    </div>
  );

  return <ul>{data.map((u) => <UserRow key={u.id} user={u} />)}</ul>;
}
```

### Use Lucide icons — not emojis, not other icon libraries

```tsx
import { ArrowUpRight, CircleAlert, LoaderCircle } from "lucide-react";

// Size with the size prop or Tailwind
<ArrowUpRight className="size-4" />
<LoaderCircle className="size-4 animate-spin" />
```

### Prefer composition over prop explosion

When a component needs more than ~4 configurable regions, use composition (slot pattern) instead of adding more props.

```tsx
// Bad — prop explosion
<DataCard
  title="..."
  subtitle="..."
  icon={<Users />}
  value="..."
  trend="up"
  trendLabel="..."
  footer="..."
  footerAction={<Button />}
/>

// Good — composable
<DataCard>
  <DataCardHeader>
    <DataCardIcon><Users className="size-4" /></DataCardIcon>
    <DataCardTitle>Active Users</DataCardTitle>
  </DataCardHeader>
  <DataCardContent>
    <DataCardValue>12,480</DataCardValue>
    <DataCardTrend direction="up">+8% this week</DataCardTrend>
  </DataCardContent>
</DataCard>
```

### State management boundaries

- **TanStack Query** — anything fetched from a server: lists, details, mutations, pagination
- **Zustand** — client-only UI state that needs to persist across unmounts or be shared between distant components: sidebar collapsed state, active filters, selected rows, theme preference
- **`useState`** — local component state: form inputs, toggles, open/closed

Do not use TanStack Query for client-only state. Do not use Zustand for data that belongs in a query cache.
