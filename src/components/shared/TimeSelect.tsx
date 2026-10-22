import * as React from "react";
import { Check, Clock } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatTimeOfDay } from "@/lib/formatters";

/**
 * Time picker — hour / minute / meridiem wheels.
 *
 * Replaces `<input type="time">`, which renders the browser's native picker —
 * a light-themed, OS-styled panel that looked nothing like every other
 * dropdown in this dark console. Same value format as the native input
 * ("HH:mm", 24-hour) so callers and validation are unchanged.
 *
 * It was a single Select of every quarter hour, which is 96 rows: picking
 * 9:45 PM meant scrolling past most of the day, and the hour and the minute
 * could not be chosen independently. Splitting it into columns keeps each part
 * one short scroll away, and changing the hour no longer disturbs the minutes.
 * Edits are held in a draft until OK, so Cancel leaves the field untouched.
 *
 * Minutes run 00–59 like the hour column. Quarter hours only were a leftover
 * from the flat list, where every extra step multiplied the whole day's rows;
 * in a column of its own, all 60 cost nothing.
 */

const STEP_MINUTES = 1;

type Meridiem = "AM" | "PM";

interface TimeParts {
  /** 1–12. */
  hour12: number;
  minute: number;
  meridiem: Meridiem;
}

const pad = (n: number) => String(n).padStart(2, "0");
const HOURS = Array.from({ length: 12 }, (_, i) => (i === 0 ? 12 : i));
const MERIDIEMS: Meridiem[] = ["AM", "PM"];

/** "18:30" → parts. Unparseable or empty falls back to 12:00 AM. */
function parseParts(value: string): TimeParts {
  const [h, m] = value.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return { hour12: 12, minute: 0, meridiem: "AM" };
  const hour24 = Math.min(23, Math.max(0, h));
  return {
    hour12: hour24 % 12 === 0 ? 12 : hour24 % 12,
    minute: Math.min(59, Math.max(0, m)),
    meridiem: hour24 >= 12 ? "PM" : "AM",
  };
}

/** Parts → canonical 24-hour "HH:mm". */
function serializeParts({ hour12, minute, meridiem }: TimeParts): string {
  const base = hour12 % 12;
  return `${pad(meridiem === "PM" ? base + 12 : base)}:${pad(minute)}`;
}

function buildMinutes(step: number, current: number) {
  const out: number[] = [];
  for (let m = 0; m < 60; m += step) out.push(m);
  // A stored value off the step grid (e.g. "08:05" from seed data) still needs
  // an option to select, or its minute could not be kept.
  if (!out.includes(current)) {
    out.push(current);
    out.sort((a, b) => a - b);
  }
  return out;
}

/* ── One wheel ───────────────────────────────────────────────────────────── */

function Column<T extends string | number>({
  label,
  options,
  value,
  onSelect,
  format = String,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onSelect: (v: T) => void;
  format?: (v: T) => string;
}) {
  const listRef = React.useRef<HTMLDivElement>(null);

  /* Open on the current value rather than at midnight. Mount only — re-centring
     on every pick would fight the user's own scrolling. */
  React.useEffect(() => {
    listRef.current?.querySelector<HTMLElement>("[data-active='true']")?.scrollIntoView({ block: "center" });
  }, []);

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="mb-1 px-1 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div
        ref={listRef}
        role="listbox"
        aria-label={label}
        className="h-44 overflow-y-auto rounded-md border border-border bg-background p-1"
      >
        {options.map((o) => {
          const active = o === value;
          return (
            <button
              key={String(o)}
              type="button"
              role="option"
              aria-selected={active}
              data-active={active}
              onClick={() => onSelect(o)}
              className={cn(
                "flex w-full items-center justify-between gap-1 rounded px-2 py-1 text-base tabular-nums transition-colors duration-[var(--duration-fast)] ease-standard",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active ? "bg-primary/15 font-semibold text-primary" : "text-foreground hover:bg-muted"
              )}
            >
              {format(o)}
              {active && <Check className="size-3 shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Picker ──────────────────────────────────────────────────────────────── */

export interface TimeSelectProps {
  /** "HH:mm", 24-hour. Empty string shows the placeholder. */
  value: string;
  onChange: (value: string) => void;
  /** Minute granularity — defaults to 1. Raise it to offer a coarser grid. */
  step?: number;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
  "aria-label"?: string;
}

export function TimeSelect({
  value,
  onChange,
  step = STEP_MINUTES,
  placeholder = "Select time",
  disabled,
  invalid,
  className,
  "aria-label": ariaLabel,
}: TimeSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<TimeParts>(() => parseParts(value));

  /* Seed the draft as the panel opens, so it always reflects the committed
     value — including after a Cancel. */
  function onOpenChange(next: boolean) {
    if (next) setDraft(parseParts(value));
    setOpen(next);
  }

  const minutes = React.useMemo(() => buildMinutes(step, draft.minute), [step, draft.minute]);
  const set = (patch: Partial<TimeParts>) => setDraft((d) => ({ ...d, ...patch }));

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-label={ariaLabel}
          aria-invalid={invalid || undefined}
          className={cn(
            "flex h-9 w-full items-center gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-base whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none",
            "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
            "disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30 dark:hover:bg-input/50",
            invalid && "border-sev-critical",
            className
          )}
        >
          <Clock className="size-4 shrink-0 text-muted-foreground" />
          <span
            className={cn(
              "min-w-0 flex-1 truncate text-left tabular-nums",
              !value && "text-muted-foreground"
            )}
          >
            {value ? formatTimeOfDay(value) : placeholder}
          </span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        /* Modal level, not dropdown: these fields sit inside the Create Site
           and Add Camera dialogs, and --z-dropdown renders behind them. */
        className="z-[var(--z-modal)] w-auto min-w-60 p-3"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex gap-2">
          <Column label="Hour" options={HOURS} value={draft.hour12} onSelect={(h) => set({ hour12: h })} format={pad} />
          <Column label="Min" options={minutes} value={draft.minute} onSelect={(m) => set({ minute: m })} format={pad} />
          <Column label="AM/PM" options={MERIDIEMS} value={draft.meridiem} onSelect={(m) => set({ meridiem: m })} />
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
          <span className="text-sm tabular-nums text-muted-foreground">
            {formatTimeOfDay(serializeParts(draft))}
          </span>
          <div className="flex gap-1.5">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                onChange(serializeParts(draft));
                setOpen(false);
              }}
            >
              OK
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
