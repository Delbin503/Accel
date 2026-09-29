# PRD — Accel TRMS

Throwaway prototype of Accel TRMS — Dashboard, Live Monitoring, Alert Log and Devices —
rendered in the real sidebar shell with TRMS's own four-item nav (dark by default, same as
`PRD_Dashboard`).

Layout, cards and section chrome are a 1:1 mirror of the main dashboard
(`src/pages/dashboard` / `PRD_Dashboard/RealDashboard.tsx`) — only the data is TRMS-specific.

| Section | Mirrors main-dashboard section |
|---|---|
| Date range bar | `DateRangeBar` (Today / Yesterday / This Week / This Month / Custom) |
| KPI strip — Live: Sites · Weapons Detected · Cameras / Period: Events · Open Cases | Live status / Period KPI strip |
| Alerts by Base Station — Severity Breakdown (chips, trend, per-station cards) | Detections by Site — Severity Breakdown |
| Detected Alert Events (mini feed) | Recent Detections |
| Incident Cases summary | Incident Cases |
| Recent Activity Log summary | Recent Activity Log |

The date range scales the mock numbers and switches the trend axis (hours / weekdays / weeks).

## Live Monitoring — `/live`

The Phase 1.3 Live Monitoring page (`PRD_Phase_1_3/SyncPlaybackMonitoring`), with its visitor
analytics swapped for the assignment in progress:

| KPI | Shows |
|---|---|
| Person Timer | Time on the active assignment, ticking |
| Assignment ID | `ASG-2026-0142` · station, lane, weapon |
| Person Detected | Today's count — click to open the drawer filtered to people |
| Weapon Detected | Today's count, flagging any with no active assignment — click to filter |
| Weapon Registered | Registered weapons across all base stations |

A simulated feed raises a detection every 9 s (the first after 2.5 s). Each lands as a card in
the bottom corner; cards stack, three at a time with a "+N more" chip, and lift clear of the
camera selection bar when one is showing. Clicking a card opens the **Detected Events** drawer
with that event highlighted; every row there links through to the Alert Log.

A weapon seen with no active assignment comes in **critical** — that is the one that needs a
human. Other weapon sightings are medium, person sightings low.

## Alert Log — `/alerts`

The Detection Feed and Incident Cases as one module, two tabs.

**Detections** is the Detection Feed's layout — severity-edged cards with snapshot and bounding
box, KPI filters, a filter bar, bulk selection — over the TRMS detection store. Those are the
same records Live Monitoring raises, so "Open in Alert Log" from a live card lands on the
matching row, highlighted. Escalating opens a case.

**Incident Cases** is the real Incident Cases page, unmodified. Escalating a detection creates a
case in the real incident-cases store, so it is a full case — status, reassignment, activity —
and its drawer shows the linked detections rather than bare ids.

## Devices — `/devices`

The app's Cameras page, titled Devices, with one added **STATIONS** column: how many base
stations a camera has covered over its life, with the current one beside the count. Hover or
focus it for every station and the dates it was mounted there.

## How the pages share data

`trmsData.ts` holds the domain — stations, registered weapons, the active assignment, each
camera's station history, and the detections. `useTrmsStore.ts` is the one store both Live
Monitoring and Alert Log read.

**Prototype-only bridge.** The real Incident Cases drawer resolves a case's linked detections
against the shared `MOCK_EVENTS` array. This prototype loads as its own page, so the store
mirrors TRMS detections into that array, and seeds the cases store with TRMS cases only. That
lets the unmodified drawer render them; nothing outside this page load sees it. Promoting to
`src/` means replacing both with a real detections query.

## Changes outside this folder

Three optional, default-preserving extension points — each page renders exactly as before when
they are left unset:

| File | Addition |
|---|---|
| `src/components/layout/AppSidebar.tsx` | `groups` — nav to render; defaults to the app's own |
| `src/pages/site/cameras/index.tsx` | `title`, `description`, `extraColumns` (inserted before ACTION) |
| `prototypes/PRD_Phase_1_3/SyncPlaybackMonitoring.tsx` | `stats` slot, `onSelectionChange` callback |

## Run

```bash
npm run prototype        # vite on http://localhost:5174
# then open http://localhost:5174/PRD_Accel_TRMS/
```

## Files

| File | Role |
|------|------|
| `index.tsx` | Shell: real `AppSidebar` with the TRMS nav, header, routes |
| `AccelDashboard.tsx` | Dashboard sections + TRMS mock data |
| `TrmsLiveMonitoring.tsx` | Live Monitoring: KPIs, live feed, toast stack, Detected Events drawer |
| `TrmsAlertLog.tsx` | Alert Log: Detections tab + the real Incident Cases page |
| `TrmsDevices.tsx` | Devices: Cameras page + STATIONS column |
| `trmsData.ts` / `useTrmsStore.ts` | Shared domain model and detection store |
| `detectionUi.tsx` / `trmsFormat.ts` | Detection display pieces and formatters |
| `trmsNav.ts` / `TrmsBreadcrumb.tsx` | Nav and per-route breadcrumb trails |
| `proto.css` | Pulls in the app Tailwind theme + tokens |

## Promoting to `src/`

Move `AccelDashboard.tsx` into a new `src/pages/...` route, swap the mock arrays for TanStack
Query hooks, add the loading/empty/error states CLAUDE.md requires, register the route in
`src/App.tsx` and the `AppSidebar` nav, then delete this folder.
