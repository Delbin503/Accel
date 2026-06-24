# PRD · Onboarding (On-Premise)

Prototype of the **On-Premise** onboarding flow — the offline single-site
account path: operator sign-in plus the first-run setup wizard. Renders the
real auth pages full-screen (no app shell), with a floating dev **Screen** jumper.

```
Account Sign In  →  Setup: License → Site → Admin → Operators  →  Done (dashboard)
```

## Run

```
npm run prototype
```

Open the printed URL and pick **PRD_Onboarding_OnPremise** (served at
`localhost:5174/PRD_Onboarding_OnPremise/`).

## Dev tester (bottom-right, low opacity, reveals on hover)

- **Screen** — jump to any screen: Sign In · License · Site · Admin · Operators ·
  Done. You can also walk the wizard naturally with each step's own buttons.
- **Async** — `Live` (real page) · `Loading` (spinner preview) · `Error` (failure
  preview) for the flow's async actions (sign-in, license activation).

## Files

| File | Purpose |
|------|---------|
| `index.tsx` | Providers + MemoryRouter over the real on-prem routes + floating tester. |
| `StateTester.tsx` | **PROTOTYPE-ONLY** screen jumper + async toggle. |
| `shared.tsx` | Screen list + `Loading` / `Error` / `Done` / not-in-prototype previews. |

## Notes / src touch-points

- Renders the **real** pages (`@/pages/auth/onprem/*`) — nothing is copied.
- `OnPremSetup` gained a tiny optional `initialStep` prop (default `"license"`)
  so the tester can deep-link to the **Site / Admin / Operators** steps.
  Default-off, so the real app is unaffected.
- The dev tester, the async previews, and the `Done` stand-in are
  **prototype-only** — exclude them when promoting to src.
