import * as React from "react";
import { Eye, EyeOff, Search } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

/**
 * Building blocks for long form modals (Camera, NVR) in the 2026 modal style:
 * fields grouped under plain headings instead of boxes, paired fields side by
 * side, option chips instead of radio cards, and single checklists with one
 * row per item.
 *
 * @example
 *   <ModalFormSection title="Connection">
 *     <ModalFieldPair>
 *       <ModalField label="IP Address" error={errors.ip}>
 *         <ModalTextInput value={ip} onChange={setIp} mono />
 *       </ModalField>
 *       <ModalField label="Password"><ModalPasswordInput value={pw} onChange={setPw} /></ModalField>
 *     </ModalFieldPair>
 *   </ModalFormSection>
 */

/** One short sentence at the top of a modal body; wrap the item in <strong>. */
export const MODAL_NOTE = "text-sm leading-relaxed text-muted-foreground [&_strong]:font-semibold [&_strong]:text-foreground";

const LABEL = "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground";

/** A plain heading over a group of fields. */
export function ModalFormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground/80">{title}</p>
      {children}
    </section>
  );
}

/** Label, control, then an error (red) or a hint (muted) under it. */
export function ModalField({ label, error, hint, className, children }: {
  label: string;
  error?: string;
  hint?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className={LABEL}>{label}</label>
      {children}
      {error ? (
        <p className="mt-1 text-xs text-sev-critical">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

/** Two fields side by side. */
export function ModalFieldPair({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>;
}

export function ModalTextInput({ value, onChange, placeholder, mono, type, invalid, disabled }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
  type?: string;
  invalid?: boolean;
  disabled?: boolean;
}) {
  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      type={type}
      disabled={disabled}
      aria-invalid={invalid || undefined}
      className={cn("h-9 text-base", mono && "font-mono")}
    />
  );
}

export function ModalPasswordInput({ value, onChange, invalid }: {
  value: string;
  onChange: (v: string) => void;
  invalid?: boolean;
}) {
  const [show, setShow] = React.useState(false);
  return (
    <div className="relative">
      <Input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="••••••••"
        autoComplete="new-password"
        aria-invalid={invalid || undefined}
        className="h-9 pr-9 font-mono text-base"
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

/** Select with a placeholder; an empty value shows the placeholder. */
export function ModalSelect({ value, onChange, placeholder, options, invalid, disabled, ariaLabel }: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: readonly { value: string; label: string }[];
  invalid?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  return (
    <Select value={value || undefined} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="h-9 w-full text-base" aria-invalid={invalid || undefined} aria-label={ariaLabel}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent position="popper" className="max-h-72">
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Row of same-size option chips — for short single or multi choices. */
export function OptionChips<T extends string | number>({ value, options, onChange, multi }: {
  value: T | T[];
  options: readonly { value: T; label: string }[];
  onChange: (v: T) => void;
  multi?: boolean;
}) {
  const isOn = (v: T) => (multi ? (value as T[]).includes(v) : value === v);
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          aria-pressed={isOn(o.value)}
          onClick={() => onChange(o.value)}
          className={cn(
            "h-8 min-w-12 rounded-md border px-3 text-sm transition-colors duration-[var(--duration-fast)] ease-standard",
            isOn(o.value)
              ? "border-primary bg-primary/10 text-primary"
              : "border-input text-muted-foreground hover:border-ring hover:text-foreground"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** One checklist row: checkbox, a title and a meta line, something on the right. */
export function CheckRow({ checked, disabled, onToggle, title, meta, aside, label }: {
  checked: boolean;
  disabled?: boolean;
  onToggle: () => void;
  title: React.ReactNode;
  meta?: React.ReactNode;
  aside?: React.ReactNode;
  /** Accessible name for the checkbox. */
  label: string;
}) {
  return (
    <li>
      <label
        className={cn(
          "flex items-start gap-3 px-3 py-2.5 transition-colors duration-[var(--duration-fast)] ease-standard",
          disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
          checked ? "bg-accent" : !disabled && "hover:bg-muted/40"
        )}
      >
        <Checkbox checked={checked} disabled={disabled} onCheckedChange={() => onToggle()} aria-label={label} className="mt-0.5" />
        <span className="min-w-0 flex-1">
          <span className={cn("block truncate text-sm font-medium", checked ? "text-primary" : "text-foreground")}>{title}</span>
          {meta ? <span className="mt-0.5 block truncate font-mono text-2xs text-muted-foreground">{meta}</span> : null}
        </span>
        {aside ? <span className="shrink-0 self-center">{aside}</span> : null}
      </label>
    </li>
  );
}

/** Bordered list of CheckRows that scrolls. `empty` replaces the list when given. */
export function CheckList({ head, children, empty }: {
  /** Optional row above the list, e.g. Select all. */
  head?: React.ReactNode;
  children: React.ReactNode;
  empty?: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      {head}
      {empty ?? <ul className="max-h-56 divide-y divide-border/60 overflow-y-auto">{children}</ul>}
    </div>
  );
}

/** "Select all" head row for a CheckList. */
export function CheckListSelectAll({ checked, onToggle, count, disabled }: {
  checked: boolean;
  onToggle: () => void;
  /** Shown on the right, e.g. "2 of 5". */
  count: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 border-b border-border px-3 py-2.5">
      <Checkbox checked={checked} disabled={disabled} onCheckedChange={() => onToggle()} aria-label="Select all" />
      <span className="text-sm font-medium text-foreground">Select all</span>
      <span className="ml-auto text-xs text-muted-foreground">{count}</span>
    </label>
  );
}

export function ModalSearchInput({ value, onChange, placeholder }: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-9 pl-9 text-base" />
    </div>
  );
}

/** Centered muted line for an empty CheckList. */
export function CheckListEmpty({ children }: { children: React.ReactNode }) {
  return <p className="px-4 py-8 text-center text-sm text-muted-foreground">{children}</p>;
}
