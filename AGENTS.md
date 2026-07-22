# Dashboard Project — AI Coding Rules

This is a **React + TypeScript dashboard**. All code generated here must follow these conventions exactly so components are consistent, composable, and drop-in ready across the project.

---

## Tech Stack

| Tool | Purpose |
|------|---------|
| React + TypeScript + Vite | App framework and bundler |
| Tailwind CSS v4 | Styling — `@tailwindcss/vite` plugin, CSS-first config |
| shadcn/ui | Base design system — owns `components/ui/` |
| TanStack Query | Server state — data fetching, caching, loading/error states |
| Zustand | Client state — UI state, preferences, ephemeral app state |
| Lucide React | Icons — only icon library used in this project |
| Recharts | Charts — all chart components live in `components/charts/` |

---

## Folder Structure

```
src/
├── components/
│   ├── ui/          # shadcn primitives — managed by shadcn CLI, we own the code
│   ├── custom/      # custom components built on shadcn patterns (see conventions below)
│   ├── layout/      # Sidebar, Header, page wrappers
│   ├── charts/      # Recharts-based chart components
│   └── shared/      # composite components reused across multiple pages
├── pages/           # one file or folder per route
├── lib/             # utilities — cn(), formatters, constants
├── hooks/           # custom React hooks
├── stores/          # Zustand stores
└── types/           # shared TypeScript types and interfaces
```

---

## Component Conventions

> **Design system & Storybook.** Run `npm run storybook` to browse the full
> library. Before building anything, check what already exists:
> - **`components/ui/`** — shadcn primitives (Button, Select, Textarea, Switch, Tabs, Table, Pagination, Dialog, Sheet, Popover, DropdownMenu, Tooltip, Checkbox, RadioGroup, Progress, Label, Card, Chart, Avatar, Badge, Input, Separator, Skeleton, Collapsible).
> - **`components/shared/`** — app composites: `StatusBadge` (all status/severity/health pills), `SectionCard`, `EmptyState`, `FilterDropdown`, `FilterPanel`, `Toolbar`/`ToolbarSearch`, `ConfirmDialog`, `DataTable`, `KpiCard`.
> - **`components/charts/`** — `AreaChart`, `BarChart`, `LineChart`, `DonutChart`.
> - **`lib/formatters.ts`** — `formatRelativeTime`, `formatDuration`, `formatBytes`, `formatCurrency`, `daysBetween`, `shiftDate`, `formatDate`.

### 1. Prefer shadcn components from `components/ui/`

Always reach for a shadcn primitive first. Check `components/ui/` before building anything new.

```tsx
// Good — use the shadcn primitive
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
```

### 2. Modifying a shadcn component

When a shadcn component needs a tweak, **edit the file in `components/ui/` directly** — we own this code. Leave a comment explaining why.

```tsx
// In components/ui/button.tsx
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
import { cn } from "@/lib/utils";

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
import { cn } from "@/lib/utils";

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

The dense dashboard type scale lives in `src/index.css` (`@theme`). Always use a
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

- **Z-index** — use `z-[var(--z-modal)]` etc. (`--z-dropdown/sticky/overlay/drawer/modal/toast/tooltip`). Never `z-[100]`.
- **Motion** — durations `--duration-fast` / `--duration-normal` / `--duration-slow` (e.g. `duration-[var(--duration-normal)]`) + `ease-standard` / `ease-emphasized`.
- **Icon sizes** — `size-3` (badges), `size-4` (buttons/inputs/rows), `size-5` (section/empty-state), `size-6+` (hero only).

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

### `cn()` for conditional classes

```tsx
import { cn } from "@/lib/utils";

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
