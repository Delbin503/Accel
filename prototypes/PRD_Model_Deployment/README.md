# PRD · Model Deployment

Throwaway prototype for the **Model Deployment** module. Served at its own URL by
the prototype Vite config; does not touch the app baseline.

## Run

```bash
npm run prototype
# open http://localhost:5174/PRD_Model_Deployment/
```

## States

A floating **Dev · State** tester (bottom-right, reveals on hover) forces the view
into each state:

Each state renders inside the real page chrome (the **Deploy / Models** tabs stay
visible), and applies to whichever tab is active:

| State | What it shows |
|-------|---------------|
| **Populated** | The real, fully-working page — deploy wizard (model → site → areas → cameras), the deployed-models history with health/status KPIs, and the per-model camera drawer (with camera search). |
| **Loading** | Deploy tab: 4-column wizard skeleton. Models tab: KPI + model-card skeleton. (Tabs stay.) |
| **Empty** | Deploy tab: wizard with the Model column showing "Create a model in the Model Management to continue" + a button; the other panels stay. Models tab: "No models deployed yet". |
| **Error** | The deployments list failed to load, with a Retry. |

### The "deploy error" (model error) is a toast, not a forced state

A deployment can fail on the edge (bundle rejected, checksum mismatch, agent
offline). That only happens **when you deploy**, so it surfaces as an error
**toast** from the deploy action — try deploying the **Muzzle Detection Protocol**
model. It is not a forced page state.

## Promoting to src

The real page already lives in `src/pages/model-deployment`. The skeleton / empty
/ error / deploy-error views in `shared.tsx` are the promotable parts — wire them
to the page's real loading/error/deployment-status state. `StateTester.tsx`,
`index.tsx`, and the floating tester are prototype-only scaffolding.
