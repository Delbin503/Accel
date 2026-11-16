/* ── Zone severity thresholds (configurable in System Config) ───────── */
// Lives here, not in index.tsx, so the page file only exports components
// (React Fast Refresh).
export const ZONE_SEVERITY_THRESHOLDS = {
  critical: 5,
  warning: 2,
};
