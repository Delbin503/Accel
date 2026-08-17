# PRD · Profile Settings

Throwaway prototype for the **profile dropdown** and everything reachable from it.
Served at its own URL by the prototype Vite config; does not touch the app baseline.

## Run

```bash
npm run prototype
# open http://localhost:5174/PRD_Profile_Settings/
```

## The flow

This prototype is about the *entry point*, not a single page. The modules here have
no sidebar nav item — the only way in is the **profile card at the bottom of the
sidebar** (avatar · name · role badge). Click it to open the dropdown, which shows
the signed-in user's name, email and role, then routes to four destinations:

| Dropdown item | Route | What it covers |
|---------------|-------|----------------|
| **My Profile** | `/profile` | Personal details (name, display name, email, phone, departments), avatar, password change, active sessions. |
| **Settings** | `/settings` | Appearance / theme, notification preferences (email, push, sound), and the rest of the per-user preferences. |
| **Billing & License** | `/billing` | Plan and subscription lifecycle, seats, invoices, payment method. Also has its own standalone prototype (`PRD_Billing`). |
| **System Info** | `/system-info` | Application version, infrastructure details, live service status. |

**Sign Out** clears the auth store and routes to `/signin`. That also hides the
sidebar's profile section, which would leave a prototype with no auth flow stuck —
so `/signin` renders a stand-in panel with a **Sign back in** button that restores
the seeded user. The real sign-in screen belongs to `PRD_Onboarding_Cloud`.

## States

No floating state tester here. These four pages are user/account surfaces backed by
local stores rather than fetched lists, so they have no meaningful loading / empty /
error variants to force — unlike the list-driven modules (Users, Cameras, Detection
Feed). If any of them later grows a real fetch, add a `StateTester` then.

## Promoting to src

Nothing here needs promoting. All four pages already live in `src/pages/`
(`profile`, `settings`, `billing`, `system-info`) and the dropdown itself is real,
in `src/components/layout/AppSidebar.tsx`. `index.tsx` — the router, the
`SignedOut` stand-in and the back-to-top button — is prototype-only scaffolding.
