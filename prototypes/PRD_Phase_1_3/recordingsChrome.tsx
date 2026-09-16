import * as React from "react";
import { Check, ChevronDown, ChevronUp, Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TruncatedText } from "@/components/shared/TruncatedText";
import { cn } from "@/lib/utils";
import { CAMERA_AREAS, CAMERA_SITES, MOCK_CAMERAS } from "@/mocks/cameras";
import { RECORDING_TYPES } from "./recordingTypes";
import type { RecordingFilters } from "./recordingFilters";

/* Search and filter chrome, carried over from the Recordings page so the
   camera-day proposal reads as the same screen. The only change is the last
   group: "Mode" becomes "Recording type", since a day now holds several. */

interface FilterOption {
  value: string;
  label: string;
}

function FilterDropdown({ label, options, selected, onChange }: {
  label: string; options: readonly FilterOption[]; selected: string[]; onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const hasValue = selected.length > 0;
  const displayLabel = hasValue
    ? selected.length === 1
      ? options.find((o) => o.value === selected[0])?.label ?? label
      : `${selected.length} selected`
    : label;

  function toggle(value: string) {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className={cn(
          "flex w-full items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2 text-base transition-colors hover:border-primary",
          open ? "border-primary" : "border-border",
          hasValue ? "text-primary" : "text-muted-foreground"
        )}>
          <TruncatedText text={displayLabel} className="font-medium" />
          <ChevronDown className={cn("size-3.5 flex-shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="max-h-[260px] w-56 overflow-y-auto p-1.5">
        {options.map((opt) => {
          const checked = selected.includes(opt.value);
          return (
            <button key={opt.value} onClick={() => toggle(opt.value)}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-base text-muted-foreground hover:bg-muted hover:text-foreground">
              <div className={cn("flex size-3.5 flex-shrink-0 items-center justify-center rounded border transition-colors",
                checked ? "border-primary bg-primary" : "border-muted-foreground/40")}>
                {checked && <Check className="size-2.5 text-primary-foreground" strokeWidth={3} />}
              </div>
              {opt.label}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

export function FilterPanel({ filters, onChange, search, onSearchChange, additionalActiveCount = 0 }: {
  filters: RecordingFilters;
  onChange: (f: RecordingFilters) => void;
  search: string;
  onSearchChange: (v: string) => void;
  additionalActiveCount?: number;
}) {
  const [open, setOpen] = React.useState(false);
  const filterCount = Object.values(filters).reduce((s, arr) => s + arr.length, 0);
  const activeCount = filterCount + (search ? 1 : 0) + additionalActiveCount;

  function setGroup(group: keyof RecordingFilters, values: string[]) {
    onChange({ ...filters, [group]: values });
  }

  const CAMERA_OPTS = MOCK_CAMERAS.map((c) => ({ value: c.id, label: `${c.id} · ${c.name}` }));
  const TYPE_OPTS = RECORDING_TYPES.map((t) => ({ value: t.id, label: t.label }));

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-muted/30">
        <button type="button" onClick={() => setOpen((v) => !v)} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
          <SlidersHorizontal className="size-4 flex-shrink-0 text-muted-foreground" />
          <span className="text-base font-semibold text-foreground">Filters</span>
          {activeCount > 0 ? (
            <span className="rounded-full bg-primary px-2 py-px text-xs font-semibold text-primary-foreground">{activeCount} active</span>
          ) : (
            <div className="hidden flex-wrap gap-1.5 sm:flex">
              {["All sites", "All areas", "All cameras", "All types"].map((l) => (
                <span key={l} className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">{l}</span>
              ))}
            </div>
          )}
        </button>
        <button type="button" aria-label={open ? "Collapse filters" : "Expand filters"} onClick={() => setOpen((v) => !v)}>
          {open ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
        </button>
      </div>
      {open && (
        <div className="space-y-3 rounded-b-xl border-t border-border bg-background px-4 py-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by recording ID, camera, or area…" className="h-9 w-full pl-9 text-base" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { key: "site" as const, label: "Site", opts: CAMERA_SITES },
              { key: "area" as const, label: "Area", opts: CAMERA_AREAS },
              { key: "camera" as const, label: "Camera", opts: CAMERA_OPTS },
              { key: "type" as const, label: "Recording Type", opts: TYPE_OPTS },
            ].map(({ key, label, opts }) => (
              <div key={key}>
                <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
                <FilterDropdown label={`All ${label.toLowerCase()}s`} options={opts}
                  selected={filters[key]} onChange={(v) => setGroup(key, v)} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
