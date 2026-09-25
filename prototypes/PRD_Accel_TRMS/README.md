# PRD — Accel TRMS

Throwaway prototype of the Accel TRMS dashboard, rendered in the real sidebar shell (dark by
default, same as `PRD_Dashboard`). Isolated from `src/`.

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

## Run

```bash
npm run prototype        # vite on http://localhost:5174
# then open http://localhost:5174/PRD_Accel_TRMS/
```

## Files

| File | Role |
|------|------|
| `index.tsx` | Shell: real `AppSidebar` + header + `<AccelDashboard/>` |
| `AccelDashboard.tsx` | Dashboard sections + TRMS mock data |
| `proto.css` | Pulls in the app Tailwind theme + tokens |

## Promoting to `src/`

Move `AccelDashboard.tsx` into a new `src/pages/...` route, swap the mock arrays for TanStack
Query hooks, add the loading/empty/error states CLAUDE.md requires, register the route in
`src/App.tsx` and the `AppSidebar` nav, then delete this folder.
