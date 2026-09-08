# PRD · System Configuration

Throwaway prototype for the **System Configuration** module. Served at its own URL
by the prototype Vite config; does not touch the app baseline.

## Run

```bash
npm run prototype
# open http://localhost:5174/PRD_System_Configuration/
```

## What it covers

The admin settings surface at `/config` — a left section rail with nine panels,
a dirty-state Save bar, and the real controls for each area:

| Section | What it configures |
|---------|--------------------|
| **General** | Organization, date & time, number formats |
| **User Access** | Role permissions matrix |
| **SLA & Escalation** | Response targets per severity |
| **Detection Engine** | Confidence thresholds, models |
| **Camera Defaults** | RTSP, codec, frame rate, recording |
| **NVR Defaults** | Channel cleanup, storage warnings |
| **Notifications** | Default delivery channels |
| **Integrations** | Webhooks, SSO, third-party |
| **Security** | Auth policy & audit |

This is workspace-wide configuration, distinct from the per-user preferences in
`PRD_Profile_Settings` (Settings → appearance, personal notifications).

## States

No floating state tester. The page is a settings form backed by local state
rather than a fetched list, so it has no meaningful loading / empty / error
variants to force — unlike the list-driven modules (Users, Cameras, Detection
Feed). If it later grows a real fetch, add a `StateTester` then.

## Promoting to src

Nothing to promote. The page already lives in `src/pages/system-config`.
`index.tsx` — the router and the back-to-top button — is prototype-only
scaffolding.
