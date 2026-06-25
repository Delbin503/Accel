import * as React from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { DEPARTMENTS } from "@/mocks/departments";

export interface DepartmentSelectProps {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function DepartmentSelect({
  value,
  onChange,
  placeholder = "Select departments",
  className,
}: DepartmentSelectProps) {
  const [open, setOpen] = React.useState(false);

  function toggle(dept: string) {
    onChange(value.includes(dept) ? value.filter((d) => d !== dept) : [...value, dept]);
  }

  function remove(dept: string) {
    onChange(value.filter((d) => d !== dept));
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex min-h-9 w-full items-center justify-between gap-2 rounded-md border bg-background px-2.5 py-1.5 text-left text-base transition-colors hover:border-primary",
            open ? "border-primary" : "border-input",
            className
          )}
        >
          {value.length === 0 ? (
            <span className="px-0.5 text-muted-foreground">{placeholder}</span>
          ) : (
            <span className="flex flex-wrap gap-1">
              {value.map((dept) => (
                <span
                  key={dept}
                  className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary"
                >
                  {dept}
                  <span
                    role="button"
                    tabIndex={-1}
                    onClick={(e) => {
                      e.stopPropagation();
                      remove(dept);
                    }}
                    className="flex items-center justify-center rounded-full hover:bg-primary/20"
                  >
                    <X className="size-3" />
                  </span>
                </span>
              ))}
            </span>
          )}
          <ChevronDown
            className={cn(
              "size-3.5 flex-shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180"
            )}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[--radix-popover-trigger-width] p-1.5">
        <div className="max-h-56 overflow-y-auto">
          {DEPARTMENTS.map((dept) => {
            const checked = value.includes(dept);
            return (
              <button
                key={dept}
                type="button"
                onClick={() => toggle(dept)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-base text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <span
                  className={cn(
                    "flex size-3.5 flex-shrink-0 items-center justify-center rounded-sm border transition-colors",
                    checked ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"
                  )}
                >
                  {checked && <Check className="size-2.5" strokeWidth={3} />}
                </span>
                {dept}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
