# Accel prototypes

Interactive prototypes for the Accel VMS: every `prototypes/PRD_*` folder is one PRD page or module.

```bash
npm ci
npm run prototype      # http://localhost:5174/ — index of every prototype
```

- `prototypes/` — the prototypes (one folder per PRD, plus `_shared` and the index page).
- `src/` and `packages/ui/` — the app code and the `@accel/ui` design system the prototypes import. They are kept only because the prototypes depend on them.
- `vercel.json` — builds the prototypes (`vite build --config prototypes/vite.config.ts`) into `dist-prototypes`.
