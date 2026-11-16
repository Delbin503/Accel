import * as React from "react";
import { Search } from "lucide-react";
import { Input } from "../ui/input";
import { cn } from "../../lib/utils";

/**
 * List-page toolbar row: a flex-wrap container for search, filters and actions.
 * Pair with ToolbarSearch and the FilterDropdown component. Push trailing
 * actions to the right with `className="ml-auto"` on the action group.
 */
const Toolbar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div data-slot="toolbar" ref={ref} className={cn("flex flex-wrap items-center gap-inline", className)} {...props} />
  )
);
Toolbar.displayName = "Toolbar";

export interface ToolbarSearchProps
  extends Omit<React.ComponentProps<"input">, "onChange" | "size"> {
  value: string;
  onChange: (value: string) => void;
  /** `sm` — compact search inside popovers and pickers (e.g. country codes). */
  size?: "default" | "sm";
  /** Classes for the input itself; `className` styles the wrapper. */
  inputClassName?: string;
}

const ToolbarSearch = React.forwardRef<HTMLInputElement, ToolbarSearchProps>(
  ({ value, onChange, placeholder = "Search…", size = "default", className, inputClassName, ...props }, ref) => (
    <div
      data-slot="toolbar-search"
      data-size={size}
      className={cn("relative w-full", size === "default" && "sm:w-64", className)}
    >
      <Search
        data-slot="toolbar-search-icon"
        className={cn(
          "pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-foreground",
          size === "sm" ? "left-2.5 size-3.5" : "left-3 size-4"
        )}
      />
      <Input
        data-slot="toolbar-search-input"
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        // A placeholder isn't a reliable accessible name; default to it unless the caller names the field.
        aria-label={props["aria-label"] ?? (props["aria-labelledby"] ? undefined : placeholder)}
        className={cn(size === "sm" ? "h-8 pl-8 text-sm" : "pl-9", inputClassName)}
        {...props}
      />
    </div>
  )
);
ToolbarSearch.displayName = "ToolbarSearch";

export { Toolbar, ToolbarSearch };
