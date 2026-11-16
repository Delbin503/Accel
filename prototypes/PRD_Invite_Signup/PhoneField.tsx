import * as React from "react";
import { ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@accel/ui/components/ui/popover";
import { Button } from "@accel/ui/components/ui/button";
import { Input } from "@accel/ui/components/ui/input";
import { ItemButton } from "@accel/ui/components/ui/item";
import { ToolbarSearch } from "@accel/ui/components/shared/Toolbar";
import { cn } from "@accel/ui/lib/utils";
import { COUNTRY_CODES } from "./phoneCodes";

/* Copied verbatim from src/pages/user-management (EditUserModal) so the invite
   setup form's phone field matches the live app exactly. Prototype-only. */

export function PhoneField({
  dialCode,
  number,
  onDialCode,
  onNumber,
}: {
  dialCode: string;
  number: string;
  onDialCode: (code: string) => void;
  onNumber: (n: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const list = COUNTRY_CODES.filter(
    (c) => !query || c.name.toLowerCase().includes(query.toLowerCase()) || c.code.includes(query)
  );

  return (
    <div data-slot="phone-field" className="flex h-9 w-full items-stretch overflow-hidden rounded-md border border-input bg-background focus-within:border-primary">
      <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) setQuery(""); }}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            type="button"
            className="h-auto flex-shrink-0 gap-1 rounded-none border-0 border-r border-input px-3 font-mono text-base font-normal text-foreground transition-colors hover:bg-muted/40 hover:text-foreground aria-expanded:bg-transparent aria-expanded:text-foreground dark:hover:bg-muted/40"
          >
            {dialCode}
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64 p-1.5">
          <ToolbarSearch
            size="sm"
            value={query}
            onChange={setQuery}
            placeholder="Search country or code"
            className="mb-1"
            inputClassName="h-8 w-full rounded-md border border-input bg-background pl-7 pr-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none shadow-none md:text-sm dark:bg-background focus-visible:border-primary focus-visible:ring-0"
          />
          <div data-slot="phone-field-country-list" className="max-h-56 overflow-y-auto">
            {list.length === 0 ? (
              <p className="px-2 py-3 text-center text-xs text-muted-foreground">No match</p>
            ) : (
              list.map((c) => (
                <ItemButton
                  variant="plain"
                  selected={c.code === dialCode}
                  key={c.code}
                  onClick={() => { onDialCode(c.code); setOpen(false); setQuery(""); }}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted/60",
                    c.code === dialCode && "bg-primary/10"
                  )}
                >
                  <span className="truncate text-foreground">{c.name}</span>
                  <span className="flex-shrink-0 font-mono text-xs text-muted-foreground">{c.code}</span>
                </ItemButton>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
      <Input
        value={number}
        onChange={(e) => onNumber(e.target.value)}
        placeholder="9123 4567"
        inputMode="tel"
        className="h-full min-w-0 flex-1 bg-transparent px-3 font-mono text-base text-foreground placeholder:text-muted-foreground focus:outline-none rounded-none border-0 py-0 shadow-none md:text-base dark:bg-transparent focus-visible:ring-0"
      />
    </div>
  );
}
