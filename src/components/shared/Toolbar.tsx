import * as React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * List-page toolbar row: a flex-wrap container for search, filters and actions.
 * Pair with ToolbarSearch and the FilterDropdown component. Push trailing
 * actions to the right with `className="ml-auto"` on the action group.
 */
const Toolbar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-wrap items-center gap-2", className)} {...props} />
  )
);
Toolbar.displayName = "Toolbar";

export interface ToolbarSearchProps
  extends Omit<React.ComponentProps<"input">, "onChange"> {
  value: string;
  onChange: (value: string) => void;
}

const ToolbarSearch = React.forwardRef<HTMLInputElement, ToolbarSearchProps>(
  ({ value, onChange, placeholder = "Search…", className, ...props }, ref) => (
    <div className={cn("relative w-full sm:w-64", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9"
        {...props}
      />
    </div>
  )
);
ToolbarSearch.displayName = "ToolbarSearch";

export { Toolbar, ToolbarSearch };
