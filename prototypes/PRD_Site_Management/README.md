# PRD · Site Management

Prototype of the **Site Management** module (`/site/overview`) rendered inside the
real app shell (sidebar + header), with a floating dev **State tester** for
exercising the four view states.

```
Populated  →  the real SiteOverviewPage (KPIs, site table, Add Site wizard, floor-plan / area drawing, detail drawer)
Loading    →  KPI + table skeleton
Empty      →  "No sites yet" + Add Site CTA
Error      →  "Couldn't load sites." + Retry
```

## Run

```
npm run prototype
```

Open the printed URL and pick **PRD_Site_Management** (served at
`localhost:5174/PRD_Site_Management/`).

Use the floating **Dev · State** control (bottom-right, low opacity, reveals on
hover) to switch states. **Retry** in the error state returns to Populated.

## Files

| File | Purpose |
|------|---------|
| `index.tsx` | App shell (providers + real sidebar/header) + route + floating tester + back-to-top. |
| `RealSiteManagement.tsx` | Renders the real `@/pages/site/overview` for **Populated**; header + skeleton/empty/error for the other states. |
| `StateTester.tsx` | **PROTOTYPE-ONLY** state control. |
| `shared.tsx` | `ForcedState` type + `SiteTableSkeleton` / `ErrorState` / `EmptyState`. |

## Promoting to src

The **Populated** state IS the real page — nothing to port. When wiring real
loading/empty/error into `src/pages/site/overview`, reuse the skeleton/empty/error
shapes from `shared.tsx`, but **do not** copy `StateTester.tsx`, the `forced` /
`onResolveForced` props, or the floating tester — those are prototype-only.
