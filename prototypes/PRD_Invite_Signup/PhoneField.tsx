import * as React from "react";
import { ChevronDown, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/* Copied verbatim from src/pages/user-management (EditUserModal) so the invite
   setup form's phone field matches the live app exactly. Prototype-only. */

export const COUNTRY_CODES: { code: string; name: string }[] = [
  { code: "+65", name: "Singapore" },
  { code: "+60", name: "Malaysia" },
  { code: "+62", name: "Indonesia" },
  { code: "+66", name: "Thailand" },
  { code: "+63", name: "Philippines" },
  { code: "+84", name: "Vietnam" },
  { code: "+91", name: "India" },
  { code: "+86", name: "China" },
  { code: "+852", name: "Hong Kong" },
  { code: "+81", name: "Japan" },
  { code: "+82", name: "South Korea" },
  { code: "+61", name: "Australia" },
  { code: "+64", name: "New Zealand" },
  { code: "+44", name: "United Kingdom" },
  { code: "+1", name: "United States" },
  { code: "+971", name: "United Arab Emirates" },
  { code: "+966", name: "Saudi Arabia" },
  { code: "+49", name: "Germany" },
  { code: "+33", name: "France" },
];

export const DEFAULT_DIAL_CODE = "+65";

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
    <div className="flex h-9 w-full items-stretch overflow-hidden rounded-md border border-input bg-background focus-within:border-primary">
      <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) setQuery(""); }}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex flex-shrink-0 items-center gap-1 border-r border-input px-3 font-mono text-base text-foreground transition-colors hover:bg-muted/40"
          >
            {dialCode}
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64 p-1.5">
          <div className="relative mb-1">
            <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search country or code"
              className="h-8 w-full rounded-md border border-input bg-background pl-7 pr-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>
          <div className="max-h-56 overflow-y-auto">
            {list.length === 0 ? (
              <p className="px-2 py-3 text-center text-xs text-muted-foreground">No match</p>
            ) : (
              list.map((c) => (
                <button
                  key={c.code}
                  onClick={() => { onDialCode(c.code); setOpen(false); setQuery(""); }}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted/60",
                    c.code === dialCode && "bg-primary/10"
                  )}
                >
                  <span className="truncate text-foreground">{c.name}</span>
                  <span className="flex-shrink-0 font-mono text-xs text-muted-foreground">{c.code}</span>
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
      <input
        value={number}
        onChange={(e) => onNumber(e.target.value)}
        placeholder="9123 4567"
        inputMode="tel"
        className="h-full min-w-0 flex-1 bg-transparent px-3 font-mono text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
      />
    </div>
  );
}
