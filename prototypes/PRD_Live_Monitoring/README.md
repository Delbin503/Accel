# PRD — Live Monitoring

Throwaway prototype of the Live Monitoring page, rendered inside the real sidebar shell with a
dev **State tester** (Populated / Loading / Empty / Error). Isolated from `src/`.

## Run

```bash
npm run prototype        # vite on http://localhost:5174
# then open:
# http://localhost:5174/PRD_Live_Monitoring/
```

Floating **Dev · State** control (bottom-right, faint, reveals on hover) flips the state.

## Fixes in this prototype

1. **Custom layout mode removed** — the view toggle now offers only **Hero** and **Wall**.
2. **Site summary moved to the top** — the "All sites · N cameras total · M online" strip now sits
   **under the toolbar**, above the views (applies to both Hero and Wall).
3. **`X ACTIVE` badge is green** in Hero view (was amber/warning).
4. **Hover tooltips on the count chips:**
   - Per-area `1 · 4` → "1 offline · 4 cameras in this area" (it's **offline · total**, not online/offline).
   - List header `11 · 8 on · 3 off` → "11 cameras · 8 online · 3 offline".
5. **Hero camera manual lock** — confirmed/retained: hero defaults to the first camera, clicking a
   sidebar tile promotes it to hero, it then **stays locked** (no detection-severity auto-switch
   exists), and the selected tile shows a ring. No code change was needed — the page already
   behaves exactly as the PRD specifies.

## Files

| File | Role |
|------|------|
| `index.tsx` | Shell: real `AppSidebar` + header + route + floating **State tester** + `<Toaster>` |
| `RealLiveMonitoring.tsx` | Copy of `src/pages/live-monitoring/index.tsx` + the 5 fixes + forced states |
| `states.tsx` | `ForcedState`, `CameraSkeleton`, `ErrorState` |
| `StateTester.tsx` | **PROTOTYPE-ONLY** dev control |
| `proto.css` | Pulls in the app Tailwind theme + tokens |

## Promoting to `src/`

Apply the fix diffs back onto `src/pages/live-monitoring/index.tsx`. **Do NOT carry over:**

- `StateTester.tsx`, `FloatingTester`, the `MemoryRouter`/shell in `index.tsx`, and `states.tsx`
  (`CameraSkeleton`/`ErrorState`) unless you want real loading/error states wired to the data layer.
- The `forced` / `onResolveForced` props and the `forced === …` override branch.

Fixes 1–5 (Custom removed, strip moved, green badge, tooltips, manual lock) port directly. Note:
fix 1 here just removes Custom from the toggle; in `src` you may also want to delete the now-unused
`CustomView` / `LayoutSwitcher` / `GridSizeControl` and the custom-layout store fields.
