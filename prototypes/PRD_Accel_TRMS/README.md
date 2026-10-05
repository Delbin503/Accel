# PRD — Accel TRMS

Throwaway prototype of Accel TRMS, rendered in the real sidebar shell (dark by default, same
as `PRD_Dashboard`). It is the app cut down to the screens TRMS has:

| Sidebar | Route | Screen |
|---|---|---|
| Monitor ▸ Dashboard | `/` | `AccelDashboard` (TRMS data, main-dashboard layout) |
| Monitor ▸ Live Monitoring | `/live` | Re-ID Live Monitoring with tracking off — Cameras and Detections tabs only |
| Monitor ▸ Detection Feed | `/detection-feed` | the app's Detection Feed (+ `/detection-feed/dismissed`) |
| Manage ▸ Site ▸ Site Management | `/site/overview` | the app's Site Management |
| Manage ▸ Site ▸ Devices | `/site/cameras` | the app's Cameras page as **Devices**, + STATIONS column |
| Manage ▸ Site ▸ NVR Devices | `/site/nvr` | the app's NVR Devices |
| Manage ▸ Rules Library | `/rules` | the app's Rules Library |
| Manage ▸ Incident Cases | `/incidents` | the app's Incident Cases (+ `/incidents/:caseId`) |
| System ▸ Activity Logs | `/activity-logs` | the app's Activity Logs |

Everything else the app has (Recordings, Model Management, Run Analysis, Model Deployment,
User Management, Device Health, System Configuration) is left out of the sidebar and the
routes. A link inside a real page that points at one of those lands on a "Not part of Accel
TRMS" page rather than silently jumping elsewhere.

The sidebar is filtered from the app's own `NAV_GROUPS` (`trmsNav.ts`), and the routes are the
app's own paths, so links between the real pages work without rewriting.

## Dashboard — `/`

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

`PRD_Phase_1_3/reid/ReidLiveMonitoring` with `tracking={false}`: the camera wall, grid and
synchronised playback, a **Cameras & Detections** side panel (no Tracking tab, no weapon tags,
no Re-ID map), and the detection card stack in the bottom-right corner. Clicking a card or a
Detections row opens that event's drawer in `/detection-feed`.

## Devices — `/site/cameras`

The app's Cameras page, titled Devices, with one added **STATIONS** column: how many base
stations a camera has covered over its life, with the current one beside the count. Hover or
focus it for every station and the dates it was mounted there. `trmsData.ts` holds the station
history.

## Changes outside this folder

Optional, default-preserving extension points — each page renders exactly as before when they
are left unset:

| File | Addition |
|---|---|
| `src/components/layout/AppSidebar.tsx` | `groups` — nav to render; defaults to the app's own |
| `src/pages/site/cameras/index.tsx` | `title`, `description`, `extraColumns` (inserted before ACTION) |
| `prototypes/PRD_Phase_1_3/reid/ReidLiveMonitoring.tsx` | `tracking`, `detectionHref` |

## Run

```bash
npm run prototype        # vite on http://localhost:5174
# then open http://localhost:5174/PRD_Accel_TRMS/
```

## Files

| File | Role |
|------|------|
| `index.tsx` | Shell: real `AppSidebar` with the TRMS nav, header, routes |
| `trmsNav.ts` / `TrmsBreadcrumb.tsx` | Sidebar filtered from the app's nav; breadcrumb trails from it |
| `AccelDashboard.tsx` | Dashboard sections + TRMS mock data |
| `TrmsDevices.tsx` / `trmsData.ts` | Devices: Cameras page + STATIONS column and its station history |
| `proto.css` | Pulls in the app Tailwind theme + tokens |

## Promoting to `src/`

Move `AccelDashboard.tsx` into a new `src/pages/...` route, swap the mock arrays for TanStack
Query hooks, add the loading/empty/error states CLAUDE.md requires, and gate the sidebar/routes
by product rather than by a separate shell. Then delete this folder.
