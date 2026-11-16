/**
 * Design tokens for contexts that cannot read CSS custom properties —
 * print/PDF windows, generated HTML reports and emails.
 *
 * On screen, always use the semantic tokens in src/index.css (Tailwind
 * utilities or `var(--token)`), including inside inline SVG. Reach for this
 * file only when the output leaves the app's stylesheet.
 *
 * The paper palette is deliberately darker than the screen tokens: text sits
 * on white paper, so each feedback colour is a 700-weight ink on a 50-weight
 * wash rather than the bright on-screen value.
 */

/** A foreground ink + background wash pair, e.g. for a printed pill. */
export interface PrintTone {
  fg: string;
  bg: string;
}

/** Neutral inks and surfaces for printed documents. */
export const PRINT_NEUTRAL = {
  ink: "#111827",        // headings, primary text
  inkStrong: "#374151",  // section headings
  body: "#4b5563",       // secondary body copy
  muted: "#6b7280",      // labels, captions
  faint: "#9ca3af",      // meta, timestamps, placeholders
  rule: "#d1d5db",       // strong dividers
  ruleSubtle: "#e5e7eb", // table borders, hairlines
  fill: "#f3f4f6",       // header cells, neutral pill wash
  fillSubtle: "#f9fafb", // zebra / label column
  paper: "#ffffff",
  brand: "#ea580c",      // Accel orange, print weight
} as const;

/** Feedback tones for printed documents — mirror the on-screen roles. */
export const PRINT_TONE = {
  danger:  { fg: "#b91c1c", bg: "#fef2f2" },
  high:    { fg: "#c2410c", bg: "#fff7ed" },
  warning: { fg: "#b45309", bg: "#fffbeb" },
  success: { fg: "#15803d", bg: "#f0fdf4" },
  info:    { fg: "#1d4ed8", bg: "#eff6ff" },
  violet:  { fg: "#6d28d9", bg: "#f5f3ff" },
  neutral: { fg: PRINT_NEUTRAL.ink, bg: PRINT_NEUTRAL.fill },
} as const satisfies Record<string, PrintTone>;

/** Callout (e.g. case notes) — amber rule, wash and ink. */
export const PRINT_CALLOUT = {
  rule: "#fbbf24",
  bg: PRINT_TONE.warning.bg,
  ink: "#78350f",
} as const;

/**
 * Severity → print tone. Matches the screen mapping in index.css:
 * critical = danger, high = its own tone, medium = warning, low = info.
 */
export const PRINT_SEVERITY: Record<string, PrintTone> = {
  critical: PRINT_TONE.danger,
  high: PRINT_TONE.high,
  medium: PRINT_TONE.warning,
  low: PRINT_TONE.info,
};
