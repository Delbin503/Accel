import * as React from "react";
import { ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@/components/shared/Modal";
import { TimeSelect } from "@/components/shared/TimeSelect";
import { cn } from "@/lib/utils";
import { TIMEZONES } from "@/lib/timezones";
import { AREA_PALETTE } from "@/mocks/sites";
import { ASSIGNEES } from "@/mocks/incidentCases";
import { useIncidentCasesStore } from "@/stores/useIncidentCasesStore";
import { SeverityBadge } from "@/pages/detection-feed/shared";
import type { DetectionEvent, Severity } from "@/types/detection";
import type { CaseAssignee } from "@/types/incidents";
import type { AreaShape, SiteData } from "@/types/sites";

/**
 * Gallery-only copies of form modals in the new confirm style: 550px, neutral
 * title, no description, one short sentence where it helps, plain field labels,
 * no Cancel (✕ / Esc close), one footer action with no icon. Pickers are
 * dropdowns without radio circles — the chosen option is highlighted. The
 * pages still render their own versions.
 */

const NOTE = "text-sm leading-relaxed text-muted-foreground";
const HI = "font-semibold text-foreground";
const FIELD_LABEL = "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground";

function FormFrame({ title, onClose, footerStart, action, children }: {
  title: string;
  onClose: () => void;
  footerStart?: React.ReactNode;
  action: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Modal open onOpenChange={(v) => !v && onClose()}>
      <ModalContent size="sm" className="w-[550px]">
        <ModalHeader title={title} description={null} />
        <ModalBody className="space-y-4">{children}</ModalBody>
        <ModalFooter align={footerStart ? "between" : "end"}>
          {footerStart ? <span className="text-xs text-muted-foreground">{footerStart}</span> : null}
          {action}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/** Select-style field that opens a list; the chosen row is highlighted, no radio circles. */
function ChoiceDropdown<T extends string>({ value, options, onChange }: {
  value: T;
  options: { value: T; label: string; hint?: string }[];
  onChange: (v: T) => void;
}) {
  const picked = options.find((o) => o.value === value) ?? options[0];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 text-left text-base text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[state=open]:border-ring dark:bg-input/30"
        >
          <span className="truncate">{picked.label}</span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-(--radix-dropdown-menu-trigger-width)">
        <DropdownMenuRadioGroup value={value} onValueChange={(v) => onChange(v as T)}>
          {options.map((o) => (
            <DropdownMenuRadioItem
              key={o.value}
              value={o.value}
              className="group/choice py-2 pl-2 data-[state=checked]:bg-accent [&>span:first-child]:hidden"
            >
              <span className="flex min-w-0 flex-1 items-baseline justify-between gap-3">
                <span className="truncate text-sm text-foreground group-data-[state=checked]/choice:text-primary">
                  {o.label}
                </span>
                {o.hint ? <span className="shrink-0 font-mono text-2xs text-muted-foreground">{o.hint}</span> : null}
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ── Monitor · Detection Feed — escalate ───────────────────────────────── */

const SLA_BY_SEVERITY: Record<Severity, { acknowledge: string; action: string; resolution: string }> = {
  critical: { acknowledge: "15 min", action: "1 hour", resolution: "4 hours" },
  medium: { acknowledge: "1 hour", action: "4 hours", resolution: "24 hours" },
  low: { acknowledge: "4 hours", action: "12 hours", resolution: "72 hours" },
};

const SEV_SELECTED: Record<Severity, string> = {
  critical: "border-sev-critical bg-sev-critical-soft text-sev-critical",
  medium: "border-sev-medium bg-sev-medium-soft text-sev-medium",
  low: "border-sev-low bg-sev-low-soft text-sev-low",
};

export function EscalateCopy({ event, bulkCount, onClose }: {
  event: DetectionEvent | null;
  bulkCount?: number;
  onClose: () => void;
}) {
  const isBulk = (bulkCount ?? 0) > 1;
  const [severity, setSeverity] = React.useState<Severity>(event?.severity ?? "medium");
  const [title, setTitle] = React.useState(
    event ? `${event.typeLabel} — ${event.siteDisplay} ${event.camera}` : `Bulk escalation — ${bulkCount} selected events`
  );
  const [assigneeId, setAssigneeId] = React.useState<string>(ASSIGNEES[0].id);
  const [notes, setNotes] = React.useState("");
  const sla = SLA_BY_SEVERITY[severity];

  return (
    <FormFrame
      title="Escalate to Incident Case"
      onClose={onClose}
      action={<Button size="sm" disabled={!title.trim()} onClick={onClose}>Create Case</Button>}
    >
      <p className={NOTE}>
        {isBulk ? (
          <>Create one case from <span className={HI}>{bulkCount} selected events</span>; they&apos;ll all be linked to it.</>
        ) : (
          <>Create an incident case from <span className={HI}>{event?.id}</span>.</>
        )}
      </p>
      <div>
        <label className={FIELD_LABEL}>Case Title</label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-9 text-base" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={FIELD_LABEL}>Severity</label>
          <div className="flex gap-1.5">
            {(["low", "medium", "critical"] as Severity[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSeverity(s)}
                className={cn(
                  "h-9 flex-1 rounded-md border text-2xs font-bold uppercase tracking-wider transition-colors",
                  severity === s ? SEV_SELECTED[s] : "border-input text-muted-foreground hover:border-ring"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className={FIELD_LABEL}>Assign To</label>
          <ChoiceDropdown
            value={assigneeId}
            onChange={setAssigneeId}
            options={ASSIGNEES.map((a: CaseAssignee) => ({ value: a.id, label: a.name, hint: a.id }))}
          />
        </div>
      </div>
      {/* The SLA box becomes one line under the severity it follows. */}
      <p className="text-xs text-muted-foreground">
        SLA: acknowledge in <span className={HI}>{sla.acknowledge}</span> · act within{" "}
        <span className={HI}>{sla.action}</span> · resolve within <span className={HI}>{sla.resolution}</span>
      </p>
      <div>
        <label className={FIELD_LABEL}>Initial Notes</label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add context for the investigator..."
          className="min-h-[70px] w-full resize-y text-base"
        />
      </div>
    </FormFrame>
  );
}

/* ── Monitor · Detection Feed — link to an existing case ───────────────── */

const STATUS_LABEL: Record<string, string> = { open: "Open", "in-review": "In review" };

export function LinkCaseCopy({ eventIds, eventSite, eventSiteDisplay, onClose }: {
  eventIds: string[];
  eventSite: string;
  eventSiteDisplay: string;
  onClose: () => void;
}) {
  const cases = useIncidentCasesStore((s) => s.cases);
  const [picked, setPicked] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");
  const eligible = cases.filter((c) => c.site === eventSite && (c.status === "open" || c.status === "in-review"));
  const q = query.trim().toLowerCase();
  const shown = q
    ? eligible.filter((c) => [c.id, c.title, c.assignedTo.name].some((v) => v.toLowerCase().includes(q)))
    : eligible;

  return (
    <FormFrame
      title="Link to Incident Case"
      onClose={onClose}
      action={<Button size="sm" disabled={!picked} onClick={onClose}>Link to Case</Button>}
    >
      <p className={NOTE}>
        Link <span className={HI}>{eventIds.length > 1 ? `${eventIds.length} events` : eventIds[0]}</span> to an open
        case at <span className={HI}>{eventSiteDisplay}</span>. Only cases from the same site are shown.
      </p>
      {eligible.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
          No open cases at {eventSiteDisplay}. Escalate to create one instead.
        </p>
      ) : (
        <>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by case ID, title, or owner…"
              className="h-9 pl-9 text-base"
            />
          </div>
          {shown.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No cases match &ldquo;{query}&rdquo;.</p>
          ) : (
            /* One list; each case has a checkbox. A link goes to one case, so ticking
               a case unticks any other (and ticking it again clears the pick). */
            <ul className="max-h-72 divide-y divide-border/60 overflow-y-auto rounded-lg border border-border">
              {shown.map((c) => {
                const on = picked === c.id;
                return (
                  <li key={c.id}>
                    <label
                      className={cn(
                        "flex cursor-pointer items-start gap-3 px-3 py-3 transition-colors duration-[var(--duration-fast)] ease-standard",
                        on ? "bg-accent" : "hover:bg-muted/40"
                      )}
                    >
                      <Checkbox
                        checked={on}
                        onCheckedChange={(v) => setPicked(v === true ? c.id : null)}
                        aria-label={`Link to ${c.id}`}
                        className="mt-0.5"
                      />
                      <span className="min-w-0 flex-1 space-y-1">
                        <span className="flex items-center justify-between gap-3">
                          <span className={cn("truncate text-sm font-medium", on ? "text-primary" : "text-foreground")}>
                            {c.title}
                          </span>
                          <SeverityBadge severity={c.severity} />
                        </span>
                        <span className="block font-mono text-2xs text-muted-foreground">
                          {c.id} · {STATUS_LABEL[c.status] ?? c.status} · {c.assignedTo.name} · {c.incidentIds.length}{" "}
                          incident{c.incidentIds.length === 1 ? "" : "s"}
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </FormFrame>
  );
}

/* ── Site · Overview — edit site ───────────────────────────────────────── */

const DEFAULT_OPERATING_HOURS = { from: "08:00", to: "18:00" };

export function EditSiteCopy({ site, onClose }: { site: SiteData; onClose: () => void }) {
  const [name, setName] = React.useState(site.name);
  const [address, setAddress] = React.useState(site.address);
  const [timezone, setTimezone] = React.useState(site.timezone);
  const [opFrom, setOpFrom] = React.useState(site.operatingHours?.from ?? DEFAULT_OPERATING_HOURS.from);
  const [opTo, setOpTo] = React.useState(site.operatingHours?.to ?? DEFAULT_OPERATING_HOURS.to);
  const [description, setDescription] = React.useState(site.description ?? "");
  const dirty =
    name !== site.name ||
    address !== site.address ||
    timezone !== site.timezone ||
    description !== (site.description ?? "") ||
    opFrom !== (site.operatingHours?.from ?? DEFAULT_OPERATING_HOURS.from) ||
    opTo !== (site.operatingHours?.to ?? DEFAULT_OPERATING_HOURS.to);
  const valid = name.trim() !== "" && address.trim() !== "";

  return (
    <FormFrame
      title="Edit Site"
      onClose={onClose}
      action={<Button size="sm" disabled={!dirty || !valid} onClick={onClose}>Save Changes</Button>}
    >
      <div>
        <label className={FIELD_LABEL}>Site Name</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Astra HQ" className="h-9 text-base" />
      </div>
      <div>
        <label className={FIELD_LABEL}>Address</label>
        <Input value={address} onChange={(e) => setAddress(e.target.value)} className="h-9 text-base" />
      </div>
      <div>
        <label className={FIELD_LABEL}>Timezone</label>
        <Select value={timezone} onValueChange={setTimezone}>
          <SelectTrigger className="h-9 w-full text-base">
            <SelectValue placeholder="Select timezone" />
          </SelectTrigger>
          <SelectContent position="popper" className="max-h-72">
            {TIMEZONES.map((tz) => <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className={FIELD_LABEL}>Operating Hours</label>
        <div className="flex items-center gap-2">
          <TimeSelect value={opFrom} onChange={setOpFrom} aria-label="Opening time" className="min-w-0 flex-1" />
          <span className="text-sm text-muted-foreground">to</span>
          <TimeSelect value={opTo} onChange={setOpTo} aria-label="Closing time" className="min-w-0 flex-1" />
        </div>
      </div>
      <div>
        <label className={FIELD_LABEL}>Description (Optional)</label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="A short description of this site…"
          className="w-full text-base"
        />
      </div>
    </FormFrame>
  );
}

/* ── Site · Overview — edit area ───────────────────────────────────────── */

export function EditAreaCopy({ area, onClose }: { area: AreaShape; onClose: () => void }) {
  const [name, setName] = React.useState(area.name);
  const [color, setColor] = React.useState(area.color);
  const dirty = name !== area.name || color !== area.color;

  return (
    <FormFrame
      title="Edit Area"
      onClose={onClose}
      action={<Button size="sm" disabled={!dirty || !name.trim()} onClick={onClose}>Save</Button>}
    >
      <div>
        <label className={FIELD_LABEL}>Area Name</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9 text-base" />
      </div>
      <div>
        <p className={FIELD_LABEL}>Color</p>
        <div className="flex flex-wrap gap-2">
          {AREA_PALETTE.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Color ${c}`}
              aria-pressed={color === c}
              onClick={() => setColor(c)}
              className={cn(
                "size-7 rounded-md ring-offset-2 ring-offset-background transition-shadow",
                color === c ? "ring-2 ring-foreground" : "hover:ring-2 hover:ring-foreground/30"
              )}
              // Swatch fill is the area's own colour value from the palette data.
              style={{ background: c }}
            />
          ))}
        </div>
      </div>
    </FormFrame>
  );
}
