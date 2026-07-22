# PRD: Dashboard — Detections by Site Trend Chart Redesign

**Product:** Accel TRMS Dashboard  
**Feature area:** Dashboard (`/`) — Detections by Site section  
**Date:** 2026-06-11  
**Status:** Draft

---

## Problem

The current "Detections by Site — Severity Breakdown" chart renders all sites as simultaneous line chart series. With 20 sites, the chart produces an unreadable tangle of overlapping lines. The legend alone spans 3 rows. No meaningful trend information can be extracted at a glance.

The root cause is a mismatch between the chart type (all-series line chart) and the operator's actual goal: understanding how detection volume trended over time for specific sites of interest — not all 20 at once.

---

## Goal

Allow operators to track detection trends over time for up to 5 sites simultaneously, with sensible defaults that surface the most critical sites without requiring manual configuration.

---

## Solution

Replace the current all-series line chart with a **focus + filter line chart** — one chart, showing 3–5 operator-selected site lines, with a scrollable chip row for fast site switching.

---

## Detailed Behaviour

### Default state

- On load, the top 3 sites by detection volume in the current date range are pre-selected and rendered as lines
- If fewer than 3 sites have detections in the range, all available sites are shown
- Selection resets when the date range changes (re-derives top 3 from the new range)

### Site selector chip row

- Rendered above the chart
- Contains one chip per site, sorted by detection volume descending (highest volume leftmost)
- Row is horizontally scrollable if chips overflow the container
- Each chip displays: site name + detection count badge for the current date range
- Active chips (currently rendered as lines) are visually highlighted — filled background using the line's assigned colour
- Inactive chips are muted — border only

### Selection rules

- Minimum 1 site selected at all times — deselecting the last active chip is blocked
- Maximum 5 sites selected simultaneously
- When the operator clicks a 6th chip, the oldest-selected site is automatically deselected
- A toast notification fires on auto-deselect: *"[Site name] removed — max 5 sites visible at once"*
- Operator can manually deselect any active chip at any time

### Line chart

- Chart type: line chart (Recharts `LineChart` + `Line`)
- One line per selected site, using the existing `SITE_COLOR_MAP` / `SITE_FALLBACK_COLORS` colour assignment
- Shared Y-axis across all lines — absolute detection counts, not normalised
- No relative/normalised toggle
- Tooltip on hover shows all active site values at that time point
- Legend rendered below the chart, showing only currently active sites (not all 20)

### X-axis — date range responsive

The X-axis adapts to the dashboard-level date filter. The chart has no independent date control of its own.

| Dashboard date range | X-axis ticks | Data granularity |
|---------------------|--------------|-----------------|
| Today | Hourly (00:00 → 23:00) | Per-hour detection counts |
| Yesterday | Hourly (00:00 → 23:00) | Per-hour detection counts |
| This Week | Daily (Mon → Sun) | Per-day detection counts |
| This Month | Daily (1st → last day) | Per-day detection counts |
| Custom range | Daily | Per-day detection counts |

### Y-axis

- Shared scale across all selected site lines
- Minimum 0, maximum auto-scaled to the highest value across all selected series
- No per-site normalisation

---

## Component Changes

### `src/pages/dashboard/index.tsx`

- Replace the current `LineChart` rendering all sites with the new focus + filter implementation
- Add `selectedSites` state (array of site names, max 5, initialised to top 3 by detection volume)
- Add `SiteChipRow` component above the chart — renders scrollable chip list with active/inactive states
- Filter `siteTrend` data to only include series for `selectedSites`
- Update X-axis tick generation to respond to `dateRange` / `dateBounds` — hourly ticks for Today/Yesterday, daily ticks for Week/Month
- Update legend to only render active site entries

### New local component: `SiteChipRow`

```
Props:
  sites: { name: string; count: number; color: string }[]   // all sites, sorted by count desc
  selected: string[]                                         // currently active site names
  max: number                                                // 5
  onChange: (next: string[]) => void
```

- Renders a horizontally scrollable flex row of chip buttons
- Each chip: site name + count badge
- Active chip: filled background (site colour at 15% opacity, coloured border, coloured text)
- Inactive chip: muted border, muted text
- Click handler enforces min 1 / max 5 rules and fires toast on auto-deselect

---

## Out of Scope

- Per-site relative/normalised Y-axis toggle
- Independent date range control on the chart (always follows dashboard filter)
- Small multiples layout (one mini-chart per site)
- Saving or persisting selected site preferences between sessions
