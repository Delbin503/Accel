# PRD · Rule Library

Throwaway prototype for the **Rule Library** module. Served at its own URL by the
prototype Vite config; does not touch the app baseline.

## Run

```bash
npm run prototype
# open http://localhost:5174/PRD_Rule_Library/
```

## States

A floating **Dev · State** tester (bottom-right, reveals on hover) forces the view
into each state:

| State | What it shows |
|-------|---------------|
| **Populated** | The real, fully-working Rule Library — rule cards, search, sort, severity/tag filters, the rule builder (WHEN/conditions), saved templates view, and create/edit flows. |
| **Loading** | Toolbar + card-grid skeleton while rules are being fetched. |
| **Empty** | First-run state — no rules exist yet, with an "Add Rule" CTA. |
| **No results** | Search/severity/tag filters match nothing — distinct from Empty so users clear filters rather than create. |
| **Error** | Rules failed to load, with a Retry. |

### Why "No results" was added

The PRD listed Populated / Loading / Empty / Error. Rule Library has search, a
sort control, and severity/tag filters, so a filtered-to-zero result is a real,
reachable state that reads differently from "you have no rules at all" — it needs
a *clear filters* affordance, not a *create* one. Added it as a distinct state.

## Promoting to src

Copy nothing from this folder wholesale. The real page already lives in
`src/pages/rules-library`. The skeleton / empty / no-results / error views in
`shared.tsx` are the promotable parts — wire them to the page's real
loading/error/filter state. `StateTester.tsx`, `index.tsx`, and the floating
tester are prototype-only scaffolding; leave them behind.
