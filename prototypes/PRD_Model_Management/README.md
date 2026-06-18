# PRD · Model Management

Throwaway prototype for the **Model Management** module. Served at its own URL by
the prototype Vite config; does not touch the app baseline.

## Run

```bash
npm run prototype
# open http://localhost:5174/PRD_Model_Management/
```

## States

A floating **Dev · State** tester (bottom-right, reveals on hover) forces the view
into each state:

| State | What it shows |
|-------|---------------|
| **Populated** | The real, fully-working Model Management page — models list, sequence builder, detection rules, drag-and-drop, create/edit model, add step, extract-from-model, and the rule-edit handoff to the Rule Library. |
| **Loading** | Two-pane skeleton (models list + detail) while models are being fetched. |
| **Empty** | First-run state — no models exist yet, with an "Add New Model" CTA. |
| **No results** | Search/tag filters match nothing — distinct from Empty so users know to clear filters rather than create. |
| **Error** | Models failed to load, with a Retry. |

### Why "No results" was added

The PRD listed Populated / Loading / Empty / Error. Model Management has a search
box and tag filters, so a filtered-to-zero result is a real, reachable state that
reads differently from "you have no models at all" — it needs a *clear filters*
affordance, not a *create* one. Added it as a distinct state.

## Notes

- `/models` renders the real page; `/rules` renders the real Rule Library so the
  "Extract from Model" and edit-rule flows (which navigate to `/rules`) round-trip
  instead of dead-ending.

## Promoting to src

Copy nothing from this folder wholesale. The real page already lives in
`src/pages/model-management`. The skeleton / empty / no-results / error views in
`shared.tsx` are the promotable parts — wire them to the page's real
loading/error/filter state. `StateTester.tsx`, `index.tsx`, and the floating
tester are prototype-only scaffolding; leave them behind.
