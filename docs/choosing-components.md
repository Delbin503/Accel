# Which component do I use?

A decision guide for the Accel design system. Read it top to bottom for the situation you're building; the first matching row wins. If nothing fits, **stop and ask** before creating a component (CLAUDE.md → "Building page UI").

Catalogue: `src/components/registry.json` · Storybook: `npm run storybook` · Conventions: `CLAUDE.md`

---

## Overlays: Modal, ConfirmDialog, Sheet, Popover, Tooltip

| You need… | Use | Not |
|---|---|---|
| A yes/no confirmation or destructive action ("Delete site?") | **`ConfirmDialog`** (shared) | Hand-built Modal with warning + buttons |
| A focused task the user must finish or cancel: a form, a picker, a wizard step | **`Modal`** + `ModalContent` / `ModalHeader` / `ModalBody` / `ModalFooter` (shared) | Raw `Dialog` from ui (Modal owns the header/body/footer chrome and sizes) |
| Form fields inside a Modal | **`ModalForm`** parts (`ModalField`, `ModalTextInput`, `ModalSelect`, `CheckList`…) | Ad-hoc label + input markup |
| A side panel showing details of a row while the list stays visible (event, case, camera, user) | **`DetailDrawer`** (shared) — header / body sections / footer, `size` md · lg · xl | Modal (hides the list); hand-sized `Sheet` |
| A small anchored panel: filters, date range, quick settings | **`Popover`** (ui) | Modal |
| A list of actions on a "⋯" button | **`DropdownMenu`** (ui) | Popover with hand-made rows |
| A hint on hover/focus, no interaction inside | **`Tooltip`** (ui) | Popover |
| A brief, non-blocking result message ("Saved") | `toast` (sonner) | Modal |
| A searchable list of commands or destinations (⌘K) | **`Command`** (ui) — the app's palette is `CommandPalette` (app) | Popover + hand-filtered list |
| Pointing a first-time user at one control during onboarding | **`CoachMark`** (custom) around the target | Tooltip (closes on its own) |
| A short animated how-to shown once per feature | **`GuideGifModal`** (custom) | Modal with an `<img>` |

## Choosing one value from a set

| You need… | Use | Not |
|---|---|---|
| 2–5 options, all visible, switching a **view or mode** in place (Hero / Wall / Custom, 24-hour / 12-hour) | **`SegmentedControl type="single"`** (ui) | Row of Buttons with manual active state |
| Options that each **swap a content panel** below (Overview / Channels / Recordings) | **`Tabs`** (ui) | SegmentedControl |
| On/off for one setting | **`Switch`** (ui) | A one-item SegmentedControl |
| One choice from a long or growing list, in a form | **`Select`** (ui) | — |
| One choice shown as a field, options need a description line | **`ChoiceDropdown`** (shared) | Select (no descriptions) |
| A few options shown as radio rows in a form | **`RadioGroup`** (ui) | — |
| Choosing between **rich cards** (plan, role, network mode, model) | **`ItemButton`** with `selected` (ui `item`) | Button (forces button sizing) |
| A numeric value on a range (confidence, threshold) | **`Slider`** (ui) | `<input type="range">` |

## Choosing several values

| You need… | Use | Not |
|---|---|---|
| Filtering a list by one dimension (sites, severity, status) | **`FilterDropdown`** (shared) — multi-select popover | Inline checkbox lists |
| Several filters together, with "Clear all" | **`FilterPanel`** (shared) wrapping FilterDropdowns | Hand-laid grid |
| A few always-visible toggle chips (sites on a chart) | **`SegmentedControl type="multiple" variant="outline"`** | Buttons with `rounded-full` |
| A checklist inside a Modal | **`CheckList`** / **`CheckRow`** (`ModalForm`) | — |
| A date range filter | **`DateRangeBar`** (shared) | Custom pills + popover |

## Actions and clickable things

| You need… | Use | Not |
|---|---|---|
| An action: Save, Deploy, Cancel | **`Button`** — `variant` = default / outline / secondary / ghost / destructive / link, `size` = xs / sm / default / lg | Raw `<button>` (lint blocks it in pages) |
| An icon-only action | **`Button size="icon-xs"…"icon-lg"`** + `aria-label` | — |
| An inline text action ("Clear all", "View feed") | **`Button variant="link"`** | Styled `<span onClick>` |
| A whole row or card that is the click target (list row, camera tile, nav item) | **`ItemButton`** (ui `item`); `variant="plain"` when the caller supplies layout | Button with `h-auto` hacks |
| An action bar pinned to the bottom while items are selected | **`FloatingBar`** (shared) | `sticky` / `fixed` div |

## Showing data

| You need… | Use | Not |
|---|---|---|
| A headline metric with label, value, trend | **`KpiCard`** in a **`KpiGrid`** (shared), colour via `tone` | Card with big number |
| A status, severity or health label | **`StatusBadge`** (shared), colour via `tone` | `Badge` with custom classes |
| A neutral count or tag | **`Badge`** (ui) | StatusBadge |
| A list of records with columns | **`DataTable`** (shared). `variant="list"` for the list-page style; `onRowClick` (Enter/Space too); `column.stopRowClick` for menu/button cells; `selection` for checkboxes; `stickyHeader` + `containerClassName="max-h-…"`; `column.sticky="right"`; `getRowClassName` for row tints; `empty.variant="inline"` inside cards. **`Table`** parts (ui) only for expandable or grouped rows | Raw `<table>` (lint blocks it in pages) |
| A titled block of content on a page | **`SectionCard`** (shared) | `Card` + hand-made header |
| A plain surface with no title chrome | **`Card`** (ui) | — |
| Area / bar / line / donut chart | **`AreaChart`**, **`BarChart`**, **`LineChart`**, **`DonutChart`** (charts). Options: `yAxis={{ show, domain, ticks, tickFormatter }}`, `xAxis={{ angle, interval, tickFormatter }}`, `dots`, `referenceLines`, `valueFormatter` for tooltip units | Direct Recharts imports |
| A specialised visualisation (swing path, shot plot, floor plan) | Recharts or SVG directly, with chart tokens (`var(--chart-N)`, semantic colours) | — |
| Long text in a tight space | **`TruncatedText`** (shared) | `truncate` + manual tooltip |
| A progress value with label | **`ProgressRow`** (shared), or `Progress` (ui) for a bare bar | — |
| Label / value facts about one record (IDs, IPs, settings, a review step) | **`DescriptionList`** + `DescriptionItem` (shared) — `layout` stacked · inline | Hand-built grid of label/value divs |

## Empty, loading and error

| You need… | Use | Not |
|---|---|---|
| No data yet, or no results for the current filters | **`EmptyState`** (shared) | "No X found" `<p>` |
| Loading / error for a list page (KPI row + filters + table) | **`PageStates`** (`ListLoadingState`, `ListErrorState`) | Full-screen spinner |
| A loading placeholder for one block | **`Skeleton`** (ui) | Spinner |

## Inputs

| You need… | Use |
|---|---|
| Text, email, number, search | **`Input`** (ui); search in a toolbar → **`ToolbarSearch`** (shared); search inside a popover or picker → **`ToolbarSearch size="sm"`** |
| Multi-line text | **`Textarea`** (ui) |
| A verification code | **`OtpField`** (shared) |
| A phone number with country code | **`PhoneField`** (shared) |
| A time of day | **`TimeSelect`** (shared) |
| A password with strength feedback | `Input type="password"` + **`PasswordStrengthBar`** (shared) |
| A checkbox | **`Checkbox`** (ui) |

## Page structure

| You need… | Use |
|---|---|
| Page title, description and primary actions | **`PageHeader`** (layout) |
| Progress through fixed steps (sign-up, setup, a multi-step modal) | **`Stepper`** (shared) — indicator only; Back / Next stay with the page |
| A search + controls row above a list | **`Toolbar`** + **`ToolbarSearch`** (shared) |
| App shell, sidebar | **`AppLayout`**, **`AppSidebar`** (app) — Accel-specific, already wired by the router |

---

## Learn by example

Storybook → **Guidelines/Usage** has a live Do / Don't for the top 10 components, and **Guidelines/Page patterns** has a complete list page, detail drawer and form wizard to copy from. **Foundations/Token Reference** is generated from `src/index.css`.

## Rules of thumb

- **Pick by behaviour, not by look.** Restyle with `variant` / `tone` / `size` before reaching for a different component.
- **`tone` is semantic colour** (`success`, `warning`, `info`, `violet`, `severity-*`, `primary`, `neutral`). `variant` is visual style. Never pass raw colours.
- **`components/app/` is Accel-specific** (UserMenu, NotificationsBell, RequireRole…). Reuse it inside this product, but it is not part of the reusable design system.
- **Nothing fits?** Write down what's missing and which components you considered, and ask before building a new one. After approval: CVA + tokens, `data-slot` on every element, a story, and an entry in `registry.json`.
