import * as React from "react";
import {
  Search,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Download,
  ScrollText,
  CheckCircle2,
  XCircle,
  Building2,
  SlidersHorizontal,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PageHeader } from "@/components/layout/PageHeader";
import { KpiCard, KpiGrid } from "@/components/shared/KpiCard";
import { DateRangeBar } from "@/components/shared/DateRangeBar";
import { TruncatedText } from "@/components/shared/TruncatedText";
import { cn } from "@/lib/utils";
import { MOCK_ACTIVITY_LOGS, ACTIVITY_KIND_LABELS, ACTIVITY_KIND_STYLES, type ActivityKind, type ActivityLog } from "@/mocks/activityLogs";

/* ── Date range filter ───────────────────────────────────────────────── */

type DateRange = "today" | "7d" | "30d" | "90d" | "all" | "custom";

const DATE_FILTERS: { key: DateRange; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "7d",    label: "7 days" },
  { key: "30d",   label: "30 days" },
  { key: "90d",   label: "90 days" },
  { key: "all",   label: "All time" },
];

function withinRange(log: ActivityLog, range: DateRange, customFrom: string, customTo: string, now: Date): boolean {
  const t = new Date(log.whenAt);
  if (range === "all") return true;
  if (range === "today") {
    return t.toDateString() === now.toDateString();
  }
  if (range === "custom") {
    if (customFrom && t < new Date(customFrom + "T00:00:00")) return false;
    if (customTo && t > new Date(customTo + "T23:59:59")) return false;
    return true;
  }
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return t >= cutoff;
}

/* ── Activity type filter ────────────────────────────────────────────── */

// Activity Type is multi-select — empty array means "all".
const TYPE_OPTIONS: { value: ActivityKind; label: string }[] = (Object.keys(ACTIVITY_KIND_LABELS) as ActivityKind[])
  .map((k) => ({ value: k, label: ACTIVITY_KIND_LABELS[k] }));

/* ── Kind badge (compact for table) ──────────────────────────────────── */

function KindBadge({ kind }: { kind: ActivityKind }) {
  const s = ACTIVITY_KIND_STYLES[kind];
  return (
    <span className={cn("inline-flex items-center rounded px-2 py-0.5 text-2xs font-bold uppercase tracking-wider", s.bg, s.text)}>
      {KIND_TABLE_LABEL[kind] ?? ACTIVITY_KIND_LABELS[kind]}
    </span>
  );
}

const KIND_TABLE_LABEL: Partial<Record<ActivityKind, string>> = {
  case: "Case",
  event: "Event",
  auth: "Auth",
  config: "Config",
  license: "License",
  site: "Site",
  camera: "Camera",
  rule: "Rule",
  model: "Model",
  deployment: "Deploy",
  user: "User",
  analysis: "Analysis",
  "data-access": "Data",
};

/* ── Page ────────────────────────────────────────────────────────────── */

export default function ActivityLogsPage() {
  const [search, setSearch] = React.useState("");
  const [dateRange, setDateRange] = React.useState<DateRange>("30d");
  const [customFrom, setCustomFrom] = React.useState("");
  const [customTo, setCustomTo] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<ActivityKind[]>([]);
  const [siteFilter, setSiteFilter] = React.useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = React.useState(false);

  // Stable "now" for the session
  const now = React.useMemo(() => new Date("2026-06-01T15:00:00"), []);

  const allSites = React.useMemo(() => {
    const set = new Set<string>();
    MOCK_ACTIVITY_LOGS.forEach((l) => l.siteName && set.add(l.siteName));
    return Array.from(set).sort();
  }, []);

  const filtered = React.useMemo(() => {
    return MOCK_ACTIVITY_LOGS.filter((l) => {
      if (!withinRange(l, dateRange, customFrom, customTo, now)) return false;
      if (typeFilter.length > 0 && !typeFilter.includes(l.kind)) return false;
      if (siteFilter.length > 0 && (!l.siteName || !siteFilter.includes(l.siteName))) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = [l.id, l.actor.name, l.text, l.module, l.siteName ?? "", l.ipAddress ?? ""].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [dateRange, customFrom, customTo, typeFilter, siteFilter, search, now]);

  // Counts for the type dropdown options
  const typeCounts = React.useMemo(() => {
    const within = MOCK_ACTIVITY_LOGS.filter((l) =>
      withinRange(l, dateRange, customFrom, customTo, now) &&
      (siteFilter.length === 0 || (l.siteName && siteFilter.includes(l.siteName)))
    );
    const map: Record<string, number> = {};
    for (const l of within) map[l.kind] = (map[l.kind] ?? 0) + 1;
    return map;
  }, [dateRange, customFrom, customTo, siteFilter, now]);

  const totalCount = MOCK_ACTIVITY_LOGS.length;
  const todayCount = MOCK_ACTIVITY_LOGS.filter((l) => withinRange(l, "today", "", "", now)).length;
  const successCount = MOCK_ACTIVITY_LOGS.filter((l) => l.status === "success").length;
  const failedCount = MOCK_ACTIVITY_LOGS.filter((l) => l.status === "failed").length;

  function rangeLabel(): string {
    if (dateRange === "custom") {
      if (customFrom && customTo) return `${customFrom} → ${customTo}`;
      if (customFrom) return `from ${customFrom}`;
      if (customTo) return `to ${customTo}`;
      return "Custom";
    }
    return DATE_FILTERS.find((f) => f.key === dateRange)?.label ?? "";
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader>
        <PageHeader.Content>
          <PageHeader.Title>Activity Log</PageHeader.Title>
          <PageHeader.Description>
            Full activity history for your account. Available to you and your org administrator.
          </PageHeader.Description>
        </PageHeader.Content>
        <PageHeader.Actions>
          <Button variant="outline" className="gap-1.5">
            <Download className="size-3.5" />
            Export CSV
          </Button>
        </PageHeader.Actions>
      </PageHeader>

      {/* KPI strip */}
      <KpiGrid cols={4}>
        <KpiCard label="Total Events" value={totalCount} sub="Audit log entries" accent="primary" />
        <KpiCard label="Today"        value={todayCount} sub="Recorded today"   accent="success" />
        <KpiCard label="Success"      value={successCount} sub="Successful actions" accent="success" />
        <KpiCard label="Failed"       value={failedCount}  sub="Require attention"  accent="sev-critical" />
      </KpiGrid>

      {/* Unified date bar — shared canonical design */}
      <DateRangeBar
        presets={DATE_FILTERS}
        active={dateRange}
        onSelect={(k) => setDateRange(k as DateRange)}
        customFrom={customFrom}
        customTo={customTo}
        onCustomChange={(f, t) => { setCustomFrom(f); setCustomTo(t); }}
        onCustomApply={(f, t) => { setCustomFrom(f); setCustomTo(t); }}
        onCustomReset={() => { setCustomFrom(""); setCustomTo(""); setDateRange("30d"); }}
        showingLabel={
          <>
            Showing <strong className="text-foreground">{rangeLabel()}</strong> ·{" "}
            <strong className="text-foreground">{filtered.length}</strong>{" "}
            event{filtered.length === 1 ? "" : "s"}
          </>
        }
      />

      {/* Filters — collapsible panel (matches all other modules) */}
      <div className="rounded-xl border border-border bg-card">
        <button
          onClick={() => setFiltersOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-muted/30"
        >
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <SlidersHorizontal className="size-4 flex-shrink-0 text-muted-foreground" />
            <span className="text-base font-semibold text-foreground">Filters</span>
            {typeFilter.length + siteFilter.length + (search ? 1 : 0) > 0 ? (
              <span className="rounded-full bg-primary px-2 py-px text-xs font-semibold text-primary-foreground">
                {typeFilter.length + siteFilter.length + (search ? 1 : 0)} active
              </span>
            ) : (
              <div className="hidden flex-wrap gap-1.5 sm:flex">
                {["All types", "All sites"].map((l) => (
                  <span
                    key={l}
                    className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
                  >
                    {l}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {(typeFilter.length > 0 || siteFilter.length > 0 || search) && (
              <button
                onClick={(e) => { e.stopPropagation(); setTypeFilter([]); setSiteFilter([]); setSearch(""); }}
                className="text-sm text-muted-foreground underline hover:text-primary"
              >
                Clear all
              </button>
            )}
            {filtersOpen ? (
              <ChevronUp className="size-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="size-4 text-muted-foreground" />
            )}
          </div>
        </button>

        {filtersOpen && (
          <div className="space-y-3 rounded-b-xl border-t border-border bg-background px-4 py-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search activity…"
                className="h-9 w-full pl-9 text-base"
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</div>
                <TypeFilterDropdown options={TYPE_OPTIONS} selected={typeFilter} counts={typeCounts} onChange={setTypeFilter} />
              </div>
              <div>
                <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Site</div>
                <SiteFilter sites={allSites} selected={siteFilter} onChange={setSiteFilter} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-20 text-muted-foreground">
          <ScrollText className="size-10 opacity-20" />
          <p className="text-sm">No activity events match the current filters.</p>
          <Button variant="outline" onClick={() => { setSearch(""); setDateRange("30d"); setTypeFilter([]); setSiteFilter([]); }}>
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {/* Table header */}
          <div className="grid grid-cols-[140px_90px_90px_1fr_180px] gap-3 border-b border-border bg-muted/30 px-4 py-2.5">
            <p className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground">Date / Time</p>
            <p className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground">Type</p>
            <p className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground">Status</p>
            <p className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground">Description</p>
            <p className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground">Site / Source</p>
          </div>
          {/* Rows */}
          <div>
            {filtered.map((l) => (
              <div key={l.id}
                className="grid grid-cols-[140px_90px_90px_1fr_180px] gap-3 border-b border-border/60 px-4 py-3 last:border-b-0 hover:bg-muted/20">
                <div className="font-mono text-xs text-muted-foreground">{l.whenDisplay}</div>
                <div><KindBadge kind={l.kind} /></div>
                <div>
                  {l.status === "success" ? (
                    <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-2xs font-bold uppercase tracking-wider text-success">
                      <CheckCircle2 className="size-2.5" />
                      Success
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-2xs font-bold uppercase tracking-wider text-sev-critical">
                      <XCircle className="size-2.5" />
                      Failed
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm leading-snug text-foreground">
                    <ActivityText text={l.text} />
                  </p>
                  <p className="mt-0.5 inline-flex items-center gap-2 text-2xs text-muted-foreground/80">
                    <span className="font-semibold">{l.actor.name}</span>
                    <span className="text-muted-foreground/40">·</span>
                    <span>{l.module}</span>
                    {l.ipAddress && (
                      <>
                        <span className="text-muted-foreground/40">·</span>
                        <span className="font-mono">{l.ipAddress}</span>
                      </>
                    )}
                  </p>
                </div>
                <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  {l.siteName === "System" ? (
                    <span className="inline-flex items-center gap-1">
                      <span className="size-1.5 rounded-full bg-muted-foreground/60" />
                      System
                    </span>
                  ) : (
                    <>
                      <Building2 className="mt-0.5 size-3 flex-shrink-0 text-info" />
                      <span className="font-semibold text-foreground">{l.siteName ?? "—"}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center border-t border-border bg-muted/20 px-4 py-3">
            <Button variant="outline" className="gap-1.5">
              <ChevronDown className="size-3.5" />
              Load older entries
            </Button>
          </div>
        </div>
      )}

      {/* unused silencer */}
      <span className="hidden"><X /></span>
    </div>
  );
}

/* ── Activity text auto-formatter — wraps IDs in monospace chips ────── */

function ActivityText({ text }: { text: string }) {
  // Identify ID-like tokens: REC-2026-118, CASE-2026-0142, EVT-2026-0531-014, USR-001, Cam-24, DEP_003, RUL-AM-04
  const re = /\b([A-Z]{2,}[-_][A-Z0-9_-]+)\b/g;
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(re)) {
    const start = m.index ?? 0;
    if (start > last) parts.push(text.slice(last, start));
    parts.push(
      <span key={`${start}-${m[0]}`} className="rounded bg-secondary/10 px-1 py-px font-mono text-2xs font-semibold text-secondary">
        {m[0]}
      </span>
    );
    last = start + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts.map((p, i) => <React.Fragment key={i}>{p}</React.Fragment>)}</>;
}

/* ── Site filter multiselect ─────────────────────────────────────────── */

/* ── Activity Type multi-select dropdown ─────────────────────────────── */

function TypeFilterDropdown({ options, selected, counts, onChange }: {
  options: { value: ActivityKind; label: string }[];
  selected: ActivityKind[];
  counts: Record<string, number>;
  onChange: (v: ActivityKind[]) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const isAll = selected.length === 0;
  const display = isAll
    ? "All types"
    : selected.length === 1 ? options.find((o) => o.value === selected[0])?.label ?? "1 type"
    : `${selected.length} types`;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className={cn(
          "flex w-full items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2 text-base transition-colors hover:border-primary",
          open ? "border-primary" : "border-border",
          isAll ? "text-muted-foreground" : "text-primary"
        )}>
          <span className="inline-flex min-w-0 items-center gap-1.5 font-medium">
            <Layers className="size-3.5 flex-shrink-0" />
            <TruncatedText text={display} className="min-w-0" />
          </span>
          <ChevronDown className={cn("size-3.5 flex-shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="max-h-[300px] w-56 overflow-y-auto p-1.5">
        <button onClick={() => onChange([])}
          className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-base text-muted-foreground hover:bg-muted hover:text-foreground">
          <div className={cn("flex size-3.5 flex-shrink-0 items-center justify-center rounded border transition-colors",
            isAll ? "border-primary bg-primary" : "border-muted-foreground/40")}>
            {isAll && <Check className="size-2.5 text-primary-foreground" strokeWidth={3} />}
          </div>
          All types
        </button>
        <div className="my-1 border-t border-border" />
        {options.map((o) => {
          const checked = selected.includes(o.value);
          const count = counts[o.value] ?? 0;
          return (
            <button key={o.value} onClick={() => onChange(checked ? selected.filter((x) => x !== o.value) : [...selected, o.value])}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-base text-muted-foreground hover:bg-muted hover:text-foreground">
              <div className={cn("flex size-3.5 flex-shrink-0 items-center justify-center rounded border transition-colors",
                checked ? "border-primary bg-primary" : "border-muted-foreground/40")}>
                {checked && <Check className="size-2.5 text-primary-foreground" strokeWidth={3} />}
              </div>
              <span className="flex-1">{o.label}</span>
              <span className="font-mono text-2xs text-muted-foreground/60">{count}</span>
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

/* ── Site multi-select dropdown ──────────────────────────────────────── */

function SiteFilter({ sites, selected, onChange }: { sites: string[]; selected: string[]; onChange: (v: string[]) => void }) {
  const [open, setOpen] = React.useState(false);
  const isAll = selected.length === 0;
  const display = isAll
    ? "All sites"
    : selected.length === 1 ? selected[0]
    : `${selected.length} sites`;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className={cn(
          "flex w-full items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2 text-base transition-colors hover:border-primary",
          open ? "border-primary" : "border-border",
          isAll ? "text-muted-foreground" : "text-primary"
        )}>
          <span className="inline-flex min-w-0 items-center gap-1.5 font-medium">
            <Building2 className="size-3.5 flex-shrink-0" />
            <TruncatedText text={display} className="min-w-0" />
          </span>
          <ChevronDown className={cn("size-3.5 flex-shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="max-h-[280px] w-56 overflow-y-auto p-1.5">
        <button onClick={() => onChange([])}
          className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-base text-muted-foreground hover:bg-muted hover:text-foreground">
          <div className={cn("flex size-3.5 flex-shrink-0 items-center justify-center rounded border transition-colors",
            isAll ? "border-primary bg-primary" : "border-muted-foreground/40")}>
            {isAll && <Check className="size-2.5 text-primary-foreground" strokeWidth={3} />}
          </div>
          All sites
        </button>
        <div className="my-1 border-t border-border" />
        {sites.map((s) => {
          const checked = selected.includes(s);
          return (
            <button key={s} onClick={() => onChange(checked ? selected.filter((x) => x !== s) : [...selected, s])}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-base text-muted-foreground hover:bg-muted hover:text-foreground">
              <div className={cn("flex size-3.5 flex-shrink-0 items-center justify-center rounded border transition-colors",
                checked ? "border-primary bg-primary" : "border-muted-foreground/40")}>
                {checked && <Check className="size-2.5 text-primary-foreground" strokeWidth={3} />}
              </div>
              {s}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}
