import * as React from "react";
import { useLocation } from "react-router-dom";
import {
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  FolderOpen,
  Check,
  ArrowUpRight,
  MapPin,
  Calendar,
} from "lucide-react";
import { Button } from "@accel/ui/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@accel/ui/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@accel/ui/components/ui/select";
import { cn } from "@accel/ui/lib/utils";
import { PageHeader } from "@accel/ui/components/layout/PageHeader";
import { SeverityBadge } from "@/pages/detection-feed/shared";
import { CaseStatusBadge } from "@/pages/incident-cases/shared";
import { STATUS_CONFIG } from "@/pages/incident-cases/shared-data";
import { useIncidentCasesStore } from "@/stores/useIncidentCasesStore";
import { CaseDrawer } from "@/pages/incident-cases/CaseDrawer";
import { TruncatedText } from "@accel/ui/components/shared/TruncatedText";
import { ToolbarSearch } from "@accel/ui/components/shared/Toolbar";
import { EmptyState } from "@accel/ui/components/shared/EmptyState";
import { ListLoadingState, ListErrorState } from "@accel/ui/components/shared/PageStates";
import type { IncidentCase, CaseStatus } from "@/types/incidents";

/** Prototype hook — forces the page's data-state (loading / empty / error). */
export type CasesForcedState = "normal" | "loading" | "empty" | "error";
import type { Severity } from "@/types/detection";

export { CaseStatusBadge, STATUS_CONFIG };

/* ─── Types ──────────────────────────────────────────────────────────────── */

type KpiFilter = "all" | "open" | "in-review" | "action-taken" | "closed" | "critical";

interface CaseFilters {
  status: CaseStatus[];
  severity: Severity[];
  site: string[];
}

const EMPTY_FILTERS: CaseFilters = { status: [], severity: [], site: [] };

/* ─── KPI cards ──────────────────────────────────────────────────────────── */

import { KpiCard, KpiGrid, type KpiTone } from "@accel/ui/components/shared/KpiCard";
import { DateRangeBar } from "@accel/ui/components/shared/DateRangeBar";
import { ItemButton } from "@accel/ui/components/ui/item";
import { DataTable, type DataTableColumn } from "@accel/ui/components/shared/DataTable";

const KPI_CONFIGS: {
  key: KpiFilter;
  label: string;
  accent: KpiTone;
  getValue: (cases: IncidentCase[]) => number;
  sub: string;
}[] = [
  { key: "all",          label: "Total Cases",  accent: "primary",      getValue: (c) => c.length,                                       sub: "All time across all sites" },
  { key: "open",         label: "Open",         accent: "info",         getValue: (c) => c.filter((x) => x.status === "open").length,         sub: "Awaiting action" },
  { key: "in-review",    label: "In Review",    accent: "severity-medium",   getValue: (c) => c.filter((x) => x.status === "in-review").length,    sub: "Under investigation" },
  { key: "action-taken", label: "Action Taken", accent: "violet",       getValue: (c) => c.filter((x) => x.status === "action-taken").length, sub: "Mitigation underway" },
  { key: "closed",       label: "Closed",       accent: "success",      getValue: (c) => c.filter((x) => x.status === "closed").length,       sub: "Resolved cases" },
  { key: "critical",     label: "Critical",     accent: "severity-critical", getValue: (c) => c.filter((x) => x.severity === "critical").length,   sub: "Immediate threat" },
];

/* ─── Filter dropdown ────────────────────────────────────────────────────── */

function FilterDropdown({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: readonly { value: string; label: string; color?: string }[];
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
    onChange(
      selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <ItemButton
          variant="plain"
          className={cn(
            "justify-between gap-2 rounded-lg border bg-card px-3 py-2 text-base transition-colors hover:border-primary hover:bg-card",
            open ? "border-primary" : "border-border",
            hasValue ? "text-primary-ink" : "text-muted-foreground"
          )}
        >
          <TruncatedText text={displayLabel} className="font-medium" />
          <ChevronDown
            className={cn(
              "size-3.5 flex-shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180"
            )}
          />
        </ItemButton>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-52 p-1.5">
        {options.map((opt) => {
          const checked = selected.includes(opt.value);
          return (
            <ItemButton
              variant="plain"
              key={opt.value}
              onClick={() => toggle(opt.value)}
              className="gap-2 rounded px-2 py-1.5 text-base text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <div
                className={cn(
                  "flex size-3.5 flex-shrink-0 items-center justify-center rounded border transition-colors",
                  checked ? "border-primary bg-primary" : "border-muted-foreground/40"
                )}
              >
                {checked && <Check className="size-2.5 text-primary-foreground" strokeWidth={3} />}
              </div>
              {opt.color && (
                <span
                  className="size-1.5 flex-shrink-0 rounded-full"
                  style={{ background: opt.color }}
                />
              )}
              {opt.label}
            </ItemButton>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

/* ─── Filter panel ───────────────────────────────────────────────────────── */

const SEVERITY_OPTIONS = [
  { value: "critical", label: "Critical", color: "var(--severity-critical)" },
  { value: "medium", label: "Medium", color: "var(--severity-medium)" },
  { value: "low", label: "Low", color: "var(--severity-low)" },
] as const;

const SITE_OPTIONS = [
  { value: "fedex", label: "FedEx Changi" },
  { value: "sembawang", label: "Sembawang Naval" },
  { value: "astra", label: "Astra HQ" },
  { value: "ptc", label: "PTC Site Camp" },
  { value: "kranji", label: "Kranji Logistics Hub" },
  { value: "tuas", label: "Tuas Port Terminal" },
] as const;

function FilterPanel({
  filters,
  onChange,
  search,
  onSearchChange,
  additionalActiveCount = 0,
}: {
  filters: CaseFilters;
  onChange: (f: CaseFilters) => void;
  search: string;
  onSearchChange: (v: string) => void;
  additionalActiveCount?: number;
}) {
  const [open, setOpen] = React.useState(false);
  const filterCount = Object.values(filters).reduce((sum, arr) => sum + arr.length, 0);
  const activeCount = filterCount + (search ? 1 : 0) + additionalActiveCount;

  function setGroup(group: keyof CaseFilters, values: string[]) {
    onChange({ ...filters, [group]: values });
  }

  return (
    <div data-slot="incident-cases-filter-panel" className="rounded-xl border border-border bg-card">
      <div
        className="flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-muted/30"
      >
        <ItemButton variant="plain" type="button" onClick={() => setOpen((v) => !v)} className="min-w-0 flex-1 gap-2.5 hover:bg-transparent">
          <SlidersHorizontal className="size-4 flex-shrink-0 text-muted-foreground" />
          <span className="text-base font-semibold text-foreground">Filters</span>
          {activeCount > 0 ? (
            <span className="rounded-full bg-primary-fill px-2 py-px text-xs font-semibold text-primary-foreground">
              {activeCount} active
            </span>
          ) : (
            <div className="hidden flex-wrap gap-1.5 sm:flex">
              {["All severities", "All sites"].map((l) => (
                <span
                  key={l}
                  className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
                >
                  {l}
                </span>
              ))}
            </div>
          )}
        </ItemButton>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-xs" className="size-auto border-0 p-0 hover:bg-transparent dark:hover:bg-transparent" type="button" aria-label={open ? "Collapse filters" : "Expand filters"} onClick={() => setOpen((v) => !v)}>
            {open ? (
              <ChevronUp className="size-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="size-4 text-muted-foreground" />
            )}
          </Button>
        </div>
      </div>

      {open && (
        <div data-slot="incident-cases-filter-panel-body" className="space-y-3 rounded-b-xl border-t border-border bg-background px-4 py-4">
          <ToolbarSearch value={search} onChange={onSearchChange} placeholder="Search by case ID, title or assignee..." className="sm:w-full" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(
              [
                { key: "severity" as const, label: "Severity", opts: SEVERITY_OPTIONS },
                { key: "site" as const, label: "Site", opts: SITE_OPTIONS },
              ] as const
            ).map(({ key, label, opts }) => (
              <div key={key}>
                <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {label}
                </div>
                <FilterDropdown
                  label={`All ${label.toLowerCase()}s`}
                  options={opts}
                  selected={filters[key] as string[]}
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

/* ─── Table columns ─────────────────────────────────────────────────────────── */

/** Severity accent stripe on the row's left edge. */
const SEVERITY_STRIPE: Record<IncidentCase["severity"], string> = {
  critical: "shadow-[inset_3px_0_0_var(--severity-critical)]",
  medium: "shadow-[inset_3px_0_0_var(--severity-medium)]",
  low: "shadow-[inset_3px_0_0_var(--severity-low)]",
};

const CASE_COLUMNS: DataTableColumn<IncidentCase>[] = [
  {
    key: "id",
    header: "CASE ID",
    cell: (c) => (
      <span className="font-mono text-sm font-semibold text-muted-foreground transition-colors group-hover:text-primary-ink">
        {c.id}
      </span>
    ),
  },
  {
    key: "title",
    header: "TITLE / SITE",
    className: "max-w-[260px]",
    headClassName: "",
    cell: (c) => (
      <>
        <TruncatedText
          text={c.title}
          className="line-clamp-2 text-base font-semibold leading-snug text-foreground transition-colors group-hover:text-primary-ink"
        />
        <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="size-2.5 flex-shrink-0" />
          {c.siteDisplay}
        </div>
      </>
    ),
  },
  {
    key: "events",
    header: "EVENTS",
    align: "center",
    cell: (c) => (
      <span className="inline-flex size-6 items-center justify-center rounded-full bg-muted text-sm font-bold text-foreground">
        {c.incidentIds.length}
      </span>
    ),
  },
  { key: "severity", header: "SEVERITY", cell: (c) => <SeverityBadge severity={c.severity} /> },
  { key: "status", header: "STATUS", cell: (c) => <CaseStatusBadge status={c.status} /> },
  {
    key: "assignee",
    header: "ASSIGNED TO",
    cell: (c) => (
      <div className="flex items-center gap-2">
        <div className="flex size-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-2xs font-bold text-primary-ink">
          {c.assignedTo.name.charAt(0)}
        </div>
        <div>
          <div className="text-base font-medium text-foreground">{c.assignedTo.name}</div>
          <div className="font-mono text-xs text-muted-foreground">{c.assignedTo.id}</div>
        </div>
      </div>
    ),
  },
  {
    key: "created",
    header: "CREATED",
    className: "whitespace-nowrap",
    headClassName: "",
    cell: (c) => (
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Calendar className="size-3 flex-shrink-0" />
        {c.createdAtDisplay}
      </div>
    ),
  },
  {
    key: "open",
    header: <span className="sr-only">Open case</span>,
    cell: () => (
      <ArrowUpRight className="size-4 text-muted-foreground/40 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary-ink" />
    ),
  },
];

/* ─── Page ───────────────────────────────────────────────────────────────── */

/* Stable empty list for the forced-empty prototype view (keeps memo deps stable). */
const NO_CASES: IncidentCase[] = [];

export default function IncidentCasesPage({
  forcedState = "normal",
  onRetry,
}: {
  forcedState?: CasesForcedState;
  onRetry?: () => void;
} = {}) {
  const location = useLocation();
  const storeCases = useIncidentCasesStore((s) => s.cases);
  // Prototype-only: force a zero-data view without touching the store.
  const cases = forcedState === "empty" ? NO_CASES : storeCases;

  const [kpiFilter, setKpiFilter] = React.useState<KpiFilter>("all");
  const [filters, setFilters] = React.useState<CaseFilters>(EMPTY_FILTERS);
  const [search, setSearch] = React.useState("");
  const [sortBy, setSortBy] = React.useState<"newest" | "oldest" | "duration">("newest");
  const [datePreset, setDatePreset] = React.useState<"all" | "today" | "week" | "month" | "custom">("all");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");

  const hasActiveFilters =
    search.trim().length > 0 ||
    kpiFilter !== "all" ||
    datePreset !== "all" ||
    dateFrom !== "" ||
    dateTo !== "" ||
    Object.values(filters).some((arr) => arr.length > 0);

  const clearAll = () => {
    setFilters(EMPTY_FILTERS);
    setSearch("");
    setKpiFilter("all");
    setDatePreset("all");
    setDateFrom("");
    setDateTo("");
  };

  const [drawerCaseId, setDrawerCaseId] = React.useState<string | null>(
    (location.state as { openCaseId?: string } | null)?.openCaseId ?? null
  );

  const filtered = React.useMemo(() => {
    let list = [...cases];

    if (kpiFilter === "open") list = list.filter((c) => c.status === "open");
    else if (kpiFilter === "in-review")
      list = list.filter((c) => c.status === "in-review");
    else if (kpiFilter === "action-taken")
      list = list.filter((c) => c.status === "action-taken");
    else if (kpiFilter === "closed")
      list = list.filter((c) => c.status === "closed");
    else if (kpiFilter === "critical")
      list = list.filter((c) => c.severity === "critical");

    if (filters.status.length > 0)
      list = list.filter((c) => (filters.status as string[]).includes(c.status));
    if (filters.severity.length > 0)
      list = list.filter((c) => (filters.severity as string[]).includes(c.severity));
    if (filters.site.length > 0)
      list = list.filter((c) => (filters.site as string[]).includes(c.site));

    // Date filter
    if (datePreset !== "all") {
      const refNow = new Date("2026-05-25T10:00:00").getTime();
      list = list.filter((c) => {
        const ts = new Date(c.createdAt).getTime();
        if (datePreset === "today") {
          return ts >= refNow - 24 * 60 * 60 * 1000;
        }
        if (datePreset === "week") {
          return ts >= refNow - 7 * 24 * 60 * 60 * 1000;
        }
        if (datePreset === "month") {
          return ts >= refNow - 30 * 24 * 60 * 60 * 1000;
        }
        if (datePreset === "custom") {
          if (dateFrom && ts < new Date(dateFrom + "T00:00:00").getTime()) return false;
          if (dateTo && ts > new Date(dateTo + "T23:59:59").getTime()) return false;
        }
        return true;
      });
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.id.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.siteDisplay.toLowerCase().includes(q) ||
          c.assignedTo.name.toLowerCase().includes(q)
      );
    }

    // How long a case has run: created → last update. Cases carry no duration field.
    const durationMs = (c: IncidentCase) => new Date(c.updatedAt).getTime() - new Date(c.createdAt).getTime();
    const newestFirst = (a: IncidentCase, b: IncidentCase) => b.createdAt.localeCompare(a.createdAt);

    if (sortBy === "oldest") list.sort((a, b) => newestFirst(b, a));
    else if (sortBy === "duration") list.sort((a, b) => durationMs(b) - durationMs(a) || newestFirst(a, b));
    else list.sort(newestFirst);

    return list;
  }, [cases, kpiFilter, filters, search, sortBy, datePreset, dateFrom, dateTo]);

  return (
    <div data-slot="incident-cases-page" className="flex flex-col gap-4">
      <PageHeader>
        <PageHeader.Content>
          <PageHeader.Title>Incident Cases</PageHeader.Title>
        </PageHeader.Content>
      </PageHeader>

      {forcedState === "loading" ? (
        <ListLoadingState kpiCols={6} columns={8} />
      ) : forcedState === "error" ? (
        <ListErrorState onRetry={onRetry} title="Couldn't load incident cases" />
      ) : (
        <>
      {/* ── KPI cards ────────────────────────────────────────────────────── */}
      <KpiGrid cols={6}>
        {KPI_CONFIGS.map((cfg) => (
          <KpiCard
            key={cfg.key}
            label={cfg.label}
            value={cfg.getValue(cases)}
            sub={cfg.sub}
            tone={cfg.accent}
            active={cfg.key !== "all" && kpiFilter === cfg.key}
            onClick={() => setKpiFilter((prev) => (prev === cfg.key ? "all" : cfg.key))}
          />
        ))}
      </KpiGrid>

      {/* Date filter row */}
      <DateRangeBar
        presets={[
          { key: "all",   label: "All time" },
          { key: "today", label: "Today" },
          { key: "week",  label: "This Week" },
          { key: "month", label: "This Month" },
        ]}
        active={datePreset}
        onSelect={(k) => { setDatePreset(k as typeof datePreset); if (k !== "custom") { setDateFrom(""); setDateTo(""); } }}
        customFrom={dateFrom}
        customTo={dateTo}
        onCustomChange={(f, t) => { setDateFrom(f); setDateTo(t); }}
        onCustomApply={(f, t) => { setDateFrom(f); setDateTo(t); }}
        onCustomReset={() => { setDatePreset("all"); setDateFrom(""); setDateTo(""); }}
      />

      <FilterPanel
        filters={filters}
        onChange={setFilters}
        search={search}
        onSearchChange={setSearch}
        additionalActiveCount={(kpiFilter !== "all" ? 1 : 0) + (datePreset !== "all" ? 1 : 0)}
      />

      {/* ── Table header bar ─────────────────────────────────────────────── */}
      <div data-slot="incident-cases-page-toolbar" className="flex items-center justify-between px-1">
        <p className="text-base text-muted-foreground">
          <strong className="text-foreground">{filtered.length}</strong> case
          {filtered.length !== 1 ? "s" : ""} match current filters
          {hasActiveFilters && (
            <Button
              variant="link"
              onClick={clearAll}
              className="ml-2 h-auto border-0 p-0 text-base font-normal text-muted-foreground underline underline-offset-auto hover:text-primary-ink"
            >
              Clear all
            </Button>
          )}
        </p>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
          <SelectTrigger aria-label="Sort cases" className="w-auto text-sm">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="duration">Longest Duration</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ── Table ────────────────────────────────────────────────────────── */}
      {forcedState === "empty" ? (
        <EmptyState
          icon={FolderOpen}
          title="No incident cases yet"
          description="When AI flags a security incident, the case appears here for triage."
          className="rounded-xl border border-dashed border-border"
        />
      ) : filtered.length === 0 ? (
        <div data-slot="incident-cases-page-empty" className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-20 text-muted-foreground">
          <FolderOpen className="size-10 opacity-20" />
          <p className="text-sm">No cases match the current filters.</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilters(EMPTY_FILTERS);
              setKpiFilter("all");
              setSearch("");
              setDatePreset("all");
              setDateFrom("");
              setDateTo("");
            }}
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <div data-slot="incident-cases-page-table" className="overflow-hidden rounded-xl border border-border bg-card">
          <DataTable
            variant="list"
            className="min-w-[860px] border-collapse"
            columns={CASE_COLUMNS}
            data={filtered}
            getRowId={(c) => c.id}
            onRowClick={(c) => setDrawerCaseId(c.id)}
            getRowClassName={(c) => cn("transition-colors", SEVERITY_STRIPE[c.severity])}
          />
        </div>
      )}
        </>
      )}

      <CaseDrawer
        caseId={drawerCaseId}
        onClose={() => setDrawerCaseId(null)}
        forcedState={forcedState}
        onRetry={onRetry}
      />
    </div>
  );
}
