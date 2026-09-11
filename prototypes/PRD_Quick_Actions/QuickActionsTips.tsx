import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Command, Search, Settings2 } from "lucide-react";
import { useCommandPaletteStore } from "@/stores/useCommandPaletteStore";

/* PROTOTYPE-ONLY: cheat-sheet panel so a reviewer knows what to try. */

const SAMPLES = ["lobby", "cam:armoury", "checkpoint", "case:", "hikvision"];

export function QuickActionsTips() {
  const navigate = useNavigate();
  const openPalette = useCommandPaletteStore((s) => s.openPalette);
  const setQuery = useCommandPaletteStore((s) => s.setQuery);

  return (
    <div className="w-64 rounded-xl border border-border bg-card p-3 shadow-lg">
      <p className="mb-2 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
        Quick Actions prototype
      </p>

      <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
        <button
          type="button"
          onClick={() => openPalette("search")}
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-muted hover:text-foreground"
        >
          <Search className="size-3.5" />
          Search palette · ⌘K
        </button>
        <button
          type="button"
          onClick={() => openPalette("actions")}
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-muted hover:text-foreground"
        >
          <Command className="size-3.5" />
          Actions palette · ⌘J
        </button>
        <button
          type="button"
          onClick={() => navigate("/config")}
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-muted hover:text-foreground"
        >
          <Settings2 className="size-3.5" />
          Quick Actions settings
        </button>
      </div>

      <p className="mt-2.5 mb-1.5 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
        Try a query
      </p>
      <div className="flex flex-wrap gap-1">
        {SAMPLES.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => {
              openPalette("search");
              setQuery(q);
            }}
            className="rounded-md border border-border px-1.5 py-0.5 font-mono text-2xs text-muted-foreground hover:border-primary hover:text-primary"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
