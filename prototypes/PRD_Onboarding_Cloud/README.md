# PRD · Onboarding (Cloud)

Prototype of the **Cloud** onboarding flow — the self-serve, cloud-hosted path
from sign-in through site creation and subscription to the dashboard. Renders the
real auth pages full-screen (no app shell), with a floating dev **Screen** jumper.

```
Sign Up → Verify email → Choose Plan → Payment details → Create Site → Invite Team
        → Review & Checkout → Dashboard (welcome modal)
```

Nothing is charged or created until **Review & Checkout**. The review page lists
every step's answers with an **Edit** button per section; editing opens that step
with "Save & return to review" / "Back to review", so the user comes straight back.
Changing the work email asks for a new verification code. Skipping the plan step
drops the Payment section and turns checkout into **Finish setup** (free trial).
Confirming lands on the real dashboard, which shows the welcome modal once.

## Run

```
npm run prototype
```

Open the printed URL and pick **PRD_Onboarding_Cloud** (served at
`localhost:5174/PRD_Onboarding_Cloud/`).

## Dev tester (bottom-right, low opacity, reveals on hover)

- **Screen** — jump to any screen: Sign In · Verify · **Suspended** · Sign Up ·
  Forgot Pw · Choose Plan · Payment · Create Site · Members · Review (opens with
  demo answers filled in). You can also walk
  the flow naturally with each page's own buttons.
- **Async** — `Live` (real page) · `Loading` (spinner preview) · `Error` (failure
  preview) for the flow's async actions (sign-in, payment).

## Files

| File | Purpose |
|------|---------|
| `index.tsx` | Providers + MemoryRouter over the real auth routes + floating tester. |
| `StateTester.tsx` | **PROTOTYPE-ONLY** screen jumper + async toggle. |
| `shared.tsx` | Screen list + `Loading` / `Error` / `Done` / not-in-prototype previews + the suspended-account demo state. |

## Suspended account

`Suspended` is a sign-in **outcome**, not a wizard step — a user whose account an
owner has suspended never reaches onboarding. Two ways to see it:

1. Hit the **Suspended** button in the tester, or
2. Sign in with a suspended user's email (e.g. `kelvin@bluesilo.studio`) on the
   real Sign In screen — it branches before the Verify step, since there is no
   point issuing a code that cannot establish a session.

The page reads who suspended the account, the end date, and the reason off router
state, which the real `SignIn` supplies. The tester jump has no such state, so
`shared.tsx` passes `SUSPENDED_DEMO_STATE`, built from the first suspended user
in `@/mocks/users` — the same record User Management shows.

## Notes / src touch-points

- Renders the **real** pages (`@/pages/auth/*`) — nothing is copied.
- `OnboardingSubscription` gained a tiny optional `initialStep` prop (default
  `"pick"`) so the tester can deep-link to the **Payment** sub-step. Default-off,
  so the real app is unaffected.
- The dev tester, the async previews, and the `Done` stand-in are
  **prototype-only** — exclude them when promoting to src.
