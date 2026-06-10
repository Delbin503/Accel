# PRD: Live Monitoring & Dashboard — UX Improvements

**Product:** Accel TRMS Dashboard  
**Feature area:** Dashboard (`/`) + Live Monitoring (`/live-monitoring`)  
**Date:** 2026-06-10  
**Status:** Draft

---

## Overview

This PRD covers UX gaps and improvements identified across the main dashboard and live monitoring pages. Scope includes KPI clarity, camera sidebar behaviour, layout management, detection-to-case linkage, and wall view navigation. System health architecture is excluded pending backend definition.

---

## 1. Dashboard KPI Row — Live vs Period Split

**Problem:** The KPI row mixes live real-time metrics (cameras online) with date-filtered period metrics (detections, cases) in a single undifferentiated row. An operator selecting "This Week" may incorrectly interpret the cameras-online count as a weekly average rather than the current live count.

**Solution:** Split the KPI row into two visually distinct groups.

**Live Status group (always real-time, unaffected by date filter):**
- Cameras Online (current live count)
- System Health status pill

**Period Metrics group (reacts to date range filter):**
- Total Detections in range
- Open Cases in range
- Escalated Cases in range

**Display:**
- Live Status group shows a pulsing "Live" indicator to communicate real-time nature
- Period Metrics group shows the active date range label below the section header
- Clear visual separator between the two groups (section label or divider line)

---

## 2. Live Monitoring — Remove Custom Layout Mode

**Problem:** The Custom layout mode (drag, drop, resize tiles on a free grid) adds complexity and creates per-user local layouts that are invisible to the rest of the team. Layouts stored in localStorage cannot be shared across operators.

**Solution:** Remove the Custom view mode entirely. The view mode selector simplifies to two options: **Hero** and **Wall**.

**Layout sharing:**
- Saved layouts (previously custom) are replaced with organisation-wide shared layouts
- All users within the same organisation see the same set of layouts
- Layouts are managed by admin/owner roles — create, rename, delete
- Standard users can switch between shared layouts but cannot create or delete them

**Migration note:** Any locally persisted custom layouts in `localStorage` under `trms.live-monitoring` are discarded on next load. No migration path required (mock data only).

---

## 3. Dashboard Recent Activity — "View All" Link

**Problem:** The Recent Activity section on the dashboard shows the last 8 audit log entries with no way to go deeper. It is a dead-end list with no filtering, search, or pagination.

**Solution:** Add a "View all activity" action link in the Recent Activity section header that navigates to the existing `/activity-logs` page.

**Behaviour:**
- Link renders as a small `ArrowUpRight` icon button in the section header (consistent with other dashboard section headers)
- No changes required to the Activity Logs page itself

---

## 4. Live Monitoring Sidebar — Camera Order & Collapse State

**Problem:** Within each area group in the Hero view sidebar, cameras are displayed in mixed order regardless of status. Offline cameras are not visually differentiated from online ones. Collapse/expand state of area groups is not persisted between sessions.

**Solution A — Camera ordering:**
- Within each area group, online cameras render first
- Offline cameras render at the end, separated by a subtle divider line and a muted "Offline" label
- Order within each status group is alphabetical by camera ID

**Solution B — Collapse state persistence:**
- The expanded/collapsed state of each area group is stored in `useLiveMonitoringStore` keyed by `siteId + areaKey`
- State persists across page navigation and browser sessions via Zustand `persist`

**Solution C — Collapse all / Expand all:**
- Add a "Collapse all" / "Expand all" toggle button in the sidebar header
- Toggle label switches based on current state: if all areas are expanded → show "Collapse all"; if any area is collapsed → show "Expand all"

---

## 5. Dashboard Recent Detections — Case Linkage Badge

**Problem:** The Recent Detections list on the dashboard shows no indication of whether a detection has already been escalated into a case. Operators cannot tell at a glance which detections have been actioned.

**Solution:** On each detection row in the Recent Detections list, display a compact case ID badge when that detection has a linked `caseId`.

**Behaviour:**
- Badge renders as a small pill showing the case ID (e.g. `CASE-2026-0142`) using the existing `info` colour token
- Clicking the badge navigates to the case detail page (`/incident-cases/:id`)
- Detections with no linked case show no badge — no empty placeholder
- Badge only appears on the dashboard Recent Detections list — not on camera tiles in live monitoring, not on the detection feed page

---

## 6. Live Monitoring Hero View — Manual Camera Lock

**Problem:** The hero camera (the large featured camera on the left) defaults to the first camera in the list. There is no defined behaviour for auto-promotion based on detection severity.

**Solution:** The hero camera is always manually selected. No automatic promotion or switching occurs.

**Behaviour:**
- On page load, hero defaults to the first camera in the list (existing behaviour retained)
- Clicking any camera tile in the sidebar promotes it to hero
- Once an operator has manually selected a hero camera, it stays locked — new detections on other cameras do not auto-switch the hero
- A subtle "selected" ring on the sidebar tile indicates which camera is currently the hero

---

## 7. Live Monitoring Wall View — Detection State on Page Indicators

**Problem:** The wall view paginates cameras across pages (2×2, 3×3, 4×4). When a detection fires on a camera on a page the operator is not currently viewing, there is no indication that something requires attention off-screen.

**Solution:** Add page indicator dots below the wall grid. Each dot represents one page and reflects the detection state of cameras on that page.

**Dot states:**
- Default: muted border, no fill — no active detections on this page
- Warning: `warning` colour fill — at least one medium detection active on this page
- Critical: `sev-critical` colour fill — at least one critical detection active on this page
- Active page: outlined ring around the dot

**Behaviour:**
- Dots are display-only — clicking a dot does not navigate (operator uses existing prev/next chevrons)
- Dot state updates whenever detection counts change
- No auto-jump to a page with active detections — operator navigates manually

---

## 8. System Health — Architecture TBD

**Problem:** System health metrics (CPU, Memory, Disk I/O, Network, Uptime) are displayed as a single server view. For multi-site deployments it is unclear whether each site runs its own VMS server or all sites share a centralised server.

**Decision:** Leave the current single-server health display unchanged until the backend monitoring architecture is defined. This section is an open question for the engineering team.

**Open question for engineering:** Is system health tracked per-site (one VMS server per site) or as a single centralised server? Answer determines whether a site selector is needed in the System Health section.

---

## Access Control

| Feature | Owner | Admin | User |
|---------|-------|-------|------|
| View dashboard | ✓ | ✓ | ✓ |
| View live monitoring | ✓ | ✓ | ✓ |
| Switch shared layouts | ✓ | ✓ | ✓ |
| Create / rename / delete shared layouts | ✓ | ✓ | — |

---

## Out of Scope

- Alert tray on live monitoring (count badge is sufficient for now)
- Deep-link from dashboard zone rows to live monitoring
- Case linkage badge on live monitoring camera tiles
- Auto-jump to highest-severity page in wall view
- Activity Logs page changes (existing page used as-is)
- System health per-site breakdown (pending backend architecture decision)
