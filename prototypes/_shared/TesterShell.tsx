import * as React from "react";
import { FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────────────
   PROTOTYPE-ONLY. Shared chrome for every prototype's State Tester:
   a bottom-left toggle that shows/hides the tester panel.

   The preference is stored per-origin, and every prototype is served from the
   same origin, so hiding it in one module keeps it hidden in all of them —
   handy when screenshotting or demoing.

   Must NOT be promoted to src/ — see each prototype's README.
   ────────────────────────────────────────────────────────────────────────── */

const STORAGE_KEY = "accel-proto-state-tester";

/** Visible unless explicitly hidden, so the default matches the old behaviour. */
function readStored(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== "hidden";
  } catch {
    // Private mode / blocked storage — fall back to visible.
    return true;
  }
}

export function TesterShell({
  children,
  position = "top-2 right-16",
}: {
  children: React.ReactNode;
  /** Where the tester panel sits. Auth prototypes have no app header, so they pass "top-6 right-6". */
  position?: string;
}) {
  const [visible, setVisible] = React.useState(readStored);

  React.useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, visible ? "shown" : "hidden");
    } catch {
      // Ignore — the toggle still works for this session.
    }
  }, [visible]);

  return (
    <>
      {visible && (
        <div
          className={cn(
            "fixed z-[var(--z-tooltip)] opacity-30 transition-opacity duration-[var(--duration-normal)] ease-standard hover:opacity-100",
            position
          )}
        >
          {children}
        </div>
      )}

      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-pressed={visible}
        aria-label={visible ? "Hide the state tester" : "Show the state tester"}
        title={visible ? "Hide the state tester" : "Show the state tester"}
        className={cn(
          "fixed bottom-3 left-3 z-[var(--z-tooltip)] flex size-8 items-center justify-center rounded-full border shadow-lg",
          "transition-[color,background-color,border-color,opacity] duration-[var(--duration-normal)] ease-standard",
          visible
            ? "border-warning/50 bg-warning/15 text-warning hover:bg-warning/25"
            : "border-border bg-card text-muted-foreground opacity-40 hover:opacity-100 hover:text-foreground"
        )}
      >
        <FlaskConical className="size-4" />
      </button>
    </>
  );
}
