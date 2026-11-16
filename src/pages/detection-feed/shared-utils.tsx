import * as React from "react";
import type { Severity } from "@/types/detection";

// Non-component helpers shared by the detection-feed pages. Kept apart from
// shared.tsx so that file only exports components (React Fast Refresh).

/* ── Text parser ─────────────────────────────────────────────────────────────
   Converts template strings into styled React nodes.
   [[text]] → orange monospace ref chip
   **text** → bold
   !!text!! → warning-colored anomaly text
   ──────────────────────────────────────────────────────────────────────────── */

export function parseEventText(text: string): React.ReactNode {
  const parts = text.split(/(\[\[.*?\]\]|\*\*.*?\*\*|!!.*?!!)/g);
  return parts.map((part, i) => {
    if (part.startsWith("[[") && part.endsWith("]]")) {
      return (
        <span
          key={i}
          className="cursor-pointer rounded border border-border bg-muted px-1 py-0.5 font-mono text-xs font-medium text-primary-ink hover:border-primary"
        >
          {part.slice(2, -2)}
        </span>
      );
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("!!") && part.endsWith("!!")) {
      return (
        <span data-slot="reasoning-highlight" key={i} className="font-semibold text-severity-medium">
          {part.slice(2, -2)}
        </span>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

/* ── Severity left-border class ──────────────────────────────────────────── */

export const SEVERITY_BORDER: Record<Severity, string> = {
  critical: "border-l-severity-critical",
  medium: "border-l-severity-medium",
  low: "border-l-severity-low",
};
