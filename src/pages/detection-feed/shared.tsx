import * as React from "react";
import type { Severity } from "@/types/detection";
import { StatusBadge } from "@/components/shared/StatusBadge";

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
          className="cursor-pointer rounded border border-border bg-muted px-1 py-0.5 font-mono text-xs font-medium text-primary hover:border-primary"
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
        <span key={i} className="font-semibold text-sev-medium">
          {part.slice(2, -2)}
        </span>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

/* ── Severity badge ──────────────────────────────────────────────────────── */

const SEV_LABEL: Record<Severity, string> = {
  critical: "Critical",
  medium: "Medium",
  low: "Low",
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  return <StatusBadge tone={severity}>{SEV_LABEL[severity]}</StatusBadge>;
}

/* ── Severity left-border class ──────────────────────────────────────────── */

export const SEVERITY_BORDER: Record<Severity, string> = {
  critical: "border-l-sev-critical",
  medium: "border-l-sev-medium",
  low: "border-l-sev-low",
};
