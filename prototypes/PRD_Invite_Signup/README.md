# PRD · Invite Signup (prototype)

The flow an **invited** user goes through after an admin invites them from the
User Management panel — distinct from the normal self-serve signup because
**no subscription or payment** is involved. The seat, role, and site access are
already assigned; the invitee only completes their profile and sets a password.

```
Invite email  →  Create an account  →  Account setup  →  Welcome modal  →  Dashboard
 (sent by admin)   (button in email)     (this proto)      (this proto)     (this proto)
```

## Run

```bash
npm run prototype
```

Open `http://localhost:5174/PRD_Invite_Signup/`.

Use **Restart flow** (bottom-right) to replay from the top.

## What's here

| File | Purpose |
|------|---------|
| `invite-email.html` | **Sendable** transactional invite email. Table layout + inline styles, Outlook VML button, `{{merge_tags}}`. The "Create an account" button links to `{{acceptUrl}}` (the account-setup page). |
| `AccountSetup.tsx` | The setup form. Admin-assigned **Email / Role / Site access** are shown read-only; the invitee fills the editable fields below. |
| `WelcomeModal.tsx` | Post-signup welcome dialog → **Enter dashboard**. |
| `index.tsx` | Router + the destination dashboard landing (real `AppSidebar` + header). |
| `shared.tsx` | `InviteContext` (decoded invite token), `MOCK_INVITE`, brand mark, helpers. |

## Fields collected at setup

Mirrors the **Member Details** shown in the dashboard user drawer
(`src/pages/user-management`, `UserData` in `src/types/users.ts`):

- **Read-only (assigned by admin):** Email, Role, Site access
- **Invitee fills:** Full name, Display name, Phone (optional), Department (optional),
  Password (+ confirm), and an optional **Two-factor** toggle (pre-on for Admins).

Created On / Last Active / User ID are system-generated server-side, so they're
not part of the form.

## The email

`invite-email.html` is independent of the React app — hand it to the backend /
mail service. Replace the merge tags server-side:

`{{inviteeFirstName}}` · `{{inviterName}}` · `{{orgName}}` · `{{roleLabel}}` ·
`{{siteList}}` · `{{acceptUrl}}` · `{{expiryDays}}` · `{{supportEmail}}`

## Promoting to src

This is logged-out / pre-auth UI, so it doesn't belong under the authenticated
app shell. When promoting, the form (`AccountSetup`) and `WelcomeModal` move to
an auth route group; the read-only invite context comes from the decoded token,
not `MOCK_INVITE`. The `RestartButton` is prototype-only — drop it.
