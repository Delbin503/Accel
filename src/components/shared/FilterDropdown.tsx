import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TruncatedText } from "@/components/shared/TruncatedText";
import { cn } from "@/lib/utils";

export interface FilterOption {
  value: string;
  label: string;
  /** Optional swatch color (CSS color value) shown beside the option. */
  color?: string;
}

export interface FilterDropdownProps {
  label: string;
  options: readonly FilterOption[];
  selected: string[];
  onChange: (next: string[]) => void;
  className?: string;
}

/**
 * Canonical multi-select filter popover. Replaces the 10 inline
 * FilterDropdown copies across the list pages.
 */
function FilterDropdown({ label, options, selected, onChange, className }: FilterDropdownProps) {
  const [open, setOpen] = React.useState(false);
  const hasValue = selected.length > 0;
  const displayLabel = hasValue
    ? selected.length === 1
      ? (options.find((o) => o.value === selected[0])?.label ?? label)
      : `${selected.length} selected`
    : label;

  function toggle(value: string) {
    onChange(
      selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex w-full items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2 text-base transition-colors hover:border-primary",
            open ? "border-primary" : "border-border",
            hasValue ? "text-primary" : "text-muted-foreground",
            className
          )}
        >
          <TruncatedText text={displayLabel} className="font-medium" />
          <ChevronDown
            className={cn(
              "size-3.5 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180"
            )}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-52 p-1.5">
        {options.map((opt) => {
          const checked = selected.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggle(opt.value)}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-base text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <span
                className={cn(
                  "flex size-3.5 shrink-0 items-center justify-center rounded border transition-colors",
                  checked ? "border-primary bg-primary" : "border-muted-foreground/40"
                )}
              >
                {checked && <Check className="size-2.5 text-primary-foreground" strokeWidth={3} />}
              </span>
              {opt.color && (
                <span
                  className="size-1.5 shrink-0 rounded-full"
                  style={{ background: opt.color }}
                />
              )}
              {opt.label}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

export { FilterDropdown };
