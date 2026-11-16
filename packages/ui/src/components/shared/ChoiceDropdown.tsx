import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

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
  disabled,
  className,
}: {
  value: T;
  options: ChoiceOption<T>[];
  onChange: (value: T) => void;
  ariaLabel?: string;
  disabled?: boolean;
  className?: string;
}) {
  const picked = options.find((o) => o.value === value) ?? options[0];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          data-slot="choice-dropdown"
          type="button"
          aria-label={ariaLabel}
          disabled={disabled}
          className={cn("flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 text-left text-base text-foreground shadow-raised outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-[state=open]:border-ring dark:bg-input/30", className)}
        >
          <span data-slot="choice-dropdown-value" className="truncate">{picked?.label}</span>
          <ChevronDown data-slot="choice-dropdown-icon" className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent data-slot="choice-dropdown-content" align="start" className="w-(--radix-dropdown-menu-trigger-width)">
        <DropdownMenuRadioGroup value={value} onValueChange={(v) => onChange(v as T)}>
          {options.map((o) => (
            <DropdownMenuRadioItem
              data-slot="choice-dropdown-item"
              key={o.value}
              value={o.value}
              // Hide the menu's built-in dot and its left gutter; the pick is highlighted instead.
              className="group/choice py-2 pl-2 data-[state=checked]:bg-accent [&>span:first-child]:hidden"
            >
              <span data-slot="choice-dropdown-item-body" className="min-w-0 flex-1">
                <span data-slot="choice-dropdown-item-header" className="flex items-baseline justify-between gap-3">
                  <span data-slot="choice-dropdown-item-label" className="truncate text-sm text-foreground group-data-[state=checked]/choice:text-primary-ink">
                    {o.label}
                  </span>
                  {o.hint ? <span data-slot="choice-dropdown-item-hint" className="shrink-0 font-mono text-2xs text-muted-foreground">{o.hint}</span> : null}
                </span>
                {o.description ? (
                  <span data-slot="choice-dropdown-item-description" className="block text-2xs text-muted-foreground">{o.description}</span>
                ) : null}
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
