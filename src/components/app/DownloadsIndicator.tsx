import { Download, Package } from "lucide-react";
import { Button } from "@accel/ui/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@accel/ui/components/ui/popover";
import { Progress } from "@accel/ui/components/ui/progress";
import { cn } from "@accel/ui/lib/utils";
import { formatBytes } from "@accel/ui/lib/formatters";
import { useDownloadsStore } from "@/stores/useDownloadsStore";

/* Top-bar download button. A plain download icon; while an export runs, a
   ring around it fills with the overall progress. The popover lists each
   download with its percentage. */

const R = 13;
const MB = 1024 * 1024;
/** Two decimals, matching the sizes the Recordings page shows. */
const size = (mb: number) => formatBytes(mb * MB, 2);
const CIRC = 2 * Math.PI * R;

export function DownloadsIndicator() {
  const jobs = useDownloadsStore((s) => s.jobs);
  const clearDone = useDownloadsStore((s) => s.clearDone);
  const active = jobs.filter((j) => j.status === "downloading");
  const busy = active.length > 0;
  const overall = busy ? active.reduce((s, j) => s + j.progress, 0) / active.length : 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          data-slot="downloads-indicator"
          type="button"
          aria-label={busy ? `Downloads, ${Math.round(overall)}% complete` : "Downloads"}
          className="relative flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {/* The progress ring only exists while something is downloading. */}
          {busy && (
            <svg data-slot="downloads-indicator-progress" viewBox="0 0 32 32" className="absolute inset-0 size-8 -rotate-90" aria-hidden="true">
              <circle cx="16" cy="16" r={R} fill="none" className="stroke-border" strokeWidth="2" />
              <circle
                cx="16"
                cy="16"
                r={R}
                fill="none"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray={CIRC}
                strokeDashoffset={CIRC * (1 - overall / 100)}
                className="stroke-primary transition-[stroke-dashoffset] duration-[var(--duration-fast)]"
              />
            </svg>
          )}
          <Download className={cn("size-4", busy && "size-3.5 text-primary-ink")} />
        </button>
      </PopoverTrigger>
      <PopoverContent data-slot="downloads-indicator-content" align="end" className="w-80 p-0">
        <div data-slot="downloads-indicator-header" className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <p data-slot="downloads-indicator-title" className="text-sm font-semibold text-foreground">Downloads</p>
          {jobs.some((j) => j.status === "done") && (
            <Button data-slot="downloads-indicator-clear" variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground" onClick={clearDone}>
              Clear finished
            </Button>
          )}
        </div>
        {jobs.length === 0 && (
          <p data-slot="downloads-indicator-empty" className="px-4 py-6 text-center text-xs text-muted-foreground">No recordings to download yet. Export recordings and they will show here.</p>
        )}
        <ul data-slot="downloads-indicator-list" className="max-h-72 divide-y divide-border overflow-y-auto">
          {jobs.map((j) => {
            const pct = Math.round(j.progress);
            const done = j.status === "done";
            return (
              <li data-slot="downloads-indicator-item" key={j.id} className="px-4 py-3">
                <div data-slot="downloads-indicator-item-header" className="flex items-center gap-2">
                  <Package className="size-4 shrink-0 text-primary-ink" />
                  <span data-slot="downloads-indicator-item-name" className="min-w-0 flex-1 truncate font-mono text-xs font-semibold text-foreground">{j.fileName}</span>
                  <span data-slot="downloads-indicator-item-status" className={cn("shrink-0 font-mono text-xs font-semibold", done ? "text-success" : "text-foreground")}>
                    {done ? "Done" : `${pct}%`}
                  </span>
                </div>
                <Progress data-slot="downloads-indicator-item-progress" value={pct} className="mt-2 h-1.5" />
                <p data-slot="downloads-indicator-item-meta" className="mt-1.5 text-2xs text-muted-foreground">
                  {j.files.length} file{j.files.length === 1 ? "" : "s"} ·{" "}
                  {done
                    ? `${size(j.totalMb)} · saved to your downloads`
                    : `${size((j.totalMb * j.progress) / 100)} of ${size(j.totalMb)}`}
                </p>
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
