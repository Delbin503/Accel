import * as React from "react";
import { Search, Zap } from "lucide-react";

import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useCommandPaletteStore } from "@/stores/useCommandPaletteStore";

/** ⌘ on Apple platforms, Ctrl everywhere else. */
function useModifierKey(): string {
  return React.useMemo(() => {
    if (typeof navigator === "undefined") return "Ctrl";
    return /mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent) ? "⌘" : "Ctrl";
  }, []);
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-sans text-2xs font-medium text-muted-foreground">
      {children}
    </kbd>
  );
}

/* ─── Search field (opens the palette; never a real input) ──────────────── */

export function GlobalSearchTrigger({ className }: { className?: string }) {
  const openPalette = useCommandPaletteStore((s) => s.openPalette);
  const mod = useModifierKey();

  return (
    <>
      {/* Full field — from md up, where there is room for it. */}
      <button
        type="button"
        onClick={() => openPalette("search")}
        aria-label="Search"
        aria-keyshortcuts="Meta+K Control+K"
        className={cn(
          "hidden h-8 w-full max-w-sm items-center gap-2 rounded-[var(--radius)] border border-border bg-card px-2.5 text-left md:flex",
          "transition-colors duration-[var(--duration-fast)] ease-standard hover:border-ring/50 hover:bg-muted",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className
        )}
      >
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <span className="flex-1 truncate text-base text-muted-foreground">
          Search cameras, cases, rules…
        </span>
        <Kbd>{mod} K</Kbd>
      </button>

      {/* Compact icon — below md the header has no room for a field. */}
      <button
        type="button"
        onClick={() => openPalette("search")}
        aria-label="Search"
        className={cn(
          "flex size-8 items-center justify-center rounded-[var(--radius)] text-muted-foreground md:hidden",
          "transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-muted hover:text-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        )}
      >
        <Search className="size-4" />
      </button>
    </>
  );
}

/* ─── Quick Actions (same palette, actions face) ────────────────────────── */

export function QuickActionsTrigger({ className }: { className?: string }) {
  const openPalette = useCommandPaletteStore((s) => s.openPalette);
  const mod = useModifierKey();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={() => openPalette("actions")}
          aria-label="Quick actions"
          aria-keyshortcuts="Meta+J Control+J"
          className={cn(
            "flex size-8 items-center justify-center rounded-[var(--radius)] text-muted-foreground",
            "transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-muted hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            className
          )}
        >
          <Zap className="size-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="flex items-center gap-1.5">
        Quick actions
        <Kbd>{mod} J</Kbd>
      </TooltipContent>
    </Tooltip>
  );
}
