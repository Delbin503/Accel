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

1. **KPI row** — kept as the original single 4-card grid (Sites · Cameras · Events · Open Cases).
   (An earlier live-vs-period split was reverted on request.)
2. **Recent Activity → "View full log".** The section header links to `/activity-logs` via an
   `ArrowUpRight` icon button (already in `src`; retained).
3. **Recent Detections — case-linkage badge.** Detections with a linked `caseId` show a compact
   `info`-coloured pill (e.g. `CASE-2026-0142`); clicking it navigates to `/incidents/:id`.
   Detections with no case show no badge. Badge is dashboard-only.
4. **Recent Activity Log layout fix.** The `TYPE` column was 70px and the long badges
   ("Authentication", "Configuration") overlapped the `Activity` column. Columns are now
   `96px · 140px · 1fr` with a larger gap, and the badge is `truncate whitespace-nowrap` — so
   `Activity` sits clear to the right.

### Dev state behaviour
- **Loading / Error** replace the page (skeleton / retry card).
- **Empty** keeps the **full layout** — every KPI and section card stays visible but reads
  **no data** (KPIs at 0, charts empty, lists show their own "No … in this range" placeholders).

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
