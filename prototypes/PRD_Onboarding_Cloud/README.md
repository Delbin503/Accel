# PRD · Onboarding (Cloud)

Prototype of the **Cloud** onboarding flow — the self-serve, cloud-hosted path
from sign-in through site creation and subscription to the dashboard. Renders the
real auth pages full-screen (no app shell), with a floating dev **Screen** jumper.

```
Sign In / Sign Up / Forgot Pw  →  Create Site  →  Choose Plan  →  Payment  →  Done (dashboard)
```

## Run

```
npm run prototype
```

Open the printed URL and pick **PRD_Onboarding_Cloud** (served at
`localhost:5174/PRD_Onboarding_Cloud/`).

## Dev tester (bottom-right, low opacity, reveals on hover)

- **Screen** — jump to any screen: Sign In · Sign Up · Forgot Pw · Create Site ·
  Choose Plan · Payment · Done. You can also walk the flow naturally with each
  page's own buttons.
- **Async** — `Live` (real page) · `Loading` (spinner preview) · `Error` (failure
  preview) for the flow's async actions (sign-in, payment).

## Files

| File | Purpose |
|------|---------|
| `index.tsx` | Providers + MemoryRouter over the real auth routes + floating tester. |
| `StateTester.tsx` | **PROTOTYPE-ONLY** screen jumper + async toggle. |
| `shared.tsx` | Screen list + `Loading` / `Error` / `Done` / not-in-prototype previews. |

## Notes / src touch-points

- Renders the **real** pages (`@/pages/auth/*`) — nothing is copied.
- `OnboardingSubscription` gained a tiny optional `initialStep` prop (default
  `"pick"`) so the tester can deep-link to the **Payment** sub-step. Default-off,
  so the real app is unaffected.
- The dev tester, the async previews, and the `Done` stand-in are
  **prototype-only** — exclude them when promoting to src.
