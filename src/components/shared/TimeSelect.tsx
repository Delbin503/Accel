import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatTimeOfDay } from "@/lib/formatters";

/**
 * Time picker built on the app's own Select.
 *
 * Replaces `<input type="time">`, which renders the browser's native picker —
 * a light-themed, OS-styled panel that looked nothing like every other
 * dropdown in this dark console. Same value format as the native input
 * ("HH:mm", 24-hour) so callers and validation are unchanged.
 */

const STEP_MINUTES = 15;

function buildOptions(step: number, extra?: string) {
  const out: string[] = [];
  for (let mins = 0; mins < 24 * 60; mins += step) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    out.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }
  // A stored value off the step grid (e.g. "08:05" from seed data) still needs
  // an option to select, or the trigger renders empty.
  if (extra && /^\d{2}:\d{2}$/.test(extra) && !out.includes(extra)) {
    out.push(extra);
    out.sort();
  }
  return out;
}

export interface TimeSelectProps {
  /** "HH:mm", 24-hour. Empty string shows the placeholder. */
  value: string;
  onChange: (value: string) => void;
  /** Minute granularity — defaults to 15. */
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
  const options = React.useMemo(() => buildOptions(step, value), [step, value]);

  return (
    <Select value={value || undefined} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger
        aria-label={ariaLabel}
        aria-invalid={invalid || undefined}
        className={cn("h-9 w-full text-base", invalid && "border-sev-critical", className)}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      {/* popper + max-h so 96 quarter-hour options scroll in a short list
          instead of stretching to the full viewport height. */}
      <SelectContent position="popper" className="max-h-72">
        {options.map((t) => (
          <SelectItem key={t} value={t}>
            {formatTimeOfDay(t)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
