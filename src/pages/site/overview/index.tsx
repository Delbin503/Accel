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

export default function SiteOverviewPage() {
  const navigate = useNavigate();
  const params = useParams<{ siteId?: string }>();
  const location = useLocation();
  const { sites, addSite } = useSitesStore();
  const cameras = useCamerasStore((s) => s.cameras);
  const [search, setSearch] = React.useState("");
  const [wizardOpen, setWizardOpen] = React.useState(false);
  const [drawerSiteId, setDrawerSiteId] = React.useState<string | null>(null);

  // Sync deep-link route /site/:siteId
  React.useEffect(() => {
    if (params.siteId) setDrawerSiteId(params.siteId);
    else setDrawerSiteId(null);
  }, [params.siteId, location.pathname]);

  const filtered = sites.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return [s.name, s.address, s.description].join(" ").toLowerCase().includes(q);
  });

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

      <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search sites by name, address or description…"
            className="h-9 w-full border-0 bg-transparent pl-9 text-[13px] focus-visible:ring-0" />
        </div>
        <span className="text-[11px] text-muted-foreground">
          {filtered.length} of {sites.length}
        </span>
      </div>

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
                            <p className="truncate font-semibold text-foreground transition-colors group-hover:text-primary">
                              {site.name}
                            </p>
                            <p className="truncate text-[11px] text-muted-foreground">
                              <MapPin className="mr-0.5 inline size-2.5" />
                              {site.address || "No address yet"}
                            </p>
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
