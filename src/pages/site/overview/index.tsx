import * as React from "react";
import { DataTable, type DataTableColumn } from "@accel/ui/components/shared/DataTable";
import { ItemButton } from "@accel/ui/components/ui/item";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { toast } from "sonner";
import {
  MapPin,
  Plus,
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
import { Button } from "@accel/ui/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@accel/ui/components/ui/popover";
import { PageHeader } from "@accel/ui/components/layout/PageHeader";
import { Tooltip, TooltipTrigger, TooltipContent } from "@accel/ui/components/ui/tooltip";
import { cn } from "@accel/ui/lib/utils";
import { useSitesStore } from "@/stores/useSitesStore";
import { useCamerasStore } from "@/stores/useCamerasStore";
import { CreateSiteWizard } from "./CreateSiteWizard";
import { SiteDetailDrawer } from "./SiteDetailDrawer";
import { SITE_ACCENT_COLORS } from "@/mocks/sites";
import { PLANS, ACCOUNT_SUBSCRIPTION } from "@/mocks/licenses";
import type { SiteData } from "@/types/sites";
import type { CameraData } from "@/types/cameras";
import { KpiCard, KpiGrid } from "@accel/ui/components/shared/KpiCard";
import { ToolbarSearch } from "@accel/ui/components/shared/Toolbar";
import { TruncatedText } from "@accel/ui/components/shared/TruncatedText";

function SiteMiniThumb({ site }: { site: SiteData }) {
  if (site.floorPlan?.imageUrl) {
    return (
      <div className="relative size-10 flex-shrink-0 overflow-hidden rounded-md border border-border bg-media">
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
    return <span className="text-sm text-muted-foreground">—</span>;
  }
  const allOnline = offline === 0;
  return (
    <div className="flex items-center gap-2">
      <Video className={cn("size-3", allOnline ? "text-success" : "text-muted-foreground")} />
      <span className="font-mono text-sm font-semibold text-foreground">
        {online}<span className="text-muted-foreground">/{total}</span>
      </span>
      {offline > 0 && (
        <span className="inline-flex items-center gap-1 rounded-full border border-severity-critical/30 bg-severity-critical/10 px-1.5 py-0.5 text-2xs font-semibold text-severity-critical">
          <span className="size-1 rounded-full bg-severity-critical" />
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
        <ItemButton variant="plain"
          className={cn(
            "justify-between gap-2 rounded-lg border bg-card px-3 py-2 text-base transition-colors hover:border-primary",
            open ? "border-primary" : "border-border",
            hasValue ? "text-primary-ink" : "text-muted-foreground"
          )}
        >
          <TruncatedText text={displayLabel} className="font-medium" />
          <ChevronDown className={cn("size-3.5 flex-shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
        </ItemButton>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-52 p-1.5">
        {options.map((opt) => {
          const checked = selected.includes(opt.value);
          return (
            <ItemButton variant="plain"
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
              {opt.label}
            </ItemButton>
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
    <div data-slot="site-overview-filter-panel" className="rounded-xl border border-border bg-card">
      <div
        className="flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-muted/30"
      >
        <ItemButton variant="plain" type="button" onClick={() => setOpen((v) => !v)} className="w-auto flex-1 gap-2.5">
          <SlidersHorizontal className="size-4 flex-shrink-0 text-muted-foreground" />
          <span className="text-base font-semibold text-foreground">Filters</span>
          {activeCount > 0 ? (
            <span className="rounded-full bg-primary-fill px-2 py-px text-xs font-semibold text-primary-foreground">
              {activeCount} active
            </span>
          ) : (
            <div className="hidden flex-wrap gap-1.5 sm:flex">
              {["All statuses", "All floor plans"].map((l) => (
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
          <Button variant="ghost" size="icon-xs" className="size-auto rounded-none p-0 hover:bg-transparent dark:hover:bg-transparent" type="button" aria-label={open ? "Collapse filters" : "Expand filters"} onClick={() => setOpen((v) => !v)}>
            {open ? (
              <ChevronUp className="size-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="size-4 text-muted-foreground" />
            )}
          </Button>
        </div>
      </div>

      {open && (
        <div data-slot="site-overview-filter-panel-body" className="space-y-3 rounded-b-xl border-t border-border bg-background px-4 py-4">
          <ToolbarSearch value={search} onChange={onSearchChange} placeholder="Search sites by name, address or description…" className="sm:w-full" />
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: "status" as const, label: "Status", opts: SITE_STATUS_OPTS },
              { key: "floorPlan" as const, label: "Floor Plan", opts: FLOOR_PLAN_OPTS },
            ].map(({ key, label, opts }) => (
              <div key={key}>
                <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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

export default function SiteOverviewPage({
  forcedState = "normal",
}: {
  forcedState?: "normal" | "empty";
} = {}) {
  const navigate = useNavigate();
  const params = useParams<{ siteId?: string }>();
  const location = useLocation();
  const isEmptyState = forcedState === "empty";
  const { sites: storeSites, addSite } = useSitesStore();
  const storeCameras = useCamerasStore((s) => s.cameras);
  const sites = isEmptyState ? [] : storeSites;
  const cameras = isEmptyState ? [] : storeCameras;
  const [search, setSearch] = React.useState("");
  const [filters, setFilters] = React.useState<SiteFilters>(EMPTY_FILTERS);
  const [wizardOpen, setWizardOpen] = React.useState(false);
  const [drawerSiteId, setDrawerSiteId] = React.useState<string | null>(params.siteId ?? null);
  const [editFromMenu, setEditFromMenu] = React.useState(false);

  // Sync deep-link route /site/:siteId
  const routeKey = `${params.siteId ?? ""}|${location.pathname}`;
  const [prevRouteKey, setPrevRouteKey] = React.useState(routeKey);
  if (routeKey !== prevRouteKey) {
    setPrevRouteKey(routeKey);
    setDrawerSiteId(params.siteId ?? null);
  }

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
  const siteLimit     = PLANS[ACCOUNT_SUBSCRIPTION.planTier].siteLimit;
  const sitesRemaining = siteLimit === "unlimited" ? null : Math.max(0, siteLimit - totalSites);
  const atSiteLimit    = sitesRemaining === 0;
  const totalAreas    = sites.reduce((s, x) => s + x.areas.length, 0);
  const sitesWithPlan = sites.filter((s) => !!s.floorPlan).length;
  const totalCameras  = cameras.length;
  const onlineCameras = cameras.filter((c) => c.status === "online").length;

  function openSite(id: string) {
    setEditFromMenu(false);
    setDrawerSiteId(id);
    navigate(`/site/${id}`, { replace: false });
  }
  function editSite(id: string) {
    setEditFromMenu(true);
    setDrawerSiteId(id);
    navigate(`/site/${id}`, { replace: false });
  }
  function closeDrawer() {
    setDrawerSiteId(null);
    setEditFromMenu(false);
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

  const siteColumns: DataTableColumn<SiteData>[] = [
    {
      key: "id",
      header: "SITE ID",
      cell: (site) => (
        <span className="font-mono text-sm font-semibold text-muted-foreground transition-colors group-hover:text-primary-ink">
          {site.id}
        </span>
      ),
    },
    {
      key: "site",
      header: "SITE",
      cell: (site) => (
        <div className="flex items-center gap-2.5">
          <SiteMiniThumb site={site} />
          <div className="min-w-0">
            <TruncatedText
              text={site.name}
              className="font-semibold text-foreground transition-colors group-hover:text-primary-ink"
            />
            <TruncatedText
              title={site.address || "No address yet"}
              className="text-xs text-muted-foreground"
            >
              <MapPin className="mr-0.5 inline size-2.5" />
              {site.address || "No address yet"}
            </TruncatedText>
          </div>
        </div>
      ),
    },
    {
      key: "floorPlan",
      header: "FLOOR PLAN",
      cell: (site) =>
        site.floorPlan ? (
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-success">
            <ImageIcon className="size-3" />
            Ready
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-md border border-warning/30 bg-warning/10 px-1.5 py-0.5 text-2xs font-bold uppercase tracking-wider text-warning">
            Missing
          </span>
        ),
    },
    {
      key: "areas",
      header: "AREAS",
      cell: (site) => (
        <span className="inline-flex items-center gap-1.5 font-mono text-sm font-semibold text-foreground">
          <Shapes className="size-3 text-muted-foreground" />
          {site.areas.length}
        </span>
      ),
    },
    {
      key: "cameras",
      header: "CAMERAS",
      cell: (site) => <CameraHealthCell cameras={cameras.filter((c) => c.siteId === site.id)} />,
    },
    {
      key: "operating",
      header: "OPERATING",
      className: "font-mono text-sm text-muted-foreground",
      headClassName: "",
      cell: (site) =>
        site.operatingHours
          ? <>{site.operatingHours.from}<span className="text-muted-foreground"> – </span>{site.operatingHours.to}</>
          : <span className="text-muted-foreground">—</span>,
    },
    {
      key: "created",
      header: "CREATED",
      className: "text-sm text-muted-foreground",
      headClassName: "",
      cell: (site) => site.createdAtDisplay,
    },
    {
      key: "action",
      header: "ACTION",
      stopRowClick: true,
      cell: (site) => (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${site.name}`} className="size-7 rounded border border-transparent text-muted-foreground transition-colors hover:border-border hover:bg-muted hover:text-foreground dark:hover:bg-muted">
              <MoreHorizontal className="size-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-44 p-1" align="end">
            <ItemButton variant="plain" onClick={() => openSite(site.id)}
              className="gap-2 rounded px-2 py-1.5 text-sm text-foreground hover:bg-muted">
              <ArrowUpRight className="size-3.5 text-muted-foreground" />
              Open Site
            </ItemButton>
            <ItemButton variant="plain" onClick={() => editSite(site.id)}
              className="gap-2 rounded px-2 py-1.5 text-sm text-foreground hover:bg-muted">
              <Edit3 className="size-3.5 text-muted-foreground" />
              Edit Site
            </ItemButton>
            <div className="my-1 border-t border-border" />
            <ItemButton variant="plain" onClick={() => openSite(site.id)}
              className="gap-2 rounded px-2 py-1.5 text-sm text-severity-critical hover:bg-severity-critical/10">
              <Trash2 className="size-3.5" />
              Delete Site
            </ItemButton>
          </PopoverContent>
        </Popover>
      ),
    },
  ];

  return (
    <div data-slot="site-overview-page" className="flex flex-col gap-section">
      <PageHeader>
        <PageHeader.Content>
          <PageHeader.Title>Site Management</PageHeader.Title>
        </PageHeader.Content>
        <PageHeader.Actions>
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className={cn(
                  "inline-flex cursor-default items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm",
                  atSiteLimit
                    ? "border-severity-critical/30 bg-severity-critical/10 text-severity-critical"
                    : "border-border bg-card text-muted-foreground"
                )}
              >
                {siteLimit === "unlimited" ? (
                  <>
                    <strong className="text-foreground">{totalSites}</strong> sites · Unlimited
                  </>
                ) : (
                  <>
                    <strong className={cn(atSiteLimit ? "text-severity-critical" : "text-foreground")}>
                      {sitesRemaining}
                    </strong>{" "}
                    of {siteLimit} sites left
                  </>
                )}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              On the {ACCOUNT_SUBSCRIPTION.planName} plan
              {ACCOUNT_SUBSCRIPTION.billingCycle === "annual" ? " · Annual" : " · Monthly"}
            </TooltipContent>
          </Tooltip>
          <Button className="gap-1.5" onClick={() => setWizardOpen(true)} disabled={atSiteLimit}>
            <Plus className="size-3.5" />
            Add Site
          </Button>
        </PageHeader.Actions>
      </PageHeader>

      <KpiGrid cols={4}>
        <KpiCard label="Total Sites"      value={totalSites}    sub="All locations"                              tone="primary" />
        <KpiCard label="With Floor Plans" value={sitesWithPlan} sub={`${totalSites - sitesWithPlan} pending upload`} tone="success" />
        <KpiCard label="Areas Defined"    value={totalAreas}    sub="Across all sites"                           tone="info" />
        <KpiCard label="Cameras"          value={totalCameras}  sub={`${onlineCameras} online`}                  tone="secondary" />
      </KpiGrid>

      <FilterPanel
        filters={filters}
        onChange={setFilters}
        search={search}
        onSearchChange={setSearch}
      />

      <p data-slot="site-overview-page-results" className="text-base text-muted-foreground">
        <strong className="text-foreground">{filtered.length}</strong>{" "}
        {filtered.length === 1 ? "site" : "sites"} match current filters
        {hasFilters && (
          <Button variant="link"
            onClick={() => { setSearch(""); setFilters(EMPTY_FILTERS); }}
            className="ml-2 h-auto border-0 p-0 text-base font-normal text-muted-foreground underline hover:text-primary-ink"
          >
            Clear all
          </Button>
        )}
      </p>

      {filtered.length === 0 ? (
        <div data-slot="site-overview-page-empty" className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-20 text-muted-foreground">
          <MapPin className="size-10 opacity-20" />
          {sites.length === 0 ? (
            <>
              <p className="text-sm font-medium text-foreground">No sites yet</p>
              <p className="text-sm">Add a site to upload floor plans, draw areas, and place cameras.</p>
              <Button onClick={() => setWizardOpen(true)} className="gap-1.5">
                <Plus className="size-3.5" />
                Add Site
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm">No sites match the current search.</p>
              <Button variant="outline" onClick={() => setWizardOpen(true)} className="gap-1.5">
                <Plus className="size-3.5" />
                Create a site
              </Button>
            </>
          )}
        </div>
      ) : (
        <div data-slot="site-overview-page-table" className="overflow-hidden rounded-xl border border-border bg-card">
          <DataTable
            variant="list"
            columns={siteColumns}
            data={filtered}
            getRowId={(site) => site.id}
            onRowClick={(site) => openSite(site.id)}
            getRowClassName={() => "transition-colors"}
          />
        </div>
      )}

      <CreateSiteWizard open={wizardOpen} onClose={() => setWizardOpen(false)} onCreate={handleCreate} accentChoices={SITE_ACCENT_COLORS} />
      <SiteDetailDrawer siteId={drawerSiteId} open={drawerSiteId !== null} onClose={closeDrawer} initialEdit={editFromMenu} />
    </div>
  );
}
