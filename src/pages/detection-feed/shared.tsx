import * as React from "react";
import { cn } from "@/lib/utils";
import type { Severity } from "@/types/detection";

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
          className="cursor-pointer rounded border border-border bg-muted px-1 py-0.5 font-mono text-[11px] font-medium text-primary hover:border-primary"
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

const SEV_STYLES: Record<
  Severity,
  { badge: string; dot: string; label: string }
> = {
  critical: {
    badge: "bg-sev-critical/15 border-sev-critical/30 text-sev-critical",
    dot: "bg-sev-critical",
    label: "Critical",
  },
  medium: {
    badge: "bg-sev-medium/15 border-sev-medium/30 text-sev-medium",
    dot: "bg-sev-medium",
    label: "Medium",
  },
  low: {
    badge: "bg-sev-low/15 border-sev-low/30 text-sev-low",
    dot: "bg-sev-low",
    label: "Low",
  },
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  const s = SEV_STYLES[severity];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        s.badge
      )}
    >
      <span className={cn("size-1.5 flex-shrink-0 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}

/* ── Severity left-border class ──────────────────────────────────────────── */

export const SEVERITY_BORDER: Record<Severity, string> = {
  critical: "border-l-sev-critical",
  medium: "border-l-sev-medium",
  low: "border-l-sev-low",
};
