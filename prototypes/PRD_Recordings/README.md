# PRD · Recordings

Prototype of the **Recordings** module (`/recordings`) rendered inside the real app
shell (sidebar + header), with a floating dev **State tester** for exercising the
four view states.

```
Populated  →  the real RecordingsPage (KPIs, date range, recording card grid, detail drawer/player, bulk delete, escalate-to-case)
Loading    →  KPI + card-grid skeleton
Empty      →  "No recordings found"
Error      →  "Couldn't load recordings." + Retry
```

## Shared recording card

The recording card layout is a shared component —
[`src/components/shared/RecordingCard.tsx`](../../src/components/shared/RecordingCard.tsx) —
used by both the Recordings page (`variant="page"`) and the **Cameras detail
drawer** Recordings tab (`variant="drawer"`), so the two stay visually identical.
See `PRD_Cameras` for the drawer usage.

## Run

```
npm run prototype
```

Open the printed URL and pick **PRD_Recordings** (served at
`localhost:5174/PRD_Recordings/`).

Use the floating **Dev · State** control (bottom-right, low opacity, reveals on
hover) to switch states. **Retry** in the error state returns to Populated.

## Files

| File | Purpose |
|------|---------|
| `index.tsx` | App shell (providers + real sidebar/header) + route + floating tester + back-to-top. |
| `RealRecordings.tsx` | Renders the real `@/pages/recordings` for **Populated**; header + skeleton/empty/error for the other states. |
| `StateTester.tsx` | **PROTOTYPE-ONLY** state control. |
| `shared.tsx` | `ForcedState` type + `RecordingsSkeleton` / `ErrorState` / `EmptyState`. |

## Promoting to src

The **Populated** state IS the real page. The shared `RecordingCard` already lives
in `src`. When wiring real loading/empty/error into `src/pages/recordings`, reuse
the skeleton/empty/error shapes from `shared.tsx`, but **do not** copy
`StateTester.tsx`, the `forced` / `onResolveForced` props, or the floating tester —
those are prototype-only.
