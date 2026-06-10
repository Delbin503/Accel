# Prototypes

Each subfolder is an isolated prototype for a specific PRD or task.

## Running

```bash
pnpm prototype
```

Opens at `http://localhost:5174/` — shows an index of all prototypes.

## URLs

| URL | Description |
|-----|-------------|
| `localhost:5174/` | Index of all prototypes |
| `localhost:5174/<slug>/` | Prototype for that PRD/task |
| `localhost:5174/<slug>/?variant=B` | Specific UI variant |

## Adding a new prototype

When you run the `prototype` skill, it will ask for the PRD/task name, derive a slug,
and scaffold a new folder here automatically.

## Merging into main

Never auto-merged. When a prototype is validated, copy only the relevant code into `src/`
and rewrite it properly (types, error handling, tests). Then delete the prototype folder.

## Structure

```
prototypes/
├── vite.config.ts       # Shared dev server — auto-discovers slugs
├── index.html           # Root index page
├── main.tsx             # Renders the prototype list
├── README.md            # This file
└── <slug>/              # One folder per PRD/task
    ├── index.html
    ├── index.tsx
    ├── README.md
    └── variants/        # UI prototypes only
        ├── VariantA.tsx
        ├── VariantB.tsx
        └── VariantC.tsx
```
