import * as React from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  Search,
  RotateCcw,
  ShieldOff,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/layout/PageHeader";
import { MOCK_DISMISSED, FP_REASON_LABELS } from "@/mocks/detectionFeed";
import { SeverityBadge, parseEventText } from "../shared";
import { KpiCard, KpiGrid, type KpiAccent } from "@/components/shared/KpiCard";
import { MapPin } from "lucide-react";
import { DismissedDrawer } from "./DismissedDrawer";
import type { DismissedEvent, FpReason } from "@/types/detection";
import { TruncatedText } from "@/components/shared/TruncatedText";

/* ── Reason chip ─────────────────────────────────────────────────────────── */

const REASON_STYLES: Record<FpReason, { chip: string; bar: string }> = {
  "wrong-class":     { chip: "bg-sev-medium-soft text-sev-medium",  bar: "bg-sev-medium" },
  "wrong-person":    { chip: "bg-sev-high-soft text-sev-high",      bar: "bg-sev-high" },
  "known-exemption": { chip: "bg-success-soft text-success",        bar: "bg-success" },
  "staged":          { chip: "bg-info-soft text-info",              bar: "bg-info" },
  "threshold":       { chip: "bg-purple-soft text-purple",          bar: "bg-purple" },
  "other":           { chip: "bg-muted text-muted-foreground",      bar: "bg-muted-foreground" },
};

function ReasonChip({ reason }: { reason: FpReason }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-2 py-0.5 text-2xs font-semibold uppercase tracking-wider",
        REASON_STYLES[reason].chip
      )}
    >
      {FP_REASON_LABELS[reason]}
    </span>
  );
}

/* ── KPI cards ───────────────────────────────────────────────────────────── */

type KpiFilter = "all" | "known-exemption" | "wrong-class" | "threshold" | "other";

const KPI_CONFIGS: {
  key: KpiFilter;
  label: string;
  getValue: (items: DismissedEvent[]) => number;
  sub: string;
  accent: KpiAccent;
}[] = [
  { key: "all",             label: "Total Dismissed", getValue: (i) => i.length,                                                              sub: "Last 30 days",            accent: "primary" },
  { key: "known-exemption", label: "Known Exemptions",getValue: (i) => i.filter((d) => d.reason === "known-exemption").length,               sub: "Authorized activities",   accent: "success" },
  { key: "wrong-class",     label: "Model Errors",    getValue: (i) => i.filter((d) => d.reason === "wrong-class" || d.reason === "wrong-person").length, sub: "Wrong class or person", accent: "sev-medium" },
  { key: "threshold",       label: "Tuning Needed",   getValue: (i) => i.filter((d) => d.reason === "threshold").length,                     sub: "Threshold too sensitive", accent: "purple" },
  { key: "other",           label: "Others",          getValue: (i) => i.filter((d) => d.reason === "staged" || d.reason === "other").length, sub: "Staged events & other",  accent: "info" },
];

/* ── Filter option types ─────────────────────────────────────────────────── */

interface FilterOption { value: string; label: string }

const DISMISSED_FILTER_OPTIONS = {
  reason: Object.entries(FP_REASON_LABELS).map(([value, label]) => ({ value, label })),
  site: [
    { value: "fedex", label: "FedEx Changi" },
    { value: "sembawang", label: "Sembawang Naval" },
    { value: "astra", label: "Astra HQ" },
  ],
  area: [
    { value: "astra-hq-lobby",     label: "HQ Lobby" },
    { value: "astra-lab-3",        label: "Lab 3" },
    { value: "astra-parking-p1",   label: "Parking P1" },
    { value: "sembawang-medical",  label: "Medical Bay 2" },
    { value: "sembawang-armoury-a",label: "Armoury A" },
    { value: "fedex-loading-bay-3",label: "Loading Bay 3" },
    { value: "fedex-checkpoint-c", label: "Checkpoint C1" },
    { value: "fedex-canteen",      label: "Canteen B" },
  ],
  model: [
    { value: "vms-4-2-1", label: "accel-vms v4.2.1" },
    { value: "vms-4-1-0", label: "accel-vms v4.1.0" },
    { value: "vms-3-9-2", label: "accel-vms v3.9.2" },
    { value: "sop-2",     label: "accel-sop v2.0" },
  ],
} as const;

interface DismissedFilters {
  reason: string[];
  site: string[];
  area: string[];
  model: string[];
}
const EMPTY_DISMISSED_FILTERS: DismissedFilters = { reason: [], site: [], area: [], model: [] };

/* ── Multi-select dropdown (same pattern as Detection Feed) ──────────────── */

function FilterDropdown({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: readonly FilterOption[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const hasValue = selected.length > 0;
  const displayLabel = hasValue
    ? selected.length === 1
      ? (options.find((o) => o.value === selected[0])?.label ?? label)
      : `${selected.length} selected`
    : label;

  function toggle(value: string) {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex w-full items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2 text-base transition-colors hover:border-primary",
            open ? "border-primary" : "border-border",
            hasValue ? "text-primary" : "text-muted-foreground"
          )}
        >
          <TruncatedText text={displayLabel} className="font-medium" />
          <ChevronDown
            className={cn("size-3.5 flex-shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
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
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-base text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <div
                className={cn(
                  "flex size-3.5 flex-shrink-0 items-center justify-center rounded border transition-colors",
                  checked ? "border-primary bg-primary" : "border-muted-foreground/40"
                )}
              >
                {checked && <Check className="size-2.5 text-primary-foreground" strokeWidth={3} />}
              </div>
              {opt.label}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

/* ── Collapsible filter panel ────────────────────────────────────────────── */

function FilterPanel({
  filters,
  onChange,
  search,
  onSearchChange,
}: {
  filters: DismissedFilters;
  onChange: (f: DismissedFilters) => void;
  search: string;
  onSearchChange: (v: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const filterCount = Object.values(filters).reduce((sum, arr) => sum + arr.length, 0);
  const activeCount = filterCount + (search ? 1 : 0);

  function setGroup(group: keyof DismissedFilters, values: string[]) {
    onChange({ ...filters, [group]: values });
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-muted/30"
      >
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <SlidersHorizontal className="size-4 flex-shrink-0 text-muted-foreground" />
          <span className="text-base font-semibold text-foreground">Filters</span>
          {activeCount > 0 ? (
            <span className="rounded-full bg-primary px-2 py-px text-xs font-semibold text-primary-foreground">
              {activeCount} active
            </span>
          ) : (
            <div className="hidden flex-wrap gap-1.5 sm:flex">
              {["All reasons", "All sites", "All areas", "All models"].map((l) => (
                <span key={l} className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                  {l}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {activeCount > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); onChange(EMPTY_DISMISSED_FILTERS); onSearchChange(""); }}
              className="text-sm text-muted-foreground underline hover:text-primary"
            >
              Clear all
            </button>
          )}
          {open
            ? <ChevronUp className="size-4 text-muted-foreground" />
            : <ChevronDown className="size-4 text-muted-foreground" />
          }
        </div>
      </button>

      {open && (
        <div className="space-y-3 rounded-b-xl border-t border-border bg-background px-4 py-4">
          {/* Search */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by ID, operator, notes, camera..."
              className="h-9 w-full pl-9 text-base"
            />
          </div>
          {/* 4 dropdowns */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { key: "reason" as const, label: "FP Reason",  opts: DISMISSED_FILTER_OPTIONS.reason },
              { key: "site"   as const, label: "Site",        opts: DISMISSED_FILTER_OPTIONS.site },
              { key: "area"   as const, label: "Area",        opts: DISMISSED_FILTER_OPTIONS.area },
              { key: "model"  as const, label: "Model",       opts: DISMISSED_FILTER_OPTIONS.model },
            ].map(({ key, label, opts }) => (
              <div key={key}>
                <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {label}
                </div>
                <FilterDropdown
                  label={`All ${label.toLowerCase()}s`}
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

/* ── Active filter pills ─────────────────────────────────────────────────── */

function ActiveFilterBar({
  filters,
  search,
  onRemove,
  onClearAll,
  onClearSearch,
}: {
  filters: DismissedFilters;
  search: string;
  onRemove: (group: keyof DismissedFilters, value: string) => void;
  onClearAll: () => void;
  onClearSearch: () => void;
}) {
  const allOptions = {
    reason: DISMISSED_FILTER_OPTIONS.reason as readonly FilterOption[],
    site:   DISMISSED_FILTER_OPTIONS.site   as readonly FilterOption[],
    area:   DISMISSED_FILTER_OPTIONS.area   as readonly FilterOption[],
    model:  DISMISSED_FILTER_OPTIONS.model  as readonly FilterOption[],
  };

  const allActive = (Object.keys(filters) as (keyof DismissedFilters)[]).flatMap((group) =>
    filters[group].map((val) => ({
      group,
      value: val,
      label: allOptions[group].find((o) => o.value === val)?.label ?? val,
    }))
  );

  if (allActive.length === 0 && !search) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/20 bg-primary-muted px-3 py-2">
      {search && (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary-muted px-2.5 py-0.5 text-xs font-semibold text-primary">
          "{search}"
          <button onClick={onClearSearch} className="flex size-4 items-center justify-center rounded-full bg-primary/20 text-primary hover:bg-primary hover:text-white">
            <X className="size-2.5" />
          </button>
        </span>
      )}
      {allActive.map(({ group, value, label }) => (
        <span key={`${group}-${value}`} className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary-muted px-2.5 py-0.5 text-xs font-semibold text-primary">
          {label}
          <button onClick={() => onRemove(group, value)} className="flex size-4 items-center justify-center rounded-full bg-primary/20 text-primary hover:bg-primary hover:text-white">
            <X className="size-2.5" />
          </button>
        </span>
      ))}
      <button onClick={onClearAll} className="ml-auto text-xs text-muted-foreground underline hover:text-primary">
        Clear all
      </button>
    </div>
  );
}

/* ── Dismissed event card — mirrors the Detection Feed EventCard layout ── */

function DismissedRow({
  item,
  onOpen,
}: {
  item: DismissedEvent;
  onOpen: (id: string) => void;
}) {
  const { event } = item;

  return (
    <div
      onClick={() => onOpen(event.id)}
      className={cn(
        "relative grid cursor-pointer rounded-xl border border-l-[3px] bg-card p-3.5 opacity-80 transition-all hover:bg-muted/30 hover:opacity-100",
        "grid-cols-[140px_1fr] gap-3",
        "sm:grid-cols-[140px_1fr_auto] sm:gap-4"
      )}
      style={{ borderLeftColor: `var(--sev-${event.severity})` }}
    >
      {/* Thumbnail with bounding boxes — same as Detection Feed */}
      <div className="self-start">
        <div className="relative h-[90px] w-[140px] flex-shrink-0 overflow-hidden rounded-md bg-[linear-gradient(135deg,#2a1a0e_0%,#1a1a1a_100%)]">
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
                  "absolute -translate-y-full rounded-sm px-0.5 py-px text-3xs font-semibold text-white",
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
          <span className="absolute bottom-1.5 left-1.5 rounded bg-black/75 px-1 py-px font-mono text-2xs text-white">
            {event.time.slice(0, 5)}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="min-w-0">
        <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
          <SeverityBadge severity={event.severity} />
          <span className="text-base font-semibold text-foreground">{event.typeLabel}</span>
          {/* DISMISSED badge — replaces the "Escalated" badge from the Detection Feed card */}
          <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-3xs font-bold uppercase tracking-wider text-muted-foreground">
            <span className="size-1.5 rounded-full bg-muted-foreground/60" />
            Dismissed
          </span>
          <ReasonChip reason={item.reason} />
          <span
            title={event.useCaseTitle}
            className="cursor-help rounded border border-border bg-muted px-1.5 py-px font-mono text-xs text-muted-foreground hover:border-primary hover:text-primary"
          >
            {event.useCaseId}
          </span>
          <span className="inline-flex items-center gap-1 rounded border border-purple/20 bg-purple-soft px-1.5 py-px font-mono text-2xs text-muted-foreground hover:border-purple hover:text-purple">
            <span className="size-1.5 rounded-full bg-purple" />
            {event.model}
          </span>
        </div>
        <p className="mb-2 text-base leading-relaxed text-muted-foreground">
          {parseEventText(event.summary)}
        </p>
        <div className="flex flex-wrap items-center gap-3.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-2.5" />
            {event.siteDisplay} · {event.areaDisplay} · {event.camera}
          </span>
        </div>
      </div>

      {/* Right rail — dismissed by + when (no action buttons) */}
      <div className="col-span-2 flex items-center justify-end gap-2 border-t border-border/40 pt-2 sm:col-span-1 sm:flex-col sm:items-end sm:self-start sm:border-t-0 sm:pt-0">
        <div className="text-right">
          <p className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground">Dismissed by</p>
          <p className="mt-0.5 text-sm font-medium text-foreground">{item.dismissedBy}</p>
          <p className="mt-0.5 font-mono text-2xs text-muted-foreground">{item.dismissedAtDisplay}</p>
        </div>
      </div>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */

export default function DismissedEventsPage() {
  const navigate = useNavigate();

  const [kpiFilter, setKpiFilter] = React.useState<KpiFilter>("all");
  const [filters, setFilters] = React.useState<DismissedFilters>(EMPTY_DISMISSED_FILTERS);
  const [search, setSearch] = React.useState("");
  const [restoredIds, setRestoredIds] = React.useState<Set<string>>(new Set());
  const [drawerItemId, setDrawerItemId] = React.useState<string | null>(null);
  const [sortBy, setSortBy] = React.useState<"newest" | "oldest">("newest");

  const handleRestore = (id: string) => {
    setRestoredIds((prev) => new Set(prev).add(id));
    setDrawerItemId(null);
    toast.success("Event restored", {
      description: `${id} has been returned to the Detection Feed.`,
    });
  };

  const handleKpiClick = (key: KpiFilter) => {
    setKpiFilter((prev) => (prev === key ? "all" : key));
  };

  function removeFilter(group: keyof DismissedFilters, value: string) {
    setFilters((f) => ({ ...f, [group]: f[group].filter((v) => v !== value) }));
  }

  const baseItems = MOCK_DISMISSED.filter((d) => !restoredIds.has(d.event.id));

  const visible = baseItems.filter((d) => {
    if (kpiFilter === "known-exemption" && d.reason !== "known-exemption") return false;
    if (kpiFilter === "wrong-class" && d.reason !== "wrong-class" && d.reason !== "wrong-person") return false;
    if (kpiFilter === "threshold" && d.reason !== "threshold") return false;
    if (kpiFilter === "other" && d.reason !== "staged" && d.reason !== "other") return false;
    if (filters.reason.length > 0 && !filters.reason.includes(d.reason)) return false;
    if (filters.site.length > 0 && !filters.site.includes(d.event.site)) return false;
    if (filters.area.length > 0 && !filters.area.includes(d.event.area)) return false;
    if (filters.model.length > 0 && !filters.model.includes(d.event.modelKey)) return false;
    if (search) {
      const q = search.toLowerCase();
      const hay = [
        d.event.id, d.event.typeLabel, d.event.siteDisplay,
        d.event.camera, d.event.model, d.dismissedBy, d.notes,
      ].join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  visible.sort((a, b) =>
    sortBy === "newest"
      ? b.dismissedAt.localeCompare(a.dismissedAt)
      : a.dismissedAt.localeCompare(b.dismissedAt)
  );

  const drawerItem = drawerItemId
    ? (MOCK_DISMISSED.find((d) => d.event.id === drawerItemId) ?? null)
    : null;

  const hasFilters = !!(search || Object.values(filters).some((a) => a.length > 0));

  return (
    <div className="flex flex-col gap-4">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <PageHeader>
        <PageHeader.Content>
          <PageHeader.Title>Dismissed Events</PageHeader.Title>
          <PageHeader.Description>
            Events marked as false positives — feedback retrains the detection models.
          </PageHeader.Description>
        </PageHeader.Content>
        <PageHeader.Actions>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-base"
            onClick={() => navigate("/detection-feed")}
          >
            <ArrowLeft className="size-3.5" />
            Back to Detection Feed
          </Button>
        </PageHeader.Actions>
      </PageHeader>

      {/* ── KPI cards ────────────────────────────────────────────────────── */}
      <KpiGrid cols={5}>
        {KPI_CONFIGS.map((cfg) => (
          <KpiCard
            key={cfg.key}
            label={cfg.label}
            value={cfg.getValue(baseItems)}
            sub={cfg.sub}
            accent={cfg.accent}
            active={kpiFilter === cfg.key}
            onClick={() => handleKpiClick(cfg.key)}
          />
        ))}
      </KpiGrid>

      {/* ── Filter panel ─────────────────────────────────────────────────── */}
      <FilterPanel
        filters={filters}
        onChange={setFilters}
        search={search}
        onSearchChange={setSearch}
      />

      {/* ── Active filter pills ───────────────────────────────────────────── */}
      <ActiveFilterBar
        filters={filters}
        search={search}
        onRemove={removeFilter}
        onClearAll={() => { setFilters(EMPTY_DISMISSED_FILTERS); setSearch(""); setKpiFilter("all"); }}
        onClearSearch={() => setSearch("")}
      />

      {/* ── Results bar ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <p className="text-base text-muted-foreground">
            <strong className="text-foreground">{visible.length}</strong> events
            {hasFilters && <span className="ml-1 text-muted-foreground/70">match current filters</span>}
          </p>
          {restoredIds.size > 0 && (
            <span className="flex items-center gap-1.5 text-sm text-success">
              <RotateCcw className="size-3" />
              {restoredIds.size} restored
              <button onClick={() => setRestoredIds(new Set())} className="text-success/60 hover:text-success">
                (undo)
              </button>
            </span>
          )}
        </div>
        <div className="flex-shrink-0">
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Event list ───────────────────────────────────────────────────── */}
      {visible.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-20 text-center text-muted-foreground">
          <ShieldOff className="size-8 opacity-30" />
          <p className="text-sm font-medium">No dismissed events match your filters</p>
          {hasFilters && (
            <button
              className="text-sm text-primary hover:underline"
              onClick={() => { setFilters(EMPTY_DISMISSED_FILTERS); setSearch(""); setKpiFilter("all"); }}
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((item) => (
            <DismissedRow key={item.event.id} item={item} onOpen={setDrawerItemId} />
          ))}
        </div>
      )}

      {/* ── Dismissed event drawer ────────────────────────────────────────── */}
      <DismissedDrawer
        item={drawerItem}
        open={drawerItemId !== null}
        onClose={() => setDrawerItemId(null)}
        onRestore={handleRestore}
      />
    </div>
  );
}
