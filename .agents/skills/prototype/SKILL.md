---
name: prototype
description: Build a throwaway prototype to flesh out a design before committing to it. Routes between two branches — a runnable terminal app for state/business-logic questions, or several radically different UI variations toggleable from one route. Each prototype is scoped to a PRD or task, lives under prototypes/<slug>/, and is served at localhost:[port]/<slug> — isolated from the main baseline until explicitly merged. Use when the user wants to prototype, sanity-check a data model or state machine, mock up a UI, explore design options, or says "prototype this", "let me play with it", "try a few designs".
---

# Prototype

A prototype is **throwaway code that answers a question**. The question decides the shape.

## Step 0 — name and scope the prototype (always ask first)

Before anything else, ask the user:

> "What's the PRD or task name for this prototype? (e.g. PRD-42, detection-feed-v2, camera-onboarding)"

Derive a URL-safe slug: lowercase, hyphens only, no spaces. Examples:
- "PRD-42" → `prd-42`
- "Camera onboarding" → `camera-onboarding`
- "Detection Feed v2" → `detection-feed-v2`

All prototype code for this task goes under **`prototypes/<slug>/`** in the repo root. Nothing inside that folder touches the main `src/` baseline.

## Step 1 — scaffold the prototype entry

Create `prototypes/<slug>/` with:

```
prototypes/
└── <slug>/
    ├── README.md          # question being answered + run command
    ├── index.tsx          # route entry point (UI) or main.ts (logic)
    └── variants/          # UI branch only — one file per variant
        ├── VariantA.tsx
        ├── VariantB.tsx
        └── VariantC.tsx
```

Wire the route into the **prototype runner** (see Step 2) — never into the main app router.

## Step 2 — prototype runner (separate from the main app)

All prototypes share a single lightweight Vite dev server defined at `prototypes/vite.config.ts`. Each slug gets its own route:

- `localhost:5173/` → index listing all available prototypes (auto-generated from folder names)
- `localhost:5173/<slug>` → the prototype for that PRD/task
- `localhost:5173/<slug>?variant=B` → specific variant

The root index page auto-discovers prototype folders and renders a simple link list — no manual registration needed.

Add one script to `package.json` (if not already present):

```json
"prototype": "vite serve prototypes --config prototypes/vite.config.ts"
```

Run with: `pnpm prototype`

## Step 3 — pick a branch

- **"Does this logic / state model feel right?"** → [LOGIC.md](LOGIC.md). Build a tiny interactive terminal app that pushes the state machine through cases that are hard to reason about on paper.
- **"What should this look like?"** → [UI.md](UI.md). Generate several radically different UI variations on a single route, switchable via a URL search param and a floating bottom bar.

The two branches produce very different artifacts — getting this wrong wastes the whole prototype. If ambiguous and the user isn't reachable, default to whichever branch better matches the surrounding code (backend module → logic; page or component → UI) and state the assumption at the top of the prototype.

## Rules that apply to both branches

1. **Isolated by default.** `prototypes/<slug>/` never imports from `src/` (except shared design tokens / component library if needed for visual fidelity). The main app never imports from `prototypes/`.
2. **One command to run.** `pnpm prototype` starts the prototype runner. The user must be able to reach any slug without further config.
3. **No persistence by default.** State lives in memory. If the question involves a DB, use a scratch file named `PROTOTYPE-wipe-me.json`.
4. **Skip the polish.** No tests, no error handling beyond runnable, no abstractions.
5. **Surface the state.** After every action (logic) or on every variant switch (UI), print or render full relevant state.

## Merging into the main baseline (explicit opt-in only)

Never auto-merge. When the prototype has answered its question and the user confirms, then:

1. Copy only the validated code into `src/` — rewrite it properly (add types, error handling, tests).
2. Delete `prototypes/<slug>/`.
3. Record the decision in a commit message, ADR, or issue.

## When done

Capture the answer (commit message, ADR, issue, or `prototypes/<slug>/NOTES.md`) before deleting the folder. The _answer_ is the only artefact worth keeping.
