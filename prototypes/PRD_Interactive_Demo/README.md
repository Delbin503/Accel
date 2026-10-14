# Interactive demo — build an incident, follow it through Accel

A guided, scripted demonstration for the product page. One example house stays on screen for
four stages; each click adds understanding rather than animation.

| Stage | What the visitor does | What it reveals |
|---|---|---|
| 1 · Unify sources | Clicks the porch camera, front door sensor, hallway motion sensor | Each sensor's own raw event — separate signals, no explanation |
| 2 · Contextualize | "Add context" | Events on the house map and timeline; home is in Away mode, no authorised unlock |
| 3 · Understand & analyse | "Analyse situation" | The assessment, which signals support it, and what is still unknown |
| 4 · Decision & action | Picks a response | The response written into the incident record |

Sensors stay switchable at every stage, so the assessment can be seen following the evidence —
all seven sensor combinations have their own outcome (`demoScenario.ts`).

Progress indicator, Back, Next and Reset are always available. It is labelled "Interactive demo".

## Run

```bash
npm run prototype
# http://localhost:5174/PRD_Interactive_Demo/
```

## Files

| File | Role |
|---|---|
| `demoScenario.ts` | The sensors' events, the context facts, `assess()` per combination, the responses |
| `HouseDemo.tsx` | Stepper, the house floor plan with clickable sensors, the per-stage side panel |
| `index.tsx` | Standalone mount (no app shell), dark by default with a theme toggle |
