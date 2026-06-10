import * as React from "react";
import { Calendar } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface DateRangePreset {
  /** Stable identifier the parent uses to drive its filter state. */
  key: string;
  /** Pill label shown to the user. */
  label: string;
}

/* Pill style — single source of truth for the date filter look. */
const PILL_BASE =
  "rounded-full border px-3 py-1 text-sm font-semibold transition-colors";
const PILL_ACTIVE = "border-primary bg-primary/10 text-primary";
const PILL_INACTIVE =
  "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground";

export interface DateRangeBarProps {
  /** Preset pills to render (e.g. Today / Yesterday / This Week / This Month). */
  presets: DateRangePreset[];
  /** Currently active preset key. Compared against `presets[].key` and `customKey`. */
  active: string;
  /** Called when the user picks a preset. */
  onSelect: (key: string) => void;

  /** Render the "Custom" popover trigger. Default `true`. */
  showCustom?: boolean;
  /** Key that means "custom" — defaults to `"custom"`. */
  customKey?: string;
  /** Label for the custom pill. Default `"Custom Date"`. */
  customLabel?: string;
  /** Controlled from-date for the custom popover (ISO `YYYY-MM-DD`). */
  customFrom?: string;
  /** Controlled to-date for the custom popover. */
  customTo?: string;
  /** Fired whenever the user edits either custom input. */
  onCustomChange?: (from: string, to: string) => void;
  /** Fired when the user presses Apply inside the custom popover. */
  onCustomApply?: (from: string, to: string) => void;
  /** Fired when the user presses Reset inside the custom popover. */
  onCustomReset?: () => void;

  /** Optional content rendered on the right (e.g. "Showing Today · 5 events"). */
  showingLabel?: React.ReactNode;
  /** Optional Clear link rendered far right. */
  onClear?: () => void;

  /** Override the leading label. Default "Date Range". */
  label?: string;

  className?: string;
}

/**
 * Canonical date range filter bar used across every module.
 *
 * Visual contract:
 *   - Card-like container: `rounded-xl border bg-card`
 *   - Leading uppercase "Date Range" label with calendar icon
 *   - rounded-full pills, light-orange active state
 *   - Optional Custom Date pill that opens a from/to popover
 *   - Optional "Showing X" indicator on the right
 *   - Optional Clear link
 */
export function DateRangeBar({
  presets,
  active,
  onSelect,
  showCustom = true,
  customKey = "custom",
  customLabel = "Custom Date",
  customFrom = "",
  customTo = "",
  onCustomChange,
  onCustomApply,
  onCustomReset,
  showingLabel,
  onClear,
  label = "Date Range",
  className,
}: DateRangeBarProps) {
  const [customOpen, setCustomOpen] = React.useState(false);
  const [localFrom, setLocalFrom] = React.useState(customFrom);
  const [localTo, setLocalTo] = React.useState(customTo);

  React.useEffect(() => {
    setLocalFrom(customFrom);
  }, [customFrom]);
  React.useEffect(() => {
    setLocalTo(customTo);
  }, [customTo]);

  const customActive = active === customKey;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5",
        className
      )}
    >
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Calendar className="size-3.5" />
        {label}
      </span>

      {presets.map((p) => {
        const isActive = active === p.key;
        return (
          <button
            key={p.key}
            type="button"
            onClick={() => onSelect(p.key)}
            className={cn(PILL_BASE, isActive ? PILL_ACTIVE : PILL_INACTIVE)}
          >
            {p.label}
          </button>
        );
      })}

      {showCustom && (
        <Popover open={customOpen} onOpenChange={setCustomOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                "inline-flex items-center gap-1.5",
                PILL_BASE,
                customActive ? PILL_ACTIVE : PILL_INACTIVE
              )}
            >
              <Calendar className="size-3" />
              {customLabel}
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-72 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Custom range
            </p>
            <div className="space-y-2">
              <div>
                <label className="mb-1 block text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                  From
                </label>
                <input
                  type="date"
                  value={localFrom}
                  max={localTo || undefined}
                  onChange={(e) => {
                    setLocalFrom(e.target.value);
                    onCustomChange?.(e.target.value, localTo);
                  }}
                  className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm text-foreground"
                />
              </div>
              <div>
                <label className="mb-1 block text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                  To
                </label>
                <input
                  type="date"
                  value={localTo}
                  min={localFrom || undefined}
                  onChange={(e) => {
                    setLocalTo(e.target.value);
                    onCustomChange?.(localFrom, e.target.value);
                  }}
                  className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm text-foreground"
                />
              </div>
              <div className="flex justify-end gap-1.5 pt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setLocalFrom("");
                    setLocalTo("");
                    onCustomReset?.();
                    setCustomOpen(false);
                  }}
                >
                  Reset
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    onCustomApply?.(localFrom, localTo);
                    onSelect(customKey);
                    setCustomOpen(false);
                  }}
                >
                  Apply
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}

      {showingLabel && (
        <span className="ml-auto text-xs text-muted-foreground">
          {showingLabel}
        </span>
      )}
      {onClear && (
        <button
          type="button"
          onClick={onClear}
          className={cn(
            "text-xs text-muted-foreground underline-offset-2 hover:text-primary hover:underline",
            !showingLabel && "ml-auto"
          )}
        >
          Clear
        </button>
      )}
    </div>
  );
}
