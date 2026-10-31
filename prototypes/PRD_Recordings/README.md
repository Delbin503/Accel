# PRD · Recordings

Prototype of the **Recordings** module (`/recordings`) rendered inside the real app
shell (sidebar + header), with a floating dev **State tester** for exercising the
four view states.

```
Populated  →  the real RecordingsPage (KPIs + storage, date range, camera-day list, drawer, pop-up player, export, bookmark, bulk delete)
Loading    →  KPI + card-grid skeleton
Empty      →  "No recordings found"
Error      →  "Couldn't load recordings." + Retry
```

## Camera-day recordings (from Phase 1.3)

The page is the Phase 1.3 Recordings design, promoted into `src/pages/recordings`
— the Phase 1.3 prototype renders the same component, so the two stay identical.

- A row is a **camera-day**, and there are two types: **Continuous** (sites open
  round the clock) and **Operation** (sites that keep hours). Standby is not a row:
  it is the other half of an operation day and opens inside it, with the
  motion-based clips caught while it ran.
- KPIs: Total Recordings, Today (filters the list), and **Storage Total** across
  the NVRs for the sites in view, split into used / left.
- Filters: site, area, camera, type and bookmark; date pills; sort Newest, Oldest,
  Longest, Largest.
- The drawer leads with Recording Info, then lists the day's recordings — each
  plays in a **pop-up player**. Pick which go into **Export** (a zip).
- **Bookmark** keeps a recording out of any delete; bulk delete holds bookmarked
  ones back.

Data: `src/mocks/dayRecordings.ts`; types: `src/lib/recordingTypes.ts`; player
controls: `src/components/shared/PlaybackControls.tsx` + `src/lib/playback.ts`.

## Shared recording card

[`src/components/shared/RecordingCard.tsx`](../../src/components/shared/RecordingCard.tsx)
is still used by the **Cameras detail drawer** Recordings tab, which lists the older
per-file recordings. Opening one hands off to this page, which opens the camera-day
that file falls in. See `PRD_Cameras` for the drawer usage.

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
