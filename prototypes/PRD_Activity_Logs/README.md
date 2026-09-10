# PRD · Activity Logs

Throwaway prototype for the **Activity Logs** module. Served at its own URL
by the prototype Vite config; does not touch the app baseline.

## Run

```bash
npm run prototype
# open http://localhost:5174/PRD_Activity_Logs/
```

## What it covers

The workspace audit trail at `/activity-logs` — who did what, where, and whether
it succeeded:

| Region | What it shows |
|--------|---------------|
| **KPI strip** | Total events, today, succeeded, failed |
| **Date range bar** | Today / 7d / 30d / 90d / All time + custom from–to |
| **Filters panel** | Free-text search, multi-select Type (with per-option counts), multi-select Site |
| **Table** | Date/time, type badge, status, description, actor + IP |
| **Export** | Download the filtered range |

Rows are read-only history. This is the audit surface, distinct from the live
operational stream in `PRD_Detection_Feed` and the per-incident timeline in
`PRD_Incident_Cases`.

## States

No floating state tester. The page reads a static mock (`src/mocks/activityLogs`)
rather than a fetch, so it has no loading or error variants to force — and its
one data-empty state is reachable through the real UI: narrow the date range or
pick a Type / Site combination with no matches and the "No activity events match
the current filters" panel renders with its Clear filters action.

If the page later grows a real fetch, add a `StateTester` then — see
`PRD_Device_Health` for the pattern (a `forcedState` prop on the page plus a
`FloatingTester`).

## Promoting to src

Nothing to promote. The page already lives in `src/pages/activity-logs`.
`index.tsx` — the router, the app chrome and the back-to-top button — is
prototype-only scaffolding.
