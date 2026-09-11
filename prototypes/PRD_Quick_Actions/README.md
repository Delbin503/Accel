# PRD · Quick Actions

Throwaway prototype for **Global Search & Quick Actions** — the ⌘K command palette
and the settings that govern it. Does not touch the app baseline.

## Run

```bash
npm run prototype
# open http://localhost:5174/PRD_Quick_Actions/
```

## What it covers

| Surface | What to try |
|---------|-------------|
| **Palette · search** | `⌘K` (or the header field). Type `lobby`, `checkpoint`, `hikvision`. Results group by entity, capped at 5 per group with a "See all" row. |
| **Palette · actions** | `⌘J` (or the ⚡ button). Pinned actions first, then the full catalogue. Pin/unpin from any row. |
| **Prefix filters** | `cam:` `site:` `nvr:` `case:` `rule:` `model:` `user:` `event:` `rec:` |
| **Saved queries** | Detections and recordings return a *filtered view* row, not raw rows — selecting one deep-links the page with the filter applied. |
| **Settings** | `System Configuration → Quick Actions`: availability, pin order, pin cap, recents, and a role preview. |

The floating panel (bottom-left toggle) is a cheat sheet with one-click sample queries.

## What is prototype-only

- `QuickActionsConfigPage.tsx` — a stand-in System Configuration page. The nine real
  sections are stubs; only Quick Actions is built. The shipped page is unchanged.
- `QuickActionsSection.tsx` — the settings controls. If these graduate, they belong in
  `src/pages/system-config/index.tsx` as a tenth section.
- `QuickActionsTips.tsx` — reviewer cheat sheet, never ships.

Everything else is the real thing: `CommandPalette`, `useGlobalSearch`,
`lib/quickActions.ts` and `useQuickActionsStore` all come from `src/`, so what you see
here is what the app does.

## Notes

- Settings write straight into the real persisted store (`accel-quick-actions` in
  localStorage), shared with every other prototype on this origin. "Reset" in the
  Palette behaviour card puts everything back to shipped defaults.
- "Preview as role" mutates the auth store's role — it also changes what the sidebar and
  pages show, which is the point: role-gated actions disappear rather than fail.
