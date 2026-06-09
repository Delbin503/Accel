import * as React from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { toast } from "sonner";
import {
  MapPin,
  Plus,
  Search,
  Image as ImageIcon,
  MoreHorizontal,
  Trash2,
  Edit3,
  ArrowUpRight,
  Shapes,
  Video,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PageHeader } from "@/components/layout/PageHeader";
import { cn } from "@/lib/utils";
import { useSitesStore } from "@/stores/useSitesStore";
import { useCamerasStore } from "@/stores/useCamerasStore";
import { CreateSiteWizard } from "./CreateSiteWizard";
import { SiteDetailDrawer } from "./SiteDetailDrawer";
import { SITE_ACCENT_COLORS } from "@/mocks/sites";
import type { SiteData } from "@/types/sites";
import type { CameraData } from "@/types/cameras";
import { KpiCard, KpiGrid } from "@/components/shared/KpiCard";
import { TruncatedText } from "@/components/shared/TruncatedText";

const STATUS_STYLES = {
  active:   { bg: "bg-success/15 border-success/30",        text: "text-success",          dot: "bg-success",          label: "Active"   },
  setup:    { bg: "bg-warning/15 border-warning/30",        text: "text-warning",          dot: "bg-warning",          label: "Setup"    },
  inactive: { bg: "bg-muted border-border",                 text: "text-muted-foreground", dot: "bg-muted-foreground", label: "Inactive" },
};

function SiteMiniThumb({ site }: { site: SiteData }) {
  if (site.floorPlan?.imageUrl) {
    return (
      <div className="relative size-10 flex-shrink-0 overflow-hidden rounded-md border border-border bg-neutral-950">
        <img src={site.floorPlan.imageUrl} alt="" className="absolute inset-0 size-full object-cover opacity-80" />
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full">
          {site.areas.filter((a) => a.points.length >= 3).map((a) => (
            <polygon key={a.id}
              points={a.points.map(([x, y]) => `${x * 100},${y * 100}`).join(" ")}
              fill={a.color} fillOpacity={0.35} stroke={a.color} strokeOpacity={0.9} strokeWidth={1.2} />
          ))}
        </svg>
      </div>
    );
  }
  return (
    <div className="flex size-10 flex-shrink-0 items-center justify-center rounded-md border border-border" style={{ background: site.accent }}>
      <MapPin className="size-3.5 text-muted-foreground" />
    </div>
  );
}

function CameraHealthCell({ cameras }: { cameras: CameraData[] }) {
  const online  = cameras.filter((c) => c.status === "online").length;
  const total   = cameras.length;
  const offline = total - online;
  if (total === 0) {
    return <span className="text-[12px] text-muted-foreground/60">—</span>;
  }
  const allOnline = offline === 0;
  return (
    <div className="flex items-center gap-2">
      <Video className={cn("size-3", allOnline ? "text-success" : "text-muted-foreground")} />
      <span className="font-mono text-[12px] font-semibold text-foreground">
        {online}<span className="text-muted-foreground/60">/{total}</span>
      </span>
      {offline > 0 && (
        <span className="inline-flex items-center gap-1 rounded-full border border-sev-critical/30 bg-sev-critical/10 px-1.5 py-0.5 text-[10px] font-semibold text-sev-critical">
          <span className="size-1 rounded-full bg-sev-critical" />
          {offline} offline
        </span>
      )}
    </div>
  );
}

/* ── Filters ─────────────────────────────────────────────────────────────── */

interface FilterOption {
  value: string;
  label: string;
}

interface SiteFilters {
  status: string[];
  floorPlan: string[];
}
const EMPTY_FILTERS: SiteFilters = { status: [], floorPlan: [] };

const SITE_STATUS_OPTS: FilterOption[] = [
  { value: "active", label: "Active" },
  { value: "setup", label: "Setup" },
  { value: "inactive", label: "Inactive" },
];
const FLOOR_PLAN_OPTS: FilterOption[] = [
  { value: "ready", label: "Ready" },
  { value: "missing", label: "Missing" },
];

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
            "flex w-full items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2 text-[13px] transition-colors hover:border-primary",
            open ? "border-primary" : "border-border",
            hasValue ? "text-primary" : "text-muted-foreground"
          )}
        >
          <TruncatedText text={displayLabel} className="font-medium" />
          <ChevronDown className={cn("size-3.5 flex-shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
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
              {opt.label}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

function FilterPanel({
  filters,
  onChange,
  search,
  onSearchChange,
}: {
  filters: SiteFilters;
  onChange: (f: SiteFilters) => void;
  search: string;
  onSearchChange: (v: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const filterCount = Object.values(filters).reduce((s, arr) => s + arr.length, 0);
  const activeCount = filterCount + (search ? 1 : 0);

  function setGroup(group: keyof SiteFilters, values: string[]) {
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
              {["All statuses", "All floor plans"].map((l) => (
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
              onClick={(e) => { e.stopPropagation(); onChange(EMPTY_FILTERS); onSearchChange(""); }}
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
              placeholder="Search sites by name, address or description…"
              className="h-9 w-full pl-9 text-[13px]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: "status" as const, label: "Status", opts: SITE_STATUS_OPTS },
              { key: "floorPlan" as const, label: "Floor Plan", opts: FLOOR_PLAN_OPTS },
            ].map(({ key, label, opts }) => (
              <div key={key}>
                <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {label}
                </div>
                <FilterDropdown
                  label={key === "floorPlan" ? "All floor plans" : `All ${label.toLowerCase()}es`}
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

export default function SiteOverviewPage() {
  const navigate = useNavigate();
  const params = useParams<{ siteId?: string }>();
  const location = useLocation();
  const { sites, addSite } = useSitesStore();
  const cameras = useCamerasStore((s) => s.cameras);
  const [search, setSearch] = React.useState("");
  const [filters, setFilters] = React.useState<SiteFilters>(EMPTY_FILTERS);
  const [wizardOpen, setWizardOpen] = React.useState(false);
  const [drawerSiteId, setDrawerSiteId] = React.useState<string | null>(null);

  // Sync deep-link route /site/:siteId
  React.useEffect(() => {
    if (params.siteId) setDrawerSiteId(params.siteId);
    else setDrawerSiteId(null);
  }, [params.siteId, location.pathname]);

  const filtered = sites.filter((s) => {
    if (filters.status.length > 0 && !filters.status.includes(s.status)) return false;
    if (filters.floorPlan.length > 0) {
      const band = s.floorPlan ? "ready" : "missing";
      if (!filters.floorPlan.includes(band)) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      if (![s.name, s.address, s.description].join(" ").toLowerCase().includes(q)) return false;
    }
    return true;
  });
  const hasFilters = !!(search || filters.status.length > 0 || filters.floorPlan.length > 0);

  const totalSites    = sites.length;
  const totalAreas    = sites.reduce((s, x) => s + x.areas.length, 0);
  const sitesWithPlan = sites.filter((s) => !!s.floorPlan).length;
  const totalCameras  = cameras.length;
  const onlineCameras = cameras.filter((c) => c.status === "online").length;

  function openSite(id: string) {
    setDrawerSiteId(id);
    navigate(`/site/${id}`, { replace: false });
  }
  function closeDrawer() {
    setDrawerSiteId(null);
    if (params.siteId) navigate("/site/overview", { replace: true });
  }

  function handleCreate(site: SiteData, opts: { openEditor: boolean }) {
    addSite(site);
    setWizardOpen(false);
    if (opts.openEditor) {
      toast.success(`${site.name} created`);
      openSite(site.id);
    } else {
      toast.success(`${site.name} created`);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader>
        <PageHeader.Content>
          <PageHeader.Title>Site Management</PageHeader.Title>
          <PageHeader.Description>
            Manage all sites — upload floor plans, draw areas, and place cameras.
          </PageHeader.Description>
        </PageHeader.Content>
        <PageHeader.Actions>
          <Button className="gap-1.5" onClick={() => setWizardOpen(true)}>
            <Plus className="size-3.5" />
            Add Site
          </Button>
        </PageHeader.Actions>
      </PageHeader>

      <KpiGrid cols={4}>
        <KpiCard label="Total Sites"      value={totalSites}    sub="All locations"                              accent="primary" />
        <KpiCard label="With Floor Plans" value={sitesWithPlan} sub={`${totalSites - sitesWithPlan} pending upload`} accent="success" />
        <KpiCard label="Areas Defined"    value={totalAreas}    sub="Across all sites"                           accent="info" />
        <KpiCard label="Cameras"          value={totalCameras}  sub={`${onlineCameras} online`}                  accent="secondary" />
      </KpiGrid>

      <FilterPanel
        filters={filters}
        onChange={setFilters}
        search={search}
        onSearchChange={setSearch}
      />

      <p className="text-[13px] text-muted-foreground">
        <strong className="text-foreground">{filtered.length}</strong>{" "}
        {filtered.length === 1 ? "site" : "sites"} match current filters
        {hasFilters && (
          <button
            onClick={() => { setSearch(""); setFilters(EMPTY_FILTERS); }}
            className="ml-2 text-muted-foreground underline hover:text-primary"
          >
            Clear filters
          </button>
        )}
      </p>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-20 text-muted-foreground">
          <MapPin className="size-10 opacity-20" />
          <p className="text-sm">No sites match the current search.</p>
          <Button variant="outline" onClick={() => setWizardOpen(true)} className="gap-1.5">
            <Plus className="size-3.5" />
            Create a site
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30">
                <tr className="border-b border-border text-left">
                  {["SITE ID", "SITE", "STATUS", "FLOOR PLAN", "AREAS", "CAMERAS", "OPERATING", "CREATED", "ACTION"].map((h) => (
                    <th key={h}
                      className="px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filtered.map((site) => {
                  const s = STATUS_STYLES[site.status];
                  const siteCams = cameras.filter((c) => c.siteId === site.id);
                  return (
                    <tr key={site.id}
                      onClick={() => openSite(site.id)}
                      className="group cursor-pointer text-[13px] transition-colors hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <span className="font-mono text-[12px] font-semibold text-muted-foreground transition-colors group-hover:text-primary">
                          {site.id}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <SiteMiniThumb site={site} />
                          <div className="min-w-0">
                            <TruncatedText
                              text={site.name}
                              className="font-semibold text-foreground transition-colors group-hover:text-primary"
                            />
                            <TruncatedText
                              title={site.address || "No address yet"}
                              className="text-[11px] text-muted-foreground"
                            >
                              <MapPin className="mr-0.5 inline size-2.5" />
                              {site.address || "No address yet"}
                            </TruncatedText>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", s.bg, s.text)}>
                          <span className={cn("size-1.5 rounded-full", s.dot, site.status === "active" && "animate-pulse")} />
                          {s.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {site.floorPlan ? (
                          <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-success">
                            <ImageIcon className="size-3" />
                            Ready
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md border border-warning/30 bg-warning/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-warning">
                            Missing
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 font-mono text-[12px] font-semibold text-foreground">
                          <Shapes className="size-3 text-muted-foreground" />
                          {site.areas.length}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <CameraHealthCell cameras={siteCams} />
                      </td>
                      <td className="px-4 py-3 font-mono text-[12px] text-muted-foreground">
                        {site.operatingHours
                          ? <>{site.operatingHours.from}<span className="text-muted-foreground/50"> – </span>{site.operatingHours.to}</>
                          : <span className="text-muted-foreground/50">—</span>}
                      </td>
                      <td className="px-4 py-3 text-[12px] text-muted-foreground">{site.createdAtDisplay}</td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="flex size-7 items-center justify-center rounded border border-transparent text-muted-foreground/50 transition-colors hover:border-border hover:bg-muted hover:text-foreground">
                              <MoreHorizontal className="size-4" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-44 p-1" align="end">
                            <button onClick={() => openSite(site.id)}
                              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[12px] text-foreground hover:bg-muted">
                              <ArrowUpRight className="size-3.5 text-muted-foreground" />
                              Open Site
                            </button>
                            <button onClick={() => openSite(site.id)}
                              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[12px] text-foreground hover:bg-muted">
                              <Edit3 className="size-3.5 text-muted-foreground" />
                              Edit Site
                            </button>
                            <div className="my-1 border-t border-border" />
                            <button onClick={() => openSite(site.id)}
                              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[12px] text-sev-critical hover:bg-sev-critical/10">
                              <Trash2 className="size-3.5" />
                              Delete Site
                            </button>
                          </PopoverContent>
                        </Popover>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <CreateSiteWizard open={wizardOpen} onClose={() => setWizardOpen(false)} onCreate={handleCreate} accentChoices={SITE_ACCENT_COLORS} />
      <SiteDetailDrawer siteId={drawerSiteId} open={drawerSiteId !== null} onClose={closeDrawer} />
    </div>
  );
}
