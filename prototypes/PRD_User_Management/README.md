# PRD · User Management (prototype)

Throwaway prototype for the **User Management** page, with every view state
toggleable and a back-to-top affordance matching the Detection Feed.

## Run

```bash
pnpm prototype
```

Open `http://localhost:5174/PRD_User_Management/`.

## States (Dev · State tester, bottom-right)

| State | What it shows |
|-------|---------------|
| **Populated** | The real, fully-working page — seat usage strip, KPI cards, user table with **Load Older Entries** (20 at a time), and all modals (Invite, Change Role, **Transfer Ownership** with password, Suspend, Manage Site, etc.). |
| **Loading** | Skeleton mirroring the seat strip → KPI → table layout. |
| **Empty** | "No team members yet" empty state with an Invite CTA. |
| **Error** | Load failure with a Retry button (returns to Populated). |

## Back to top

A floating circular **Back to top** button appears bottom-right once the page is
scrolled past ~300px, smooth-scrolling the `<main>` scroller (and window) to the
top — identical behaviour to the Detection Feed prototype.

## Notes

- **Populated** renders the real `@/pages/user-management` page, so it stays in
  sync with the live component automatically.
- `StateTester.tsx` and the floating testers are **prototype-only** — do not
  promote them to `src/`.

## Promoting to src

The page itself already lives in `src/pages/user-management`. This prototype only
adds the dev state-tester shell and the back-to-top button. If the back-to-top
pattern should ship app-wide, lift `BackToTop` into the shared layout rather than
copying it per page.
