# PRD · Onboarding · Temp Password (prototype)

First-time sign-in for an **on-premise member who was issued a Temporary
Password** by their site administrator. Because the credential is temporary,
the member must verify a second factor and then set their own password before
reaching the dashboard.

```
Sign in              →  Two-factor verification  →  Create new password  →  Dashboard
(email + temp pw)       (6-digit code)               (new + confirm)         (redirecting…)
```

## Run

```bash
npm run prototype
```

Open `http://localhost:5174/PRD_Onboarding_TempPassword/`.

Use the floating **Step** tester (bottom-right, low opacity, reveals on hover)
to jump between the three steps and the Dashboard state.

## What's here

| File | Purpose |
|------|---------|
| `TempPasswordFlow.tsx` | The four-step flow as local state (`signin → 2fa → newpw → done`). Reuses the visual structure of `OnPremSignIn`, `SignInVerify`, and the "create new password" step of `OnPremForgotPassword`. |
| `StateTester.tsx` | Prototype-only floating step jumper. Not promoted to src. |
| `index.tsx` | Shell — `ThemeProvider(dark)` → `MemoryRouter` → `QueryClientProvider` → `TooltipProvider` → flow + `<Toaster />`. |

## Steps

1. **Sign in** — email + temporary password, with the note "You were given a
   temporary password — you'll set your own after verifying." Inline field
   errors (`aria-invalid` + `text-sev-critical`) validate the email and a
   non-empty password.
2. **Two-factor verification** — 6 OTP boxes (auto-advance, paste, resend),
   matching `SignInVerify`. Inline error when fewer than 6 digits.
3. **Create new password** — New + Confirm password with `PasswordStrengthBar`
   and a length hint. Validates ≥ 8 chars and a match, inline. On submit fires
   `toast.success("Password set")` and advances to **done**.
4. **Done** — a "Redirecting to dashboard…" success screen.

## Promoting to src

This is logged-out / pre-auth UI built on `AuthLayout` (`hideBrand`). When
promoting, the four steps map onto auth routes (e.g. `/on-premise/signin`,
`/on-premise/verify`, `/on-premise/set-password`); the temporary-password state
comes from the auth session, not local component state. The `StateTester` is
prototype-only — drop it.
