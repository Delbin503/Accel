# PRD — Dashboard

Throwaway prototype of the main Dashboard, rendered in the real sidebar shell with a dev
**State tester** (Populated / Loading / Empty / Error). Isolated from `src/`.

## Run

```bash
npm run prototype        # vite on http://localhost:5174
# then open:
# http://localhost:5174/PRD_Dashboard/
```

Floating **Dev · State** control (bottom-right, faint, reveals on hover) flips the state.

## Fixes in this prototype

1. **KPI row split — live vs period.** Two labelled groups instead of one undifferentiated row:
   - **Live Status** (always real-time, ignores the date filter): **Cameras Online** + **System
     Health** — with a pulsing "Live" indicator on the group header.
   - **Period Metrics** (react to the date range): **Total Detections**, **Open Cases**,
     **Escalated Cases** — with the active date-range label beside the group header.
   (The old standalone "Sites" card was dropped to match the PRD's two-group spec.)
2. **Recent Activity → "View full log".** The section header already links to `/activity-logs`
   via an `ArrowUpRight` icon button (retained, satisfies the PRD).
3. **Recent Detections — case-linkage badge.** Detections with a linked `caseId` show a compact
   `info`-coloured pill (e.g. `CASE-2026-0142`); clicking it navigates to `/incidents/:id`.
   Detections with no case show no badge. Badge is dashboard-only.
4. **Recent Activity Log layout fix.** The `TYPE` column was 70px and the long badges
   ("Authentication", "Configuration") overlapped the `Activity` column. Columns are now
   `96px · 140px · 1fr` with a larger gap, and the badge is `truncate whitespace-nowrap` — so
   `Activity` sits clear to the right.

## Files

| File | Role |
|------|------|
| `index.tsx` | Shell: real `AppSidebar` + header + route + floating **State tester** + `<Toaster>` |
| `RealDashboard.tsx` | Copy of `src/pages/dashboard/index.tsx` + the 4 fixes + forced states |
| `states.tsx` | `ForcedState`, `DashboardSkeleton`, `ErrorState`, `EmptyState` |
| `StateTester.tsx` | **PROTOTYPE-ONLY** dev control |
| `proto.css` | Pulls in the app Tailwind theme + tokens |

## Promoting to `src/`

Apply the fix diffs back onto `src/pages/dashboard/index.tsx`. **Do NOT carry over:** the
`StateTester` / `FloatingTester` / `MemoryRouter` shell, `states.tsx`, the `forced` /
`onResolveForced` props, and the `if (forced !== "normal")` early-return. Fixes 1–4 port directly
(fix 2 already exists in `src`).
