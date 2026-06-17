# PRD · NVR Devices

Prototype of the **NVR Devices** module (`/site/nvr`) rendered inside the real app
shell (sidebar + header), with a floating dev **State tester** for exercising the
four view states.

```
Populated  →  the real NvrDevicesPage (KPIs, NVR table, channel linking, storage health, export / cleanup flows, detail sheet)
Loading    →  KPI + table skeleton
Empty      →  "No NVR devices yet" + Add NVR CTA
Error      →  "Couldn't load NVR devices." + Retry
```

## Run

```
npm run prototype
```

Open the printed URL and pick **PRD_NVR_Devices** (served at
`localhost:5174/PRD_NVR_Devices/`).

Use the floating **Dev · State** control (bottom-right, low opacity, reveals on
hover) to switch states. **Retry** in the error state returns to Populated.

## Files

| File | Purpose |
|------|---------|
| `index.tsx` | App shell (providers + real sidebar/header) + route + floating tester + back-to-top. |
| `RealNvrDevices.tsx` | Renders the real `@/pages/site/nvr` for **Populated**; header + skeleton/empty/error for the other states. |
| `StateTester.tsx` | **PROTOTYPE-ONLY** state control. |
| `shared.tsx` | `ForcedState` type + `NvrTableSkeleton` / `ErrorState` / `EmptyState`. |

## Promoting to src

The **Populated** state IS the real page — nothing to port. When wiring real
loading/empty/error into `src/pages/site/nvr`, reuse the skeleton/empty/error
shapes from `shared.tsx`, but **do not** copy `StateTester.tsx`, the `forced` /
`onResolveForced` props, or the floating tester — those are prototype-only.
