import * as React from "react";
import { useLocation } from "react-router-dom";
import {
  Search,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  FolderOpen,
  X,
  Check,
  ArrowUpRight,
  MapPin,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/layout/PageHeader";
import { SeverityBadge } from "@/pages/detection-feed/shared";
import { CaseStatusBadge, STATUS_CONFIG } from "@/pages/incident-cases/shared";
import { useIncidentCasesStore } from "@/stores/useIncidentCasesStore";
import { CaseDrawer } from "@/pages/incident-cases/CaseDrawer";
import type { IncidentCase, CaseStatus } from "@/types/incidents";
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

const KPI_CONFIGS = [
  {
    key: "all" as KpiFilter,
    label: "Total Cases",
    barClass: "",
    valueClass: "text-foreground",
    getValue: (cases: IncidentCase[]) => cases.length,
    sub: "All time across all sites",
  },
  {
    key: "open" as KpiFilter,
    label: "Open",
    barClass: "bg-info",
    valueClass: "text-info",
    getValue: (cases: IncidentCase[]) => cases.filter((c) => c.status === "open").length,
    sub: "Awaiting action",
  },
  {
    key: "in-review" as KpiFilter,
    label: "In Review",
    barClass: "bg-sev-medium",
    valueClass: "text-sev-medium",
    getValue: (cases: IncidentCase[]) => cases.filter((c) => c.status === "in-review").length,
    sub: "Under investigation",
  },
  {
    key: "action-taken" as KpiFilter,
    label: "Action Taken",
    barClass: "bg-purple",
    valueClass: "text-purple",
    getValue: (cases: IncidentCase[]) => cases.filter((c) => c.status === "action-taken").length,
    sub: "Mitigation underway",
  },
  {
    key: "closed" as KpiFilter,
    label: "Closed",
    barClass: "bg-success",
    valueClass: "text-success",
    getValue: (cases: IncidentCase[]) => cases.filter((c) => c.status === "closed").length,
    sub: "Resolved cases",
  },
  {
    key: "critical" as KpiFilter,
    label: "Critical",
    barClass: "bg-sev-critical",
    valueClass: "text-sev-critical",
    getValue: (cases: IncidentCase[]) =>
      cases.filter((c) => c.severity === "critical").length,
    sub: "Immediate threat",
  },
];

function KpiCard({
  config,
  cases,
  active,
  onClick,
}: {
  config: (typeof KPI_CONFIGS)[0];
  cases: IncidentCase[];
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-xl border bg-card px-4 py-3.5 text-left transition-all hover:border-primary hover:-translate-y-px",
        active ? "border-primary bg-primary-muted" : "border-border"
      )}
    >
      {active && (
        <span className="absolute right-2.5 top-1.5 text-[9px] font-bold uppercase tracking-wider text-primary">
          Active Filter
        </span>
      )}
      <div className={cn("absolute inset-x-0 top-0 h-0.5", config.barClass || "bg-border/50")} />
      <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {config.label}
      </div>
      <div className={cn("text-[26px] font-bold leading-none", config.valueClass)}>
        {config.getValue(cases)}
      </div>
      <div className="mt-1 text-[11px] text-muted-foreground">{config.sub}</div>
    </button>
  );
}

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
        <button
          className={cn(
            "flex w-full items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2 text-[13px] transition-colors hover:border-primary",
            open ? "border-primary" : "border-border",
            hasValue ? "text-primary" : "text-muted-foreground"
          )}
        >
          <span className="truncate font-medium">{displayLabel}</span>
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
                {checked && <Check className="size-2.5 text-primary-foreground" strokeWidth={3} />}
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

/* ─── Filter panel ───────────────────────────────────────────────────────── */

const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "in-review", label: "In Review" },
  { value: "action-taken", label: "Action Taken" },
  { value: "closed", label: "Closed" },
] as const;

const SEVERITY_OPTIONS = [
  { value: "critical", label: "Critical", color: "var(--sev-critical)" },
  { value: "medium", label: "Medium", color: "var(--sev-medium)" },
  { value: "low", label: "Low", color: "var(--sev-low)" },
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
}: {
  filters: CaseFilters;
  onChange: (f: CaseFilters) => void;
  search: string;
  onSearchChange: (v: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const filterCount = Object.values(filters).reduce((sum, arr) => sum + arr.length, 0);
  const activeCount = filterCount + (search ? 1 : 0);

  function setGroup(group: keyof CaseFilters, values: string[]) {
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
          <span className="text-[13px] font-semibold text-foreground">Filters</span>
          {activeCount > 0 ? (
            <span className="rounded-full bg-primary px-2 py-px text-[11px] font-semibold text-primary-foreground">
              {activeCount} active
            </span>
          ) : (
            <div className="hidden flex-wrap gap-1.5 sm:flex">
              {["All severities", "All sites"].map((l) => (
                <span
                  key={l}
                  className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-[11px] text-muted-foreground"
                >
                  {l}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {activeCount > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onChange(EMPTY_FILTERS);
                onSearchChange("");
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
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by case ID, title or assignee..."
              className="h-9 w-full pl-9 text-[13px]"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(
              [
                { key: "severity" as const, label: "Severity", opts: SEVERITY_OPTIONS },
                { key: "site" as const, label: "Site", opts: SITE_OPTIONS },
              ] as const
            ).map(({ key, label, opts }) => (
              <div key={key}>
                <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
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

/* ─── Active filter pills ────────────────────────────────────────────────── */

function ActiveFilterBar({
  filters,
  onRemoveFilter,
  onClearAll,
}: {
  filters: CaseFilters;
  onRemoveFilter: (group: keyof CaseFilters, value: string) => void;
  onClearAll: () => void;
}) {
  const allOptions = {
    status: STATUS_OPTIONS as readonly { value: string; label: string }[],
    severity: SEVERITY_OPTIONS as readonly { value: string; label: string }[],
    site: SITE_OPTIONS as readonly { value: string; label: string }[],
  };

  const allActive = (Object.keys(filters) as (keyof CaseFilters)[]).flatMap((group) =>
    (filters[group] as string[]).map((val) => ({
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

/* ─── Table row ──────────────────────────────────────────────────────────── */

function CaseRow({ c, onClick }: { c: IncidentCase; onClick: () => void }) {
  return (
    <tr
      onClick={onClick}
      style={{ boxShadow: `inset 3px 0 0 var(--sev-${c.severity})` }}
      className="group cursor-pointer text-[13px] transition-colors hover:bg-muted/20"
    >
      <td className="px-4 py-3">
        <span className="font-mono text-[12px] font-semibold text-muted-foreground transition-colors group-hover:text-primary">
          {c.id}
        </span>
      </td>

      <td className="max-w-[260px] px-4 py-3">
        <div className="line-clamp-2 text-[13px] font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
          {c.title}
        </div>
        <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
          <MapPin className="size-2.5 flex-shrink-0" />
          {c.siteDisplay}
        </div>
      </td>

      <td className="px-4 py-3 text-center">
        <span className="inline-flex size-6 items-center justify-center rounded-full bg-muted text-[12px] font-bold text-foreground">
          {c.incidentIds.length}
        </span>
      </td>

      <td className="px-4 py-3">
        <SeverityBadge severity={c.severity} />
      </td>

      <td className="px-4 py-3">
        <CaseStatusBadge status={c.status} />
      </td>

      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex size-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
            {c.assignedTo.name.charAt(0)}
          </div>
          <div>
            <div className="text-[13px] font-medium text-foreground">{c.assignedTo.name}</div>
            <div className="font-mono text-[11px] text-muted-foreground">{c.assignedTo.id}</div>
          </div>
        </div>
      </td>

      <td className="whitespace-nowrap px-4 py-3">
        <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
          <Calendar className="size-3 flex-shrink-0" />
          {c.createdAtDisplay}
        </div>
      </td>

      <td className="px-4 py-3">
        <ArrowUpRight className="size-4 text-muted-foreground/40 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
      </td>
    </tr>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function IncidentCasesPage() {
  const location = useLocation();
  const cases = useIncidentCasesStore((s) => s.cases);

  const [kpiFilter, setKpiFilter] = React.useState<KpiFilter>("all");
  const [filters, setFilters] = React.useState<CaseFilters>(EMPTY_FILTERS);
  const [search, setSearch] = React.useState("");
  const [sortBy, setSortBy] = React.useState<"newest" | "severity" | "status">("newest");
  const [datePreset, setDatePreset] = React.useState<"all" | "today" | "week" | "month" | "custom">("all");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");
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

    const SEV_ORDER: Record<string, number> = { critical: 0, medium: 1, low: 2 };
    const STA_ORDER: Record<string, number> = { open: 0, "in-review": 1, "action-taken": 2, closed: 3 };

    if (sortBy === "severity") list.sort((a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity]);
    else if (sortBy === "status") list.sort((a, b) => STA_ORDER[a.status] - STA_ORDER[b.status]);
    else list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return list;
  }, [cases, kpiFilter, filters, search, sortBy, datePreset, dateFrom, dateTo]);

  function removeFilter(group: keyof CaseFilters, value: string) {
    setFilters((f) => ({ ...f, [group]: (f[group] as string[]).filter((v) => v !== value) }));
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader>
        <PageHeader.Content>
          <PageHeader.Title>Incident Cases</PageHeader.Title>
          <PageHeader.Description>
            Track, investigate, and close AI-flagged security incidents across all sites.
          </PageHeader.Description>
        </PageHeader.Content>
      </PageHeader>

      {/* ── KPI cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        {KPI_CONFIGS.map((cfg) => (
          <KpiCard
            key={cfg.key}
            config={cfg}
            cases={cases}
            active={kpiFilter === cfg.key}
            onClick={() => setKpiFilter((prev) => (prev === cfg.key ? "all" : cfg.key))}
          />
        ))}
      </div>

      {/* Date filter row (outside Filters panel) */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2">
        <span className="mr-1 inline-flex items-center gap-1.5 text-[12px] font-semibold text-muted-foreground">
          <Calendar className="size-3.5" />
          Date Range
        </span>
        {([
          { key: "all" as const,   label: "All time" },
          { key: "today" as const, label: "Today" },
          { key: "week" as const,  label: "This Week" },
          { key: "month" as const, label: "This Month" },
          { key: "custom" as const, label: "Custom Date" },
        ]).map((p) => (
          <button
            key={p.key}
            onClick={() => { setDatePreset(p.key); if (p.key !== "custom") { setDateFrom(""); setDateTo(""); } }}
            className={cn(
              "rounded-md border px-2.5 py-1 text-[12px] font-semibold transition-colors",
              datePreset === p.key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
            )}
          >
            {p.label}
          </button>
        ))}
        {datePreset === "custom" && (
          <div className="ml-1 flex items-center gap-1.5">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              max={dateTo || undefined}
              className="h-7 rounded-md border border-input bg-background px-2 text-[12px] text-foreground focus:border-primary focus:outline-none"
            />
            <span className="text-[12px] text-muted-foreground">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              min={dateFrom || undefined}
              className="h-7 rounded-md border border-input bg-background px-2 text-[12px] text-foreground focus:border-primary focus:outline-none"
            />
          </div>
        )}
        {(datePreset !== "all" || dateFrom || dateTo) && (
          <button
            onClick={() => { setDatePreset("all"); setDateFrom(""); setDateTo(""); }}
            className="ml-auto text-[11px] text-muted-foreground underline hover:text-primary"
          >
            Clear
          </button>
        )}
      </div>

      <ActiveFilterBar
        filters={filters}
        onRemoveFilter={removeFilter}
        onClearAll={() => setFilters(EMPTY_FILTERS)}
      />

      <FilterPanel
        filters={filters}
        onChange={setFilters}
        search={search}
        onSearchChange={setSearch}
      />

      {/* ── Table header bar ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-1">
        <p className="text-[13px] text-muted-foreground">
          <strong className="text-foreground">{filtered.length}</strong> case
          {filtered.length !== 1 ? "s" : ""} match current filters
        </p>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="rounded-md border border-border bg-card px-2.5 py-1.5 text-[12px] text-foreground focus:border-primary focus:outline-none"
        >
          <option value="newest">Newest first</option>
          <option value="severity">Severity (high → low)</option>
          <option value="status">By status</option>
        </select>
      </div>

      {/* ── Table ────────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-20 text-muted-foreground">
          <FolderOpen className="size-10 opacity-20" />
          <p className="text-sm">No cases match the current filters.</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilters(EMPTY_FILTERS);
              setKpiFilter("all");
              setSearch("");
            }}
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse">
              <thead className="bg-muted/30">
                <tr className="border-b border-border text-left">
                  {[
                    { label: "CASE ID" },
                    { label: "TITLE / SITE" },
                    { label: "EVENTS", center: true },
                    { label: "SEVERITY" },
                    { label: "STATUS" },
                    { label: "ASSIGNED TO" },
                    { label: "CREATED" },
                    { label: "" },
                  ].map(({ label, center }, i) => (
                    <th
                      key={i}
                      className={cn(
                        "px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60",
                        center && "text-center"
                      )}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filtered.map((c) => (
                  <CaseRow key={c.id} c={c} onClick={() => setDrawerCaseId(c.id)} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <CaseDrawer caseId={drawerCaseId} onClose={() => setDrawerCaseId(null)} />
    </div>
  );
}
