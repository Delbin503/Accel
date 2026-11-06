import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface ChoiceOption<T extends string> {
  value: T;
  label: string;
  /** Second line under the label, e.g. a reason's explanation. */
  description?: string;
  /** Short mono text on the right, e.g. a user ID. */
  hint?: string;
}

/**
 * Select-style field that opens a single-choice list. No radio circles — the
 * chosen option is highlighted with an orange label. Built on the dropdown's
 * radio group, so keyboard and screen-reader behaviour stay a radio group.
 *
 * @example
 *   <ChoiceDropdown value={reason} onChange={setReason} options={REASONS} />
 */
export function ChoiceDropdown<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: T;
  options: ChoiceOption<T>[];
  onChange: (value: T) => void;
  ariaLabel?: string;
}) {
  const picked = options.find((o) => o.value === value) ?? options[0];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={ariaLabel}
          className="flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 text-left text-base text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[state=open]:border-ring dark:bg-input/30"
        >
          <span className="truncate">{picked?.label}</span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-(--radix-dropdown-menu-trigger-width)">
        <DropdownMenuRadioGroup value={value} onValueChange={(v) => onChange(v as T)}>
          {options.map((o) => (
            <DropdownMenuRadioItem
              key={o.value}
              value={o.value}
              // Hide the menu's built-in dot and its left gutter; the pick is highlighted instead.
              className="group/choice py-2 pl-2 data-[state=checked]:bg-accent [&>span:first-child]:hidden"
            >
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-sm text-foreground group-data-[state=checked]/choice:text-primary">
                    {o.label}
                  </span>
                  {o.hint ? <span className="shrink-0 font-mono text-2xs text-muted-foreground">{o.hint}</span> : null}
                </span>
                {o.description ? (
                  <span className="block text-2xs text-muted-foreground">{o.description}</span>
                ) : null}
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
