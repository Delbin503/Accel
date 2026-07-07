# PRD · Email Templates (prototype)

A gallery of Accel's transactional **email templates**, built to match the
official Accel email design in Figma
([node 3468:1489](https://www.figma.com/design/3zuhOHLseacxDg8co2eQZH/Accel--TRMS-?node-id=3468-1489)):
dark card, Accel orange (`#FE5C01`), Manrope type, `Sigmawave Team` sign-off.

Use the **Template** dropdown (top-right) to switch between templates. Each one
shows its subject line, when it's sent, audience, and merge tags alongside a live
inbox preview.

## Run

```bash
npm run prototype
```

Open `http://localhost:5174/PRD_Email_Templates/`.

## Templates

| # | Template | Priority | When it's sent |
|---|----------|----------|----------------|
| 1 | **Email Verification / OTP Code** | P1 | Account setup (invite → signup) and on any email change. |
| 2 | **Sign-in Verification Code** | P1 | Login, when 2FA is enabled. |
| 3 | **Password Reset Request** | P1 | User requests a reset — delivers a code (not a link). |
| 4 | **Password Changed / Reset Confirmation** | P1 | After a password change (self or admin-forced). |
| 5 | **Two-Factor Authentication Changed** | P2 | User enables/disables 2FA (`{{action}}`). |
| 6 | **Welcome / Account Activated** | P1 | Account becomes active after setup + verification. |
| 7 | **User Invitation** | P1 | Admin invites someone. Faithful build of the Figma reference and the base every other email follows. |
| 8 | **Role Changed** | P2 | Admin changes a user's role. |
| 9 | **Ownership Transfer** | P1 | Workspace ownership transferred (to both owners). |

Each template is a **standalone, sendable** `.html` file under `templates/`
(table layout + inline styles, Outlook VML button where needed, Manrope with
Arial fallback). Hand them to the backend / mail service and replace the
`{{merge_tags}}` server-side.

## Design system (shared shell)

All templates share one skeleton so new ones stay consistent:

- **Page bg** `#111010` · **card bg** `#201E1D` · **radius** `16px` · **width** `600px`
- **Logo** — orange `#FE5C01` rounded square + play mark, `Accel` wordmark (white, 20px/700)
- **Heading** white `#FFFFFF`, 26px/700 · **body** `#B8B3AF`, 15px, line-height 1.7
- **Emphasis** in body → white · **CTA / accent** → `#FE5C01`
- **Footer** hairline `#2E2A28`, muted `#6E6A67`
- **Font** `Manrope` (web font link) → `'Helvetica Neue', Arial, sans-serif` fallback

## Adding a template

1. Add a sendable `templates/<name>.html` following the shared shell.
2. Register it in the `TEMPLATES` array in `index.tsx` (imported via `?raw`) with
   its subject, priority, when-sent, audience, and merge tags.

It appears in the dropdown automatically.

## Notes

- Preview renders each email in an isolated `<iframe srcDoc>` so its own
  `<body>`/styles don't leak into the gallery chrome.
- The older light-themed `PRD_Invite_Signup/invite-email.html` predates the Figma
  design — the dark `templates/invitation.html` here is the canonical one.
- The gallery chrome (dropdown, info panel) is prototype-only — only the files in
  `templates/` ship.
