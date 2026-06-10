import * as React from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Search,
  Trash2,
  MapPin,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  X,
  Check,
  Link2,
  CheckSquare,
  Zap,
} from "lucide-react";
import { SkeletonList, ErrorState, ListFooter, type ForcedState } from "./shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/layout/PageHeader";
import { KpiCard, KpiGrid, type KpiAccent } from "@/components/shared/KpiCard";
import { DateRangeBar } from "@/components/shared/DateRangeBar";
import { MOCK_EVENTS, DATE_GROUPS, FILTER_OPTIONS, MOCK_DISMISSED } from "@/mocks/detectionFeed";
import type { DetectionEvent } from "@/types/detection";
import type { EscalateFormData } from "@/pages/detection-feed/EscalateModal";
import { SeverityBadge, parseEventText } from "@/pages/detection-feed/shared";
import { EventDrawer } from "@/pages/detection-feed/EventDrawer";
import { EscalateModal } from "@/pages/detection-feed/EscalateModal";
import { DismissModal } from "@/pages/detection-feed/DismissModal";
import { LinkCaseModal } from "@/pages/detection-feed/LinkCaseModal";
import { useIncidentCasesStore } from "@/stores/useIncidentCasesStore";
import { TruncatedText } from "@/components/shared/TruncatedText";

/* ─── Types ──────────────────────────────────────────────────────────────── */

type DatePreset = "all" | "today" | "yesterday" | "week" | "month" | "custom";
type KpiFilter = "all" | "critical" | "medium" | "low" | "pending" | "escalated";

interface Filters {
  severity: string[];
  type: string[];
  site: string[];
  area: string[];
  model: string[];
}

const EMPTY_FILTERS: Filters = { severity: [], type: [], site: [], area: [], model: [] };

/* Area options derived from the event data (FILTER_OPTIONS has no area list). */
const AREA_OPTIONS = Array.from(
  new Map(MOCK_EVENTS.map((e) => [e.area, e.areaDisplay] as const)).entries()
)
  .map(([value, label]) => ({ value, label }))
  .sort((a, b) => a.label.localeCompare(b.label));

/* PROTOTYPE-ONLY: the real mock has ~14 events, too few to exercise Load-older / the
   150 cap. Clone the real events (keeps full card fidelity) onto the existing date
   buckets so the listing pattern is testable. Drop this when promoting to src. */
const FEED_DATA: DetectionEvent[] = (() => {
  const base = MOCK_EVENTS;
  const out: DetectionEvent[] = [...base];
  const dates = ["2026-05-19", "2026-05-18"];
  for (let i = 0; i < 200; i++) {
    const src = base[i % base.length];
    out.push({
      ...src,
      id: `${src.id}-c${i}`,
      date: dates[i % dates.length],
      status: i % 5 === 0 ? "escalated" : "pending",
    });
  }
  return out;
})();

/* ─── CCTV thumbnail with bboxes ─────────────────────────────────────────── */

function EventThumb({ event, selected }: { event: DetectionEvent; selected: boolean }) {
  return (
    <div className="relative h-[90px] w-[140px] flex-shrink-0 overflow-hidden rounded-md bg-[linear-gradient(135deg,#2a1a0e_0%,#1a1a1a_100%)]">
      <div
        className={cn(
          "absolute left-1.5 top-1.5 z-10 flex size-4 items-center justify-center rounded border border-white/80",
          selected ? "bg-primary border-primary" : "bg-black/60"
        )}
      >
        {selected && <Check className="size-2.5 text-white" strokeWidth={3} />}
      </div>
      {event.bboxes.map((box, i) => (
        <React.Fragment key={i}>
          <div
            className={cn(
              "absolute border-2",
              box.variant === "person"  ? "border-info bg-info/10"
              : box.variant === "vehicle" ? "border-purple bg-purple/10"
              : "border-primary bg-primary/10"
            )}
            style={{ top: box.top, left: box.left, width: box.width, height: box.height }}
          />
          <span
            className={cn(
              "absolute -translate-y-full rounded-sm px-0.5 py-px text-[9px] font-semibold text-white",
              box.variant === "person"  ? "bg-info"
              : box.variant === "vehicle" ? "bg-purple"
              : "bg-primary"
            )}
            style={{ top: box.top, left: box.left }}
          >
            {box.label}
          </span>
        </React.Fragment>
      ))}
      <span className="absolute bottom-1.5 left-1.5 rounded bg-black/75 px-1 py-px font-mono text-[10px] text-white">
        {event.time.slice(0, 5)}
      </span>
    </div>
  );
}

/* ─── Individual event card ──────────────────────────────────────────────── */

function EventCard({
  event,
  selected,
  onSelect,
  onOpen,
  onEscalate,
  onDismiss,
  onLink,
  onViewCase,
}: {
  event: DetectionEvent;
  selected: boolean;
  onSelect: (id: string) => void;
  onOpen: (id: string) => void;
  onEscalate: (id: string) => void;
  onDismiss: (id: string) => void;
  onLink: (id: string) => void;
  onViewCase: () => void;
}) {
  return (
    <div
      onClick={() => onOpen(event.id)}
      className={cn(
        "relative grid cursor-pointer rounded-xl border border-l-[3px] bg-card p-3.5 transition-all hover:bg-muted/30",
        "grid-cols-[140px_1fr] gap-3",
        "sm:grid-cols-[140px_1fr_auto] sm:gap-4",
        selected ? "border-primary bg-primary-muted" : "border-border",
        event.status === "escalated" && "opacity-75"
      )}
      style={{ borderLeftColor: `var(--sev-${event.severity})` }}
    >
      {/* Thumbnail — row 1 col 1 */}
      <div className="self-start" onClick={(e) => { e.stopPropagation(); onSelect(event.id); }}>
        <EventThumb event={event} selected={selected} />
      </div>

      {/* Body — row 1 col 2 */}
      <div className="min-w-0">
        <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
          <SeverityBadge severity={event.severity} />
          <span className="text-[13px] font-semibold text-foreground">{event.typeLabel}</span>
          {event.status === "escalated" && (
            <span className="inline-flex items-center gap-1 rounded bg-success-soft px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-success">
              <span className="size-1.5 rounded-full bg-success" />
              Escalated
            </span>
          )}
          <span
            title={event.useCaseTitle}
            className="cursor-help rounded border border-border bg-muted px-1.5 py-px font-mono text-[11px] text-muted-foreground hover:border-primary hover:text-primary"
          >
            {event.useCaseId}
          </span>
          <span className="inline-flex items-center gap-1 rounded border border-purple/20 bg-purple-soft px-1.5 py-px font-mono text-[10px] text-muted-foreground hover:border-purple hover:text-purple">
            <span className="size-1.5 rounded-full bg-purple" />
            {event.model}
          </span>
        </div>
        <p className="mb-2 text-[13px] leading-relaxed text-muted-foreground">
          {parseEventText(event.summary)}
        </p>
        <div className="flex flex-wrap items-center gap-3.5 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-2.5" />
            {event.siteDisplay} · {event.areaDisplay} · {event.camera}
          </span>
        </div>
      </div>

      {/* Action buttons — row 2 full-width on mobile, col 3 row 1 on desktop */}
      <div
        className="col-span-2 flex flex-wrap gap-1.5 sm:col-span-1 sm:flex-col sm:items-stretch sm:self-start sm:gap-1.5"
        onClick={(e) => e.stopPropagation()}
      >
        {event.status === "escalated" ? (
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={(e) => { e.stopPropagation(); onViewCase(); }}
          >
            View Case →
          </Button>
        ) : (
          <>
            <Button size="sm" className="text-xs" onClick={() => onEscalate(event.id)}>
              Escalate Case
            </Button>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => onLink(event.id)}>
              Link Case
            </Button>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => onDismiss(event.id)}>
              Dismiss
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Multi-select filter dropdown ──────────────────────────────────────── */

interface FilterDropdownProps {
  label: string;
  options: readonly { value: string; label: string; color?: string }[];
  selected: string[];
  onChange: (values: string[]) => void;
}

function FilterDropdown({ label, options, selected, onChange }: FilterDropdownProps) {
  const [open, setOpen] = React.useState(false);
  const hasValue = selected.length > 0;
  const displayLabel = hasValue
    ? selected.length === 1
      ? (options.find((o) => o.value === selected[0])?.label ?? label)
      : `${selected.length} selected`
    : label;

  function toggle(value: string) {
    onChange(
      selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex w-full items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2 text-[13px] transition-colors hover:border-primary",
            open ? "border-primary" : "border-border",
            hasValue ? "text-primary" : "text-muted-foreground"
          )}
        >
          <TruncatedText text={displayLabel} className="font-medium" />
          <ChevronDown
            className={cn(
              "size-3.5 flex-shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180"
            )}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-52 p-1.5">
        {options.map((opt) => {
          const checked = selected.includes(opt.value);
          return (
            <button
              key={opt.value}
              onClick={() => toggle(opt.value)}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[13px] text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <div
                className={cn(
                  "flex size-3.5 flex-shrink-0 items-center justify-center rounded border transition-colors",
                  checked ? "border-primary bg-primary" : "border-muted-foreground/40"
                )}
              >
                {checked && (
                  <Check className="size-2.5 text-primary-foreground" strokeWidth={3} />
                )}
              </div>
              {opt.color && (
                <span
                  className="size-1.5 flex-shrink-0 rounded-full"
                  style={{ background: opt.color }}
                />
              )}
              {opt.label}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

/* ─── Active filter pill bar ─────────────────────────────────────────────── */

function ActiveFilterBar({
  filters,
  onRemoveFilter,
  onClearAll,
}: {
  filters: Filters;
  onRemoveFilter: (group: keyof Filters, value: string) => void;
  onClearAll: () => void;
}) {
  const allOptions = {
    severity: FILTER_OPTIONS.severity as readonly { value: string; label: string }[],
    type: FILTER_OPTIONS.type as readonly { value: string; label: string }[],
    site: FILTER_OPTIONS.site as readonly { value: string; label: string }[],
    area: AREA_OPTIONS as readonly { value: string; label: string }[],
    model: FILTER_OPTIONS.model as readonly { value: string; label: string }[],
  };

  const allActive = (Object.keys(filters) as (keyof Filters)[]).flatMap((group) =>
    filters[group].map((val) => ({
      group,
      value: val,
      label: allOptions[group].find((o) => o.value === val)?.label ?? val,
    }))
  );

  if (allActive.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/20 bg-primary-muted px-3 py-2">
      {allActive.map(({ group, value, label }) => (
        <span
          key={`${group}-${value}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary-muted px-2.5 py-0.5 text-[11px] font-semibold text-primary"
        >
          {label}
          <button
            onClick={() => onRemoveFilter(group, value)}
            className="flex size-4 items-center justify-center rounded-full bg-primary/20 text-primary hover:bg-primary hover:text-white"
          >
            <X className="size-2.5" />
          </button>
        </span>
      ))}
      <button
        onClick={onClearAll}
        className="ml-auto text-[11px] text-muted-foreground underline hover:text-primary"
      >
        Clear all
      </button>
    </div>
  );
}

/* ─── Collapsible filter panel ───────────────────────────────────────────── */

function FilterPanel({
  filters,
  onChange,
  search,
  onSearchChange,
  datePreset,
  onDatePresetChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
  search: string;
  onSearchChange: (v: string) => void;
  datePreset: DatePreset;
  onDatePresetChange: (v: DatePreset) => void;
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (v: string) => void;
  onDateToChange: (v: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const filterCount = Object.values(filters).reduce((sum, arr) => sum + arr.length, 0);
  const dateActive = datePreset !== "all" ? 1 : 0;
  const activeCount = filterCount + (search ? 1 : 0) + dateActive;

  function setGroup(group: keyof Filters, values: string[]) {
    onChange({ ...filters, [group]: values });
  }

  const presetSummary =
    datePreset === "custom" && dateFrom && dateTo
      ? `${dateFrom} – ${dateTo}`
      : DATE_PRESETS.find((p) => p.key === datePreset)?.label ?? "All time";

  return (
    <div className="rounded-xl border border-border bg-card">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-muted/30"
      >
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <SlidersHorizontal className="size-4 flex-shrink-0 text-muted-foreground" />
          <span className="text-[13px] font-semibold text-foreground">Filters</span>
          {activeCount > 0 ? (
            <span className="rounded-full bg-primary px-2 py-px text-[11px] font-semibold text-primary-foreground">
              {activeCount} active
            </span>
          ) : (
            <div className="hidden flex-wrap gap-1.5 sm:flex">
              {["All sites", "All areas", "All models"].map((l) => (
                <span
                  key={l}
                  className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-[11px] text-muted-foreground"
                >
                  {l}
                </span>
              ))}
            </div>
          )}
          <span className="ml-auto hidden text-[11px] text-muted-foreground sm:block">
            Showing <strong className="text-foreground">{presetSummary}</strong>
          </span>
        </div>
        <div className="flex items-center gap-3">
          {activeCount > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onChange(EMPTY_FILTERS);
                onSearchChange("");
                onDatePresetChange("all");
                onDateFromChange("");
                onDateToChange("");
              }}
              className="text-[12px] text-muted-foreground underline hover:text-primary"
            >
              Clear all
            </button>
          )}
          {open ? (
            <ChevronUp className="size-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {open && (
        <div className="space-y-3 rounded-b-xl border-t border-border bg-background px-4 py-4">
          {/* Search — second row */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by ID, asset, person, camera..."
              className="h-9 w-full pl-9 text-[13px]"
            />
          </div>
          {/* Dropdowns — severity & type come from KPI cards, date from the range bar */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { key: "site" as const, label: "Site", opts: FILTER_OPTIONS.site },
              { key: "area" as const, label: "Area", opts: AREA_OPTIONS },
              { key: "model" as const, label: "Detection Model", opts: FILTER_OPTIONS.model },
            ].map(({ key, label, opts }) => (
              <div key={key}>
                <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {label}
                </div>
                <FilterDropdown
                  label={`All ${label.toLowerCase()}`}
                  options={opts}
                  selected={filters[key]}
                  onChange={(v) => setGroup(key, v)}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Selection bar ──────────────────────────────────────────────────────── */

function SelectionBar({
  count,
  onClear,
  onDismissAll,
  onLinkAll,
  onEscalateAll,
}: {
  count: number;
  onClear: () => void;
  onDismissAll: () => void;
  onLinkAll: () => void;
  onEscalateAll: () => void;
}) {
  if (count === 0) return null;
  return (
    <div className="fixed inset-x-6 bottom-6 z-50 mx-auto flex max-w-4xl flex-wrap items-center gap-3 rounded-xl border border-primary bg-card px-4 py-3 shadow-[0_16px_48px_hsl(var(--primary)/0.25)]">
      {/* Count badge */}
      <div className="flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <CheckSquare className="size-3.5" />
        </div>
        <span className="text-[13px] font-semibold text-foreground">
          {count} event{count > 1 ? "s" : ""} selected
        </span>
      </div>

      <div className="ml-auto flex flex-wrap items-center gap-1.5">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-[12px] text-muted-foreground"
          onClick={onClear}
        >
          <X className="size-3.5" />
          Clear selection
        </Button>
        <div className="mx-1 h-4 w-px bg-border" />
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-[12px]"
          onClick={onDismissAll}
        >
          <Trash2 className="size-3.5" />
          Dismiss
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-[12px]"
          onClick={onLinkAll}
        >
          <Link2 className="size-3.5" />
          Link Case
        </Button>
        <Button size="sm" className="gap-1.5 text-[12px]" onClick={onEscalateAll}>
          Escalate Case
        </Button>
      </div>
    </div>
  );
}

/* ─── KPI card configs ───────────────────────────────────────────────────── */

const KPI_CONFIGS: {
  key: KpiFilter;
  label: string;
  accent: KpiAccent;
  getValue: (events: DetectionEvent[]) => number;
  sub: string;
}[] = [
  { key: "all",       label: "Total",     accent: "primary",      getValue: (e) => e.length,                                     sub: "Across 3 sites" },
  { key: "critical",  label: "Critical",  accent: "sev-critical", getValue: (e) => e.filter((x) => x.severity === "critical").length, sub: "Immediate threat" },
  { key: "medium",    label: "Medium",    accent: "sev-medium",   getValue: (e) => e.filter((x) => x.severity === "medium").length,   sub: "Needs review" },
  { key: "low",       label: "Low",       accent: "sev-low",      getValue: (e) => e.filter((x) => x.severity === "low").length,      sub: "Informational" },
  { key: "pending",   label: "Pending",   accent: "warning",      getValue: (e) => e.filter((x) => x.status === "pending").length,    sub: "Awaiting triage" },
  { key: "escalated", label: "Escalated", accent: "success",      getValue: (e) => e.filter((x) => x.status === "escalated").length,  sub: "In incident case" },
];

/* ─── Date presets ───────────────────────────────────────────────────────── */

const DATE_PRESETS: { key: DatePreset; label: string; display: string }[] = [
  { key: "all", label: "All time", display: "all dates" },
  { key: "today", label: "Today", display: "19 May 2026" },
  { key: "yesterday", label: "Yesterday", display: "18 May 2026" },
  { key: "week", label: "This Week", display: "13 – 19 May 2026" },
  { key: "month", label: "This Month", display: "1 – 19 May 2026" },
  // "custom" is not in this list — rendered separately with its own date inputs
];

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function DetectionFeedPage({
  forced = "normal",
  onResolveForced = () => {},
}: { forced?: ForcedState; onResolveForced?: () => void }) {
  const navigate = useNavigate();
  const { createCase, linkEvents: storeLinkEvents } = useIncidentCasesStore();

  // PROTOTYPE-ONLY listing state (Load-older / cap / live pill). Drop when promoting.
  const [loadedCount, setLoadedCount] = React.useState(20);
  const [loadingOlder, setLoadingOlder] = React.useState(false);
  const [liveCount, setLiveCount] = React.useState(0);
  const PAGE = 20;

  const [datePreset, setDatePreset] = React.useState<DatePreset>("all");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");
  const [kpiFilter, setKpiFilter] = React.useState<KpiFilter>("all");
  const [filters, setFilters] = React.useState<Filters>(EMPTY_FILTERS);
  const [search, setSearch] = React.useState("");
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [drawerEventId, setDrawerEventId] = React.useState<string | null>(null);
  const [escalateEventId, setEscalateEventId] = React.useState<string | null>(null);
  const [dismissEventId, setDismissEventId] = React.useState<string | null>(null);
  const [dismissedIds, setDismissedIds] = React.useState<Set<string>>(new Set());
  const [localEscalated, setLocalEscalated] = React.useState<Set<string>>(new Set());
  /* Maps eventId → caseId for "View Case →" navigation */
  const [eventCaseMap, setEventCaseMap] = React.useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    FEED_DATA.forEach((e) => { if (e.caseId) map[e.id] = e.caseId; });
    return map;
  });
  /* Link-to-case modal: holds eventIds + their site */
  const [linkModalEventIds, setLinkModalEventIds] = React.useState<string[]>([]);
  const [linkModalSite, setLinkModalSite] = React.useState({ site: "", siteDisplay: "" });

  /* ── Derived events with local overrides ────────────────────────────── */
  const allEvents = React.useMemo(
    () =>
      FEED_DATA.map((e) => ({
        ...e,
        status: dismissedIds.has(e.id)
          ? ("dismissed" as const)
          : localEscalated.has(e.id)
          ? ("escalated" as const)
          : e.status,
      })),
    [dismissedIds, localEscalated]
  );

  const visibleEvents = React.useMemo(() => {
    let ev = allEvents.filter((e) => e.status !== "dismissed");

    if (datePreset === "today") ev = ev.filter((e) => e.date === "2026-05-19");
    else if (datePreset === "yesterday") ev = ev.filter((e) => e.date === "2026-05-18");
    else if (datePreset === "custom" && dateFrom && dateTo)
      ev = ev.filter((e) => e.date >= dateFrom && e.date <= dateTo);

    if (kpiFilter === "critical")  ev = ev.filter((e) => e.severity === "critical");
    else if (kpiFilter === "medium") ev = ev.filter((e) => e.severity === "medium");
    else if (kpiFilter === "low") ev = ev.filter((e) => e.severity === "low");
    else if (kpiFilter === "pending") ev = ev.filter((e) => e.status === "pending");
    else if (kpiFilter === "escalated") ev = ev.filter((e) => e.status === "escalated");

    if (filters.severity.length > 0)
      ev = ev.filter((e) => filters.severity.includes(e.severity));
    if (filters.type.length > 0) ev = ev.filter((e) => filters.type.includes(e.type));
    if (filters.site.length > 0) ev = ev.filter((e) => filters.site.includes(e.site));
    if (filters.area.length > 0) ev = ev.filter((e) => filters.area.includes(e.area));
    if (filters.model.length > 0) ev = ev.filter((e) => filters.model.includes(e.modelKey));

    if (search.trim()) {
      const q = search.toLowerCase();
      ev = ev.filter(
        (e) =>
          e.id.toLowerCase().includes(q) ||
          e.typeLabel.toLowerCase().includes(q) ||
          e.areaDisplay.toLowerCase().includes(q) ||
          e.siteDisplay.toLowerCase().includes(q) ||
          (e.assetId?.toLowerCase().includes(q) ?? false) ||
          (e.personId?.toLowerCase().includes(q) ?? false)
      );
    }

    return ev;
  }, [allEvents, datePreset, kpiFilter, filters, search]);

  const isSelecting = selectedIds.size > 0;

  // PROTOTYPE-ONLY: show loadedCount events; Load-older adds another PAGE (no cap).
  const loadedEvents = React.useMemo(
    () => visibleEvents.slice(0, loadedCount),
    [visibleEvents, loadedCount]
  );
  const footerMode: "more" | "caught-up" =
    loadedCount >= visibleEvents.length ? "caught-up" : "more";

  // Reset the window whenever the filter scope changes.
  React.useEffect(() => {
    setLoadedCount(PAGE);
  }, [datePreset, kpiFilter, filters, search]);

  // Live simulation — drives the "N new events" pill (real state only).
  React.useEffect(() => {
    if (forced !== "normal") return;
    const id = window.setInterval(() => setLiveCount((c) => c + 1), 6000);
    return () => clearInterval(id);
  }, [forced]);

  function loadOlder() {
    if (loadingOlder || footerMode !== "more") return;
    setLoadingOlder(true);
    window.setTimeout(() => {
      setLoadedCount((c) => Math.min(c + PAGE, visibleEvents.length));
      setLoadingOlder(false);
    }, 500);
  }

  const grouped = React.useMemo(
    () =>
      DATE_GROUPS.map((g) => ({
        ...g,
        events: loadedEvents
          .filter((e) => e.date === g.key)
          .filter((e) => !isSelecting || e.status !== "escalated"),
      })).filter((g) => g.events.length > 0),
    [loadedEvents, isSelecting]
  );

  const pendingCount = visibleEvents.filter((e) => e.status === "pending").length;

  const drawerEvent = drawerEventId
    ? (allEvents.find((e) => e.id === drawerEventId) ?? null)
    : null;
  const escalateEvent =
    escalateEventId && escalateEventId !== "__batch__"
      ? (allEvents.find((e) => e.id === escalateEventId) ?? null)
      : null;
  const dismissEvent =
    dismissEventId && dismissEventId !== "__batch__"
      ? (allEvents.find((e) => e.id === dismissEventId) ?? null)
      : null;

  /* ── Handlers ────────────────────────────────────────────────────────── */

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function removeFilter(group: keyof Filters, value: string) {
    setFilters((f) => ({ ...f, [group]: f[group].filter((v) => v !== value) }));
  }

  function handleKpiClick(key: KpiFilter) {
    setKpiFilter((prev) => (prev === key ? "all" : key));
  }

  function confirmEscalate(data: EscalateFormData) {
    if (escalateEventId && escalateEventId !== "__batch__") {
      const ev = allEvents.find((e) => e.id === escalateEventId);
      if (!ev) return;
      const caseId = createCase({
        title: data.title,
        severity: data.severity,
        site: ev.site,
        siteDisplay: ev.siteDisplay,
        assignedTo: data.assignee,
        incidentIds: [escalateEventId],
        notes: data.notes,
      });
      setLocalEscalated((prev) => new Set([...prev, escalateEventId]));
      setEventCaseMap((prev) => ({ ...prev, [escalateEventId]: caseId }));
      toast.success("Case created", {
        description: `${caseId} created. Event ${escalateEventId} linked.`,
      });
    } else {
      const selectedArr = allEvents.filter((e) => selectedIds.has(e.id));
      const first = selectedArr[0];
      if (!first) return;
      const count = selectedIds.size;
      const idArr = [...selectedIds];
      const caseId = createCase({
        title: data.title,
        severity: data.severity,
        site: first.site,
        siteDisplay: first.siteDisplay,
        assignedTo: data.assignee,
        incidentIds: idArr,
        notes: data.notes,
      });
      setLocalEscalated((prev) => new Set([...prev, ...selectedIds]));
      setEventCaseMap((prev) => {
        const next = { ...prev };
        idArr.forEach((id) => { next[id] = caseId; });
        return next;
      });
      setSelectedIds(new Set());
      toast.success(`${count} event${count > 1 ? "s" : ""} escalated`, {
        description: `${caseId} created and linked.`,
      });
    }
    setEscalateEventId(null);
  }

  function openLinkModal(eventId: string) {
    const ev = allEvents.find((e) => e.id === eventId);
    if (!ev) return;
    setLinkModalEventIds([eventId]);
    setLinkModalSite({ site: ev.site, siteDisplay: ev.siteDisplay });
  }

  function confirmLink(caseId: string) {
    storeLinkEvents(caseId, linkModalEventIds);
    setLocalEscalated((prev) => new Set([...prev, ...linkModalEventIds]));
    setEventCaseMap((prev) => {
      const next = { ...prev };
      linkModalEventIds.forEach((id) => { next[id] = caseId; });
      return next;
    });
    if (linkModalEventIds.length === 1) {
      toast.success("Linked to case", {
        description: `Event ${linkModalEventIds[0]} added to ${caseId}.`,
      });
    } else {
      setSelectedIds(new Set());
      toast.success(`${linkModalEventIds.length} events linked`, {
        description: `All selected events added to ${caseId}.`,
      });
    }
    setLinkModalEventIds([]);
  }

  function confirmDismiss() {
    if (dismissEventId && dismissEventId !== "__batch__") {
      setDismissedIds((prev) => new Set([...prev, dismissEventId]));
      if (drawerEventId === dismissEventId) setDrawerEventId(null);
      toast.success("Event dismissed", {
        description: `${dismissEventId} has been marked as a false positive.`,
      });
    } else {
      const count = selectedIds.size;
      setDismissedIds((prev) => new Set([...prev, ...selectedIds]));
      setSelectedIds(new Set());
      toast.success(`${count} event${count > 1 ? "s" : ""} dismissed`, {
        description: "Events marked as false positives and removed from feed.",
      });
    }
    setDismissEventId(null);
  }

  /* ─────────────────────────────────────────────────────────────────────── */

  return (
    <div className="flex flex-col gap-4">
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <PageHeader>
        <PageHeader.Content>
          <PageHeader.Title>
            <span className="flex items-center gap-2.5">
              Detection Feed
              <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success-soft px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-success">
                <span className="size-1.5 animate-pulse rounded-full bg-success" />
                Live
              </span>
            </span>
          </PageHeader.Title>
          <PageHeader.Description>
            AI-flagged events across all sites. Triage, dismiss, or escalate to a case.
          </PageHeader.Description>
        </PageHeader.Content>
        <PageHeader.Actions>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-[13px]"
            onClick={() => navigate("/detection-feed/dismissed")}
          >
            <Trash2 className="size-3.5" />
            Dismissed ({dismissedIds.size + MOCK_DISMISSED.length})
          </Button>
        </PageHeader.Actions>
      </PageHeader>

      {/* ── KPI cards ───────────────────────────────────────────────────── */}
      <KpiGrid cols={6}>
        {KPI_CONFIGS.map((cfg) => (
          <KpiCard
            key={cfg.key}
            label={cfg.label}
            value={cfg.getValue(allEvents.filter((e) => e.status !== "dismissed"))}
            sub={cfg.sub}
            accent={cfg.accent}
            active={kpiFilter === cfg.key}
            onClick={() => handleKpiClick(cfg.key)}
          />
        ))}
      </KpiGrid>

      {/* ── Date preset row ─────────────────────────────────────────────── */}
      <DateRangeBar
        presets={DATE_PRESETS}
        active={datePreset}
        onSelect={(k) => { setDatePreset(k as DatePreset); if (k !== "custom") { setDateFrom(""); setDateTo(""); } }}
        customFrom={dateFrom}
        customTo={dateTo}
        onCustomChange={(f, t) => { setDateFrom(f); setDateTo(t); }}
        onCustomApply={(f, t) => { setDateFrom(f); setDateTo(t); }}
        onCustomReset={() => { setDatePreset("all"); setDateFrom(""); setDateTo(""); }}
        onClear={
          datePreset !== "all" || dateFrom || dateTo
            ? () => { setDatePreset("all"); setDateFrom(""); setDateTo(""); }
            : undefined
        }
      />

      {/* ── Active filter bar ────────────────────────────────────────────── */}
      <ActiveFilterBar
        filters={filters}
        onRemoveFilter={removeFilter}
        onClearAll={() => setFilters(EMPTY_FILTERS)}
      />

      {/* ── Filter panel ─────────────────────────────────────────────────── */}
      <FilterPanel
        filters={filters}
        onChange={setFilters}
        search={search}
        onSearchChange={setSearch}
        datePreset={datePreset}
        onDatePresetChange={setDatePreset}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
      />

      {/* ── Feed header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-1">
        <p className="text-[13px] text-muted-foreground">
          <strong className="text-foreground">{visibleEvents.length}</strong> events match current
          filters · {pendingCount} pending
        </p>
        <select className="rounded-md border border-border bg-card px-2.5 py-1.5 text-[12px] text-foreground focus:border-primary focus:outline-none">
          <option>Newest first</option>
          <option>Severity (high → low)</option>
          <option>Confidence (high → low)</option>
          <option>By site</option>
        </select>
      </div>

      {/* ── Live "N new events" pill ─────────────────────────────────────── */}
      {forced === "normal" && liveCount > 0 && (
        <button
          onClick={() => {
            toast.message(`Loaded ${liveCount} new event${liveCount === 1 ? "" : "s"}`);
            setLiveCount(0);
          }}
          className="mx-auto inline-flex items-center gap-2 rounded-full border border-info/40 bg-info/15 px-4 py-1.5 text-[12px] font-semibold text-info shadow-sm transition-colors hover:bg-info/25"
        >
          <Zap className="size-3.5" />
          {liveCount} new event{liveCount === 1 ? "" : "s"} — click to show
        </button>
      )}

      {/* ── Event groups (forced states override the real list) ─────────── */}
      {forced === "loading" ? (
        <SkeletonList />
      ) : forced === "error" ? (
        <ErrorState onRetry={onResolveForced} />
      ) : forced === "empty" || grouped.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-20 text-muted-foreground">
          <Search className="size-10 opacity-20" />
          <p className="text-sm">No events match the current filters.</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (forced === "empty") onResolveForced();
              setFilters(EMPTY_FILTERS);
              setKpiFilter("all");
              setSearch("");
            }}
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <>
          {grouped.map((group) => (
            <div key={group.key} className="space-y-2.5">
              <div className="flex items-center gap-2.5 border-b border-border pb-2">
                <span className="text-[13px] font-bold text-foreground">
                  {group.label} · {group.date}
                </span>
                <span className="text-[12px] text-muted-foreground">{group.events.length} events</span>
              </div>
              {group.events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  selected={selectedIds.has(event.id)}
                  onSelect={toggleSelect}
                  onOpen={setDrawerEventId}
                  onEscalate={setEscalateEventId}
                  onDismiss={setDismissEventId}
                  onLink={openLinkModal}
                  onViewCase={() => {
                    const caseId = eventCaseMap[event.id];
                    navigate(caseId ? `/incidents/${caseId}` : "/incidents");
                  }}
                />
              ))}
            </div>
          ))}
          <ListFooter
            mode={footerMode}
            loading={loadingOlder}
            onLoadOlder={loadOlder}
          />
        </>
      )}

      {/* ── Selection bar ────────────────────────────────────────────────── */}
      <SelectionBar
        count={selectedIds.size}
        onClear={() => setSelectedIds(new Set())}
        onDismissAll={() => setDismissEventId("__batch__")}
        onLinkAll={() => {
          const selectedArr = allEvents.filter((e) => selectedIds.has(e.id));
          const sites = [...new Set(selectedArr.map((e) => e.site))];
          if (sites.length > 1) {
            toast.error("Multiple sites selected", {
              description: "Events in one case must be from the same site.",
            });
            return;
          }
          const first = selectedArr[0];
          if (!first) return;
          setLinkModalEventIds([...selectedIds]);
          setLinkModalSite({ site: first.site, siteDisplay: first.siteDisplay });
        }}
        onEscalateAll={() => {
          const selectedArr = allEvents.filter((e) => selectedIds.has(e.id));
          const sites = [...new Set(selectedArr.map((e) => e.site))];
          if (sites.length > 1) {
            toast.error("Multiple sites selected", {
              description: "Events in one case must be from the same site.",
            });
            return;
          }
          setEscalateEventId("__batch__");
        }}
      />

      {/* ── Drawer ───────────────────────────────────────────────────────── */}
      <EventDrawer
        event={drawerEvent}
        open={drawerEventId !== null}
        onClose={() => setDrawerEventId(null)}
        onEscalate={() => drawerEvent && setEscalateEventId(drawerEvent.id)}
        onDismiss={() => drawerEvent && setDismissEventId(drawerEvent.id)}
      />

      {/* ── Escalate modal ───────────────────────────────────────────────── */}
      <EscalateModal
        event={escalateEvent}
        bulkCount={escalateEventId === "__batch__" ? selectedIds.size : undefined}
        open={escalateEventId !== null}
        onClose={() => setEscalateEventId(null)}
        onConfirm={confirmEscalate}
      />

      {/* ── Dismiss modal ────────────────────────────────────────────────── */}
      <DismissModal
        event={dismissEvent}
        bulkCount={dismissEventId === "__batch__" ? selectedIds.size : undefined}
        open={dismissEventId !== null}
        onClose={() => setDismissEventId(null)}
        onConfirm={confirmDismiss}
      />

      {/* ── Link to case modal ───────────────────────────────────────────── */}
      <LinkCaseModal
        eventIds={linkModalEventIds}
        eventSite={linkModalSite.site}
        eventSiteDisplay={linkModalSite.siteDisplay}
        open={linkModalEventIds.length > 0}
        onClose={() => setLinkModalEventIds([])}
        onConfirm={confirmLink}
      />
    </div>
  );
}
