# PRD · Run Analysis

Throwaway prototype for the **Run Analysis** module. Served at its own URL by the
prototype Vite config; does not touch the app baseline.

## Run

```bash
npm run prototype
# open http://localhost:5174/PRD_Run_Analysis/
```

## States

A floating **Dev · State** tester (bottom-right, reveals on hover) forces the view
into each state:

The state tester forces both the **analysis (select)** view and the **Analysis
History** tab — each renders the forced state inside its real chrome (model
selector + config panel + History button, or the history KPIs + filters):

| State | What it shows |
|-------|---------------|
| **Populated** | The real, fully-working page — model selector, footage upload, VLM pick, the analysis loading run, the pass/fail result verdict, the run-failure screen, and the History tab. |
| **Loading** | Select step: model-card + config-panel skeletons (header + History button stay). History tab: KPI + table skeleton. |
| **Empty** | Select step: model column shows "Create a model in the Model Management to continue" + a button; the panels stay. |
| **No results** | Analysis History filters (status / verdict / model / VLM / date) match nothing. |
| **Error** | The page / history failed to load, with a Retry. |

### The "run error" (model error) is a toast, not a forced state

A run can be technically valid yet fail mid-pipeline (VLM unreachable / timeout /
inference crash). That only makes sense **while running an analysis**, so it
surfaces as an error **toast** from the run action itself (the live flow already
simulates pipeline failures) — not as a forced page state.

## Promoting to src

The real page already lives in `src/pages/run-analysis`. The skeleton / empty /
no-results / error / run-error views in `shared.tsx` are the promotable parts —
wire them to the page's real loading/error/run-failure state. `StateTester.tsx`,
`index.tsx`, and the floating tester are prototype-only scaffolding.
