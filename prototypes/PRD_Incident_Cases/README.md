# PRD · Incident Cases

Throwaway prototype for the **Incident Cases** module. Served at its own URL by
the prototype Vite config; does not touch the app baseline.

## Run

```bash
npm run prototype
# open http://localhost:5174/PRD_Incident_Cases/
```

## States

A floating **Dev · State** tester (bottom-right, reveals on hover) forces the view
into each state. Each state renders inside the real page chrome (header + KPI
cards + filters stay visible):

| State | What it shows |
|-------|---------------|
| **Populated** | The real, fully-working page — KPI cards, date/filter bar, the cases table, and the per-case **drawer** (status / reassign / link / edit / delete + linked incidents, entities, activity). |
| **Loading** | KPI + filter-bar + table skeleton. |
| **Empty** | "No incident cases yet" — KPIs read 0, no rows. |
| **Error** | The case list failed to load, with a Retry. |

### Drawer states

The same toggle drives the **case drawer**. Open a case (click a row in
**Populated**), then switch the tester to:

- **Loading** → the drawer body shows a skeleton ("Loading case…").
- **Error** → the drawer shows "Couldn't load this case" with a Retry.

`Empty` / `Populated` keep the real case in the drawer.

## Promoting to src

The real page already lives in `src/pages/incident-cases`. The `forcedState` /
`onRetry` props on `IncidentCasesPage` and `CaseDrawer`, plus the shared
`ListLoadingState` / `ListErrorState` in `src/components/shared/PageStates.tsx`,
are the promotable parts — wire them to the page's real loading/error state.
`StateTester.tsx`, `index.tsx`, `shared.tsx`, and the floating tester are
prototype-only scaffolding.
