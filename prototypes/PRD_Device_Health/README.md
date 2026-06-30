# PRD · Device Health

Throwaway prototype for the **Device Health** module. Served at its own URL by
the prototype Vite config; does not touch the app baseline.

## Run

```bash
npm run prototype
# open http://localhost:5174/PRD_Device_Health/
```

## States

A floating **Dev · State** tester (bottom-right, reveals on hover) forces the view
into each state. Each state renders inside the real page chrome (header +
health-score badge + KPI cards + filters stay visible):

| State | What it shows |
|-------|---------------|
| **Populated** | The real, fully-working page — health-score badge, KPI cards, filter panel, sortable + paginated device table (cameras + NVRs, health pills, disk usage, last sync). |
| **Loading** | KPI + filter-bar + table skeleton. |
| **Empty** | "No devices yet" — KPIs read 0, health score 0%, no rows. |
| **Error** | The device list failed to load, with a Retry. |

### No drawer

Device Health has **no detail drawer** — clicking a device row links out to the
**Cameras** or **NVR** page (outside this prototype, so it lands on a
"Not part of this prototype" stub here).

## Promoting to src

The real page already lives in `src/pages/device-health`. The `forcedState` /
`onRetry` props on `DeviceHealthPage`, plus the shared `ListLoadingState` /
`ListErrorState` in `src/components/shared/PageStates.tsx`, are the promotable
parts — wire them to the page's real loading/error state. `StateTester.tsx`,
`index.tsx`, `shared.tsx`, and the floating tester are prototype-only scaffolding.
