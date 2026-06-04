import * as React from "react";
import {
  Search,
  ChevronDown,
  Check,
  X,
  Download,
  ScrollText,
  Calendar,
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
    <span className={cn("inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", s.bg, s.text)}>
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
  const [customOpen, setCustomOpen] = React.useState(false);
  const [typeFilter, setTypeFilter] = React.useState<ActivityKind[]>([]);
  const [siteFilter, setSiteFilter] = React.useState<string[]>([]);

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

      {/* Unified date + filters bar (mirrors Detection Feed pattern) */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2">
        <span className="mr-1 inline-flex items-center gap-1.5 text-[12px] font-semibold text-muted-foreground">
          <Calendar className="size-3.5" />
          Date
        </span>
        {DATE_FILTERS.map((f) => {
          const active = dateRange === f.key;
          return (
            <button key={f.key} onClick={() => setDateRange(f.key)}
              className={cn(
                "rounded-full border px-3 py-1 text-[12px] font-semibold transition-colors",
                active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
              )}>
              {f.label}
            </button>
          );
        })}
        <Popover open={customOpen} onOpenChange={setCustomOpen}>
          <PopoverTrigger asChild>
            <button onClick={() => setDateRange("custom")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-semibold transition-colors",
                dateRange === "custom" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
              )}>
              <Calendar className="size-3" />
              Custom date
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-72 p-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Custom range</p>
            <div className="space-y-2">
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">From</label>
                <Input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="h-8 text-[12px]" />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">To</label>
                <Input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="h-8 text-[12px]" />
              </div>
              <div className="flex justify-end gap-1.5">
                <Button variant="ghost" size="sm" onClick={() => { setCustomFrom(""); setCustomTo(""); setDateRange("30d"); setCustomOpen(false); }}>
                  Reset
                </Button>
                <Button size="sm" onClick={() => setCustomOpen(false)}>Apply</Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        <span className="ml-auto text-[11px] text-muted-foreground">
          Showing <strong className="text-foreground">{rangeLabel()}</strong> · <strong className="text-foreground">{filtered.length}</strong> event{filtered.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* Filters row (mirrors Detection Feed / Recordings pattern) */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5">
        <SlidersHorizontal className="size-4 flex-shrink-0 text-muted-foreground" />
        <span className="text-[12px] font-semibold text-foreground">Filters</span>
        <div className="ml-1 flex flex-wrap items-center gap-2">
          <TypeFilterDropdown options={TYPE_OPTIONS} selected={typeFilter} counts={typeCounts} onChange={setTypeFilter} />
          <SiteFilter sites={allSites} selected={siteFilter} onChange={setSiteFilter} />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative w-56">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search activity…"
              className="h-8 w-full pl-9 text-[12px]" />
          </div>
          {(typeFilter.length > 0 || siteFilter.length > 0 || search) && (
            <Button variant="ghost" size="sm" onClick={() => { setTypeFilter([]); setSiteFilter([]); setSearch(""); }}>
              Clear
            </Button>
          )}
        </div>
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
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Date / Time</p>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Type</p>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Status</p>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Description</p>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Site / Source</p>
          </div>
          {/* Rows */}
          <div>
            {filtered.map((l) => (
              <div key={l.id}
                className="grid grid-cols-[140px_90px_90px_1fr_180px] gap-3 border-b border-border/60 px-4 py-3 last:border-b-0 hover:bg-muted/20">
                <div className="font-mono text-[11px] text-muted-foreground">{l.whenDisplay}</div>
                <div><KindBadge kind={l.kind} /></div>
                <div>
                  {l.status === "success" ? (
                    <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-success">
                      <CheckCircle2 className="size-2.5" />
                      Success
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sev-critical">
                      <XCircle className="size-2.5" />
                      Failed
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] leading-snug text-foreground">
                    <ActivityText text={l.text} />
                  </p>
                  <p className="mt-0.5 inline-flex items-center gap-2 text-[10px] text-muted-foreground/80">
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
                <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
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
      <span key={`${start}-${m[0]}`} className="rounded bg-secondary/10 px-1 py-px font-mono text-[10px] font-semibold text-secondary">
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
          "h-8 inline-flex items-center justify-between gap-2 rounded-md border bg-background pl-3 pr-2 text-[12px] font-semibold transition-colors",
          open ? "border-primary" : "border-input",
          isAll ? "text-muted-foreground" : "text-foreground"
        )} style={{ minWidth: "160px" }}>
          <span className="inline-flex items-center gap-1.5">
            <Layers className="size-3" />
            {display}
          </span>
          <ChevronDown className={cn("size-3 text-muted-foreground transition-transform", open && "rotate-180")} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="max-h-[300px] w-56 overflow-y-auto p-1.5">
        <button onClick={() => onChange([])}
          className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[13px] text-muted-foreground hover:bg-muted hover:text-foreground">
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
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[13px] text-muted-foreground hover:bg-muted hover:text-foreground">
              <div className={cn("flex size-3.5 flex-shrink-0 items-center justify-center rounded border transition-colors",
                checked ? "border-primary bg-primary" : "border-muted-foreground/40")}>
                {checked && <Check className="size-2.5 text-primary-foreground" strokeWidth={3} />}
              </div>
              <span className="flex-1">{o.label}</span>
              <span className="font-mono text-[10px] text-muted-foreground/60">{count}</span>
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
          "h-8 inline-flex items-center justify-between gap-2 rounded-md border bg-background pl-3 pr-2 text-[12px] font-semibold transition-colors",
          open ? "border-primary" : "border-input",
          isAll ? "text-muted-foreground" : "text-foreground"
        )} style={{ minWidth: "140px" }}>
          <span className="inline-flex items-center gap-1.5">
            <Building2 className="size-3" />
            {display}
          </span>
          <ChevronDown className={cn("size-3 text-muted-foreground transition-transform", open && "rotate-180")} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="max-h-[280px] w-56 overflow-y-auto p-1.5">
        <button onClick={() => onChange([])}
          className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[13px] text-muted-foreground hover:bg-muted hover:text-foreground">
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
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[13px] text-muted-foreground hover:bg-muted hover:text-foreground">
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
