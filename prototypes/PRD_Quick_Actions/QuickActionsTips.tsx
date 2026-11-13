import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Command, Search, Settings2 } from "lucide-react";
import { useCommandPaletteStore } from "@/stores/useCommandPaletteStore";
import { Button } from "@/components/ui/button";
import { ItemButton } from "@/components/ui/item";

/* PROTOTYPE-ONLY: cheat-sheet panel so a reviewer knows what to try. */

const SAMPLES = ["lobby", "cam:armoury", "checkpoint", "case:", "hikvision"];

export function QuickActionsTips() {
  const navigate = useNavigate();
  const openPalette = useCommandPaletteStore((s) => s.openPalette);
  const setQuery = useCommandPaletteStore((s) => s.setQuery);

  return (
    <div data-slot="quick-actions-tips" className="w-64 rounded-xl border border-border bg-card p-3 shadow-floating">
      <p className="mb-2 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
        Quick Actions prototype
      </p>

      <div data-slot="quick-actions-tips-list" className="flex flex-col gap-1.5 text-sm text-muted-foreground">
        <ItemButton
          variant="plain"
          type="button"
          onClick={() => openPalette("search")}
          className="gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <Search className="size-3.5" />
          Search palette · ⌘K
        </ItemButton>
        <ItemButton
          variant="plain"
          type="button"
          onClick={() => openPalette("actions")}
          className="gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <Command className="size-3.5" />
          Actions palette · ⌘J
        </ItemButton>
        <ItemButton
          variant="plain"
          type="button"
          onClick={() => navigate("/config")}
          className="gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <Settings2 className="size-3.5" />
          Quick Actions settings
        </ItemButton>
      </div>

      <p className="mt-2.5 mb-1.5 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
        Try a query
      </p>
      <div data-slot="quick-actions-tips-samples" className="flex flex-wrap gap-1">
        {SAMPLES.map((q) => (
          <Button
            variant="outline"
            size="xs"
            key={q}
            type="button"
            onClick={() => {
              openPalette("search");
              setQuery(q);
            }}
            className="h-auto rounded-md border border-border bg-transparent px-1.5 py-0.5 font-mono text-2xs font-normal hover:bg-transparent dark:bg-transparent dark:hover:bg-transparent text-muted-foreground hover:border-primary hover:text-primary-ink"
          >
            {q}
          </Button>
        ))}
      </div>
    </div>
  );
}
