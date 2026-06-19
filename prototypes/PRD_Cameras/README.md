# PRD · Cameras

Prototype of the **Cameras** module (`/site/cameras`) rendered inside the real app
shell (sidebar + header), with a floating dev **State tester** for exercising the
four view states.

```
Populated  →  the real CamerasPage (KPIs, camera table, Add/Edit camera, NVR channel linking, detection-zone editor, detail sheet)
Loading    →  KPI + table skeleton
Empty      →  "No cameras yet" + Add Camera CTA
Error      →  "Couldn't load cameras." + Retry
```

## Run

```
npm run prototype
```

Open the printed URL and pick **PRD_Cameras** (served at
`localhost:5174/PRD_Cameras/`).

Use the floating **Dev · State** control (bottom-right, low opacity, reveals on
hover) to switch states. **Retry** in the error state returns to Populated.

## Recording card (detail drawer)

Open a camera → **Recordings** tab in the detail drawer. Those cards use the
shared [`src/components/shared/RecordingCard.tsx`](../../src/components/shared/RecordingCard.tsx)
(`variant="drawer"`) — the same component the **Recordings** module uses
(`variant="page"`), so the layouts stay identical. See `PRD_Recordings`.

## Files

| File | Purpose |
|------|---------|
| `index.tsx` | App shell (providers + real sidebar/header) + route + floating tester + back-to-top. |
| `RealCameras.tsx` | Renders the real `@/pages/site/cameras` for **Populated**; header + skeleton/empty/error for the other states. |
| `StateTester.tsx` | **PROTOTYPE-ONLY** state control. |
| `shared.tsx` | `ForcedState` type + `CameraTableSkeleton` / `ErrorState` / `EmptyState`. |

## Promoting to src

The **Populated** state IS the real page — nothing to port. When wiring real
loading/empty/error into `src/pages/site/cameras`, reuse the skeleton/empty/error
shapes from `shared.tsx`, but **do not** copy `StateTester.tsx`, the `forced` /
`onResolveForced` props, or the floating tester — those are prototype-only.
