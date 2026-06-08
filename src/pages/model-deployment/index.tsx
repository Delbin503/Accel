import * as React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import {
  Search,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  Plus,
  Rocket,
  FileText,
  Cpu,
  MapPin,
  Video,
  AlertTriangle,
  Calendar,
  Trash2,
  Pause,
  Square,
  Shield,
  Crosshair,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PageHeader } from "@/components/layout/PageHeader";
import { cn } from "@/lib/utils";
import { MOCK_MODELS } from "@/mocks/modelManagement";
import { MOCK_CAMERAS } from "@/mocks/cameras";
import {
  MOCK_DEPLOYMENTS,
  getSiteSummaries,
  getAreaSummaries,
  nextDeploymentId,
} from "@/mocks/deployments";
import type { ModelData } from "@/types/modelManagement";
import type { CameraData } from "@/types/cameras";
import { KpiCard, KpiGrid, type KpiAccent } from "@/components/shared/KpiCard";
import type {
  DeploymentData,
  DeploymentStatus,
  SiteSummary,
  AreaSummary,
} from "@/types/deployments";

/* ── Model icon map (subset, shared with Model Management) ───────────────── */

const MODEL_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  shield: Shield,
  crosshair: Crosshair,
  eye: Eye,
};
function getModelIcon(key: string) { return MODEL_ICON_MAP[key] ?? Shield; }

/* ── Status pill (deployment + site + area share Online/Offline tone) ────── */

const DEP_STATUS: Record<DeploymentStatus, { bg: string; text: string; dot: string; label: string }> = {
  active:           { bg: "bg-success/15 border-success/30",         text: "text-success",       dot: "bg-success",       label: "Active" },
  paused:           { bg: "bg-warning/15 border-warning/30", text: "text-warning",   dot: "bg-warning",   label: "Paused" },
  "pending-camera": { bg: "bg-info/15 border-info/30",               text: "text-info",          dot: "bg-info",          label: "Pending" },
  stopped:          { bg: "bg-muted border-border",                  text: "text-muted-foreground", dot: "bg-muted-foreground", label: "Stopped" },
  failed:           { bg: "bg-sev-critical/15 border-sev-critical/30", text: "text-sev-critical", dot: "bg-sev-critical", label: "Failed" },
};

/* ── Model health (derived from underlying deployments) ─────────────────── */

type ModelHealth = "healthy" | "degraded" | "offline" | "overloaded";

const MODEL_HEALTH_STYLES: Record<ModelHealth, { bg: string; text: string; dot: string; label: string; border: string }> = {
  healthy:    { bg: "bg-success/15",      text: "text-success",      dot: "bg-success",      border: "border-success/40",      label: "Healthy" },
  degraded:   { bg: "bg-warning/15",      text: "text-warning",      dot: "bg-warning",      border: "border-warning/40",      label: "Degraded" },
  offline:    { bg: "bg-muted",           text: "text-muted-foreground", dot: "bg-muted-foreground", border: "border-border",   label: "Offline" },
  overloaded: { bg: "bg-sev-critical/15", text: "text-sev-critical", dot: "bg-sev-critical", border: "border-sev-critical/40", label: "Overloaded" },
};

function ModelHealthPill({ health }: { health: ModelHealth }) {
  const s = MODEL_HEALTH_STYLES[health];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        s.bg, s.border, s.text
      )}
    >
      <span className={cn("size-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}

function computeModelHealth(deps: DeploymentData[]): ModelHealth {
  if (deps.length === 0) return "offline";
  const active = deps.filter((d) => d.status === "active").length;
  const failed = deps.filter((d) => d.status === "failed").length;
  const totalEvents = deps.reduce((s, d) => s + d.eventCount, 0);
  // Overloaded — high per-active-camera event load
  if (active > 0 && totalEvents / active > 80) return "overloaded";
  // Offline — nothing running, or majority failed
  if (active === 0 || failed >= Math.ceil(deps.length / 2)) return "offline";
  // Healthy — everything active
  if (active === deps.length) return "healthy";
  // Mixed
  return "degraded";
}

function StatusPill({ status }: { status: DeploymentStatus }) {
  const s = DEP_STATUS[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        s.bg, s.text
      )}
    >
      <span className={cn("size-1.5 flex-shrink-0 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}

function OnlineDot({ online }: { online: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
        online ? "border-success/30 bg-success/10 text-success" : "border-border bg-muted text-muted-foreground"
      )}
    >
      <span className={cn("size-1.5 flex-shrink-0 rounded-full", online ? "bg-success" : "bg-muted-foreground")} />
      {online ? "Online" : "Offline"}
    </span>
  );
}

/* ─── Column shell ───────────────────────────────────────────────────────── */

function WizardColumn({
  title,
  description,
  count,
  countTotal,
  search,
  onSearchChange,
  searchPlaceholder,
  children,
}: {
  title: string;
  description: string;
  count: number;
  countTotal?: number;
  search: string;
  onSearchChange: (v: string) => void;
  searchPlaceholder: string;
  children: React.ReactNode;
}) {
  const isSelected = count > 0;
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex-shrink-0 space-y-2 border-b border-border px-4 py-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[15px] font-bold text-foreground">{title}</h3>
          <span
            className={cn(
              "inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-[11px] font-bold tabular-nums",
              isSelected ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"
            )}
          >
            {count}
            {countTotal !== undefined && (
              <span className="ml-0.5 text-[9px] font-semibold opacity-70">/{countTotal}</span>
            )}
          </span>
        </div>
        <p className="text-[12px] text-muted-foreground">{description}</p>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-9 pl-9 text-[13px]"
          />
        </div>
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {children}
      </div>
    </div>
  );
}

/* ─── Card components ────────────────────────────────────────────────────── */

function ModelCard({
  model,
  selected,
  onClick,
}: {
  model: ModelData;
  selected: boolean;
  onClick: () => void;
}) {
  const Icon = getModelIcon(model.iconKey);
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full rounded-xl border px-3.5 py-3 text-left transition-all",
        selected ? "border-primary/60 bg-primary/[0.06]" : "border-border bg-background hover:border-primary/30 hover:bg-muted/30"
      )}
    >
      <div className="mb-2 flex items-start gap-2.5">
        <div className={cn(
          "flex size-8 flex-shrink-0 items-center justify-center rounded-lg border",
          selected ? "border-primary/40 bg-primary/10" : "border-border bg-muted"
        )}>
          <Icon className={cn("size-4", selected ? "text-primary" : "text-muted-foreground")} />
        </div>
        <div className="min-w-0 flex-1">
          <p className={cn("truncate text-[13px] font-bold", selected ? "text-primary" : "text-foreground")}>
            {model.name}
          </p>
          <p className="line-clamp-2 text-[11px] text-muted-foreground">{model.description}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">
          {model.sequenceIds.length} Steps
        </span>
        <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
          {model.attachedRuleIds.length} Rules
        </span>
      </div>
    </button>
  );
}

function SiteCard({
  site,
  selected,
  onClick,
}: {
  site: SiteSummary;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full rounded-xl border px-3.5 py-3 text-left transition-all",
        selected ? "border-primary/60 bg-primary/[0.06]" : "border-border bg-background hover:border-primary/30 hover:bg-muted/30"
      )}
    >
      <div className="mb-2.5 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={cn("truncate text-[13px] font-bold", selected ? "text-primary" : "text-foreground")}>
            {site.siteName}
          </p>
          <p className="font-mono text-[10px] text-muted-foreground">{site.siteId}</p>
        </div>
        <OnlineDot online={site.status === "online"} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <CountMini label="Areas" value={site.areaCount} tone="default" />
        <CountMini label="Cameras" value={site.cameraCount} tone="success" />
        <CountMini label="Deployed" value={site.deployedCount} tone="info" />
      </div>
    </button>
  );
}

function AreaCard({
  area,
  selected,
  onToggle,
}: {
  area: AreaSummary;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "w-full rounded-xl border px-3.5 py-3 text-left transition-all",
        selected ? "border-primary/60 bg-primary/[0.06]" : "border-border bg-background hover:border-primary/30 hover:bg-muted/30"
      )}
    >
      <div className="mb-2.5 flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <CheckboxBox checked={selected} />
          <p className={cn("truncate text-[13px] font-bold", selected ? "text-primary" : "text-foreground")}>
            {area.areaName}
          </p>
        </div>
        <OnlineDot online={area.status === "online"} />
      </div>
      <div className="grid grid-cols-2 gap-2 pl-7">
        <CountMini label="Cameras" value={area.cameraCount} tone="success" />
        <CountMini label="Deployed" value={area.deployedCount} tone="info" />
      </div>
    </button>
  );
}

function CameraCard({
  camera,
  selected,
  onToggle,
}: {
  camera: CameraData;
  selected: boolean;
  onToggle: () => void;
}) {
  const online = camera.status === "online";
  return (
    <button
      onClick={onToggle}
      className={cn(
        "w-full rounded-xl border px-3.5 py-3 text-left transition-all",
        selected ? "border-primary/60 bg-primary/[0.06]" : "border-border bg-background hover:border-primary/30 hover:bg-muted/30"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <CheckboxBox checked={selected} />
          <div className="min-w-0">
            <p className={cn("truncate text-[12.5px] font-semibold", selected ? "text-primary" : "text-foreground")}>
              {camera.name}
            </p>
            <p className="font-mono text-[10px] text-muted-foreground">{camera.id} · {camera.areaName}</p>
          </div>
        </div>
        <OnlineDot online={online} />
      </div>
      {!camera.nvrId && (
        <div className="mt-2 flex items-center gap-1.5 rounded-md border border-warning/30 bg-warning/[0.06] px-2 py-1 text-[10px] text-warning">
          <AlertTriangle className="size-3" />
          No NVR — events will have no footage
        </div>
      )}
    </button>
  );
}

/* ── Tiny atoms ──────────────────────────────────────────────────────────── */

function CountMini({ label, value, tone }: { label: string; value: number; tone: "default" | "success" | "info" }) {
  const tones = {
    default: "text-foreground",
    success: "text-success",
    info: "text-info",
  };
  return (
    <div className="flex flex-col">
      <span className={cn("text-[15px] font-bold leading-none", tones[tone])}>{value}</span>
      <span className="mt-0.5 text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

function CheckboxBox({ checked }: { checked: boolean }) {
  return (
    <span
      className={cn(
        "flex size-4 flex-shrink-0 items-center justify-center rounded border-2 transition-all",
        checked ? "border-primary bg-primary" : "border-border bg-background"
      )}
    >
      {checked && <Check className="size-2.5 text-primary-foreground" strokeWidth={3} />}
    </span>
  );
}

/* ─── Summary bar (sticky bottom of wizard) ──────────────────────────────── */

function SummaryBar({
  model,
  site,
  selectedAreas,
  selectedCameras,
  canDeploy,
  onDeploy,
}: {
  model: ModelData | null;
  site: SiteSummary | null;
  selectedAreas: AreaSummary[];
  selectedCameras: CameraData[];
  canDeploy: boolean;
  onDeploy: () => void;
}) {
  return (
    <div className="grid grid-cols-[2fr_2fr_1fr_1fr_auto] items-center gap-5 rounded-xl border border-border bg-card px-5 py-3.5">
      <SummaryField label="Model" value={model?.name ?? null} placeholder="-" />
      <SummaryField label="Site" value={site?.siteName ?? null} placeholder="-" />
      <SummaryField
        label="Areas"
        value={selectedAreas.length > 0 ? selectedAreas.map((a) => a.areaName).join(", ") : null}
        count={selectedAreas.length}
        placeholder="-"
      />
      <SummaryField
        label="Cameras"
        value={selectedCameras.length > 0 ? `${selectedCameras.length} selected` : null}
        count={selectedCameras.length}
        placeholder="-"
      />
      <Button size="lg" onClick={onDeploy} disabled={!canDeploy} className="gap-2">
        <Rocket className="size-4" />
        Ready to Deploy
      </Button>
    </div>
  );
}

function SummaryField({
  label,
  value,
  count,
  placeholder,
}: {
  label: string;
  value: string | null;
  count?: number;
  placeholder: string;
}) {
  return (
    <div className="min-w-0">
      <div className="mb-0.5 flex items-center gap-1.5">
        <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground/60">{label}</span>
        {count !== undefined && (
          <span className={cn(
            "inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold tabular-nums",
            count > 0 ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"
          )}>
            {count}
          </span>
        )}
      </div>
      <p className={cn("truncate text-[13px] font-semibold", value ? "text-foreground" : "text-muted-foreground/60")}>
        {value ?? placeholder}
      </p>
    </div>
  );
}

/* ─── Deploy wizard ──────────────────────────────────────────────────────── */

function DeployWizard({
  onCommit,
}: {
  onCommit: (records: DeploymentData[]) => void;
  onShowHistory?: () => void;
}) {
  const [modelSearch, setModelSearch] = React.useState("");
  const [siteSearch, setSiteSearch] = React.useState("");
  const [areaSearch, setAreaSearch] = React.useState("");
  const [cameraSearch, setCameraSearch] = React.useState("");

  const [modelId, setModelId] = React.useState<string | null>(null);
  const [siteId, setSiteId] = React.useState<string | null>(null);
  const [areaIds, setAreaIds] = React.useState<string[]>([]);
  const [cameraIds, setCameraIds] = React.useState<string[]>([]);

  const [confirmOpen, setConfirmOpen] = React.useState(false);

  // ── Pre-fill from Camera Drawer "Deploy Model" navigation ────────────
  // location.state.prefill = { siteId, areaId, cameraId, ... }
  const location = useLocation();
  React.useEffect(() => {
    const prefill = (location.state as { prefill?: { siteId?: string; areaId?: string; cameraId?: string } } | null)?.prefill;
    if (!prefill) return;
    if (prefill.siteId)  setSiteId(prefill.siteId);
    if (prefill.areaId)  setAreaIds([prefill.areaId]);
    if (prefill.cameraId) setCameraIds([prefill.cameraId]);
    // Clear the state so a refresh doesn't re-apply
    window.history.replaceState({}, document.title);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* — Derived data — */

  const availableModels = MOCK_MODELS.filter((m) => m.sequenceIds.length > 0 && m.attachedRuleIds.length > 0);

  const allSites = React.useMemo(() => getSiteSummaries(), []);
  const allAreas = React.useMemo(() => (siteId ? getAreaSummaries(siteId) : []), [siteId]);
  const allCamerasForAreas = React.useMemo(() => {
    if (areaIds.length === 0) return [];
    return MOCK_CAMERAS.filter((c) => areaIds.includes(c.areaId));
  }, [areaIds]);

  /* — Search-filtered views — */

  const filteredModels = availableModels.filter((m) => {
    const q = modelSearch.toLowerCase();
    return !q || m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q);
  });
  const filteredSites = allSites.filter((s) => {
    const q = siteSearch.toLowerCase();
    return !q || s.siteName.toLowerCase().includes(q) || s.siteId.toLowerCase().includes(q);
  });
  const filteredAreas = allAreas.filter((a) => {
    const q = areaSearch.toLowerCase();
    return !q || a.areaName.toLowerCase().includes(q);
  });
  const filteredCameras = allCamerasForAreas.filter((c) => {
    const q = cameraSearch.toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q);
  });

  /* — Selection state — */

  const selectedModel = MOCK_MODELS.find((m) => m.id === modelId) ?? null;
  const selectedSite = allSites.find((s) => s.siteId === siteId) ?? null;
  const selectedAreas = allAreas.filter((a) => areaIds.includes(a.areaId));
  const selectedCameras = MOCK_CAMERAS.filter((c) => cameraIds.includes(c.id));

  const canDeploy = !!selectedModel && !!selectedSite && areaIds.length > 0 && cameraIds.length > 0;

  /* — Handlers (resetting downstream selection on upstream change) — */

  function pickModel(id: string) {
    setModelId(id === modelId ? null : id);
  }
  function pickSite(id: string) {
    if (id === siteId) {
      setSiteId(null);
      setAreaIds([]);
      setCameraIds([]);
    } else {
      setSiteId(id);
      setAreaIds([]);
      setCameraIds([]);
    }
  }
  function toggleArea(id: string) {
    setAreaIds((cur) => {
      const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
      // Drop cameras whose area is no longer selected
      setCameraIds((c) => c.filter((cid) => {
        const cam = MOCK_CAMERAS.find((mc) => mc.id === cid);
        return cam && next.includes(cam.areaId);
      }));
      return next;
    });
  }
  function toggleCamera(id: string) {
    setCameraIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }

  function commitDeploy() {
    if (!canDeploy || !selectedModel || !selectedSite) return;
    const now = new Date();
    const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const dStr = `${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}, ${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
    const records: DeploymentData[] = selectedCameras.map((cam) => ({
      id: nextDeploymentId(),
      modelId: selectedModel.id,
      modelName: selectedModel.name,
      cameraId: cam.id,
      cameraName: cam.name,
      siteId: selectedSite.siteId,
      siteName: selectedSite.siteName,
      areaId: cam.areaId,
      areaName: cam.areaName,
      status: cam.status === "online" ? "active" : "pending-camera",
      deployedBy: "Delbin Arkar",
      deployedAt: now.toISOString(),
      deployedAtDisplay: dStr,
      lastValidationRunId: "ANY_001",
      stoppedAt: null,
      stoppedAtDisplay: null,
      eventCount: 0,
    }));
    onCommit(records);
    // Reset for next deploy
    setModelId(null);
    setSiteId(null);
    setAreaIds([]);
    setCameraIds([]);
    setConfirmOpen(false);
  }

  return (
    <div className="flex h-[calc(100vh-12rem)] min-h-[640px] flex-col gap-4">

      {/* 4 columns */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-4">

        <WizardColumn
          title="Model"
          description="Choose your AI model"
          count={modelId ? 1 : 0}
          search={modelSearch}
          onSearchChange={setModelSearch}
          searchPlaceholder="Search model"
        >
          {filteredModels.length === 0 ? (
            <EmptyState icon={<Cpu className="size-7 opacity-30" />} text="No deployable models" />
          ) : (
            filteredModels.map((m) => (
              <ModelCard key={m.id} model={m} selected={modelId === m.id} onClick={() => pickModel(m.id)} />
            ))
          )}
        </WizardColumn>

        <WizardColumn
          title="Site"
          description="Choose your deployment site"
          count={siteId ? 1 : 0}
          search={siteSearch}
          onSearchChange={setSiteSearch}
          searchPlaceholder="Search site"
        >
          {filteredSites.length === 0 ? (
            <EmptyState icon={<MapPin className="size-7 opacity-30" />} text="No matching sites" />
          ) : (
            filteredSites.map((s) => (
              <SiteCard key={s.siteId} site={s} selected={siteId === s.siteId} onClick={() => pickSite(s.siteId)} />
            ))
          )}
        </WizardColumn>

        <WizardColumn
          title="Area"
          description="Pick one or more areas"
          count={areaIds.length}
          countTotal={siteId ? allAreas.length : undefined}
          search={areaSearch}
          onSearchChange={setAreaSearch}
          searchPlaceholder="Search area"
        >
          {!siteId ? (
            <EmptyState icon={<MapPin className="size-7 opacity-30" />} text="Pick a site first" />
          ) : filteredAreas.length === 0 ? (
            <EmptyState icon={<MapPin className="size-7 opacity-30" />} text="No areas at this site" />
          ) : (
            filteredAreas.map((a) => (
              <AreaCard key={a.areaId} area={a} selected={areaIds.includes(a.areaId)} onToggle={() => toggleArea(a.areaId)} />
            ))
          )}
        </WizardColumn>

        <WizardColumn
          title="Camera"
          description="Pick one or more cameras"
          count={cameraIds.length}
          countTotal={areaIds.length > 0 ? allCamerasForAreas.length : undefined}
          search={cameraSearch}
          onSearchChange={setCameraSearch}
          searchPlaceholder="Search camera"
        >
          {areaIds.length === 0 ? (
            <EmptyState icon={<Video className="size-7 opacity-30" />} text="Pick at least one area first" />
          ) : filteredCameras.length === 0 ? (
            <EmptyState icon={<Video className="size-7 opacity-30" />} text="No cameras in selected areas" />
          ) : (
            filteredCameras.map((c) => (
              <CameraCard key={c.id} camera={c} selected={cameraIds.includes(c.id)} onToggle={() => toggleCamera(c.id)} />
            ))
          )}
        </WizardColumn>
      </div>

      {/* Summary bar */}
      <SummaryBar
        model={selectedModel}
        site={selectedSite}
        selectedAreas={selectedAreas}
        selectedCameras={selectedCameras}
        canDeploy={canDeploy}
        onDeploy={() => setConfirmOpen(true)}
      />

      {/* Confirm modal */}
      <Dialog open={confirmOpen} onOpenChange={(v) => !v && setConfirmOpen(false)}>
        <DialogContent className="w-[560px] max-w-[95vw] p-0">
          <DialogHeader className="border-b border-border px-5 py-4">
            <DialogTitle className="flex items-center gap-2.5 text-base font-bold">
              <Rocket className="size-4 text-primary" />
              Confirm Deployment
            </DialogTitle>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              Creating {selectedCameras.length} deployment record{selectedCameras.length === 1 ? "" : "s"}.
            </p>
          </DialogHeader>
          {selectedModel && selectedSite && (
            <div className="space-y-3 px-5 py-4">
              <KvRow label="Model" value={selectedModel.name} />
              <KvRow label="Site" value={selectedSite.siteName} />
              <KvRow label="Areas" value={`${selectedAreas.length} (${selectedAreas.map((a) => a.areaName).join(", ")})`} />
              <KvRow label="Cameras" value={`${selectedCameras.length} selected`} />
              {selectedCameras.some((c) => c.status !== "online") && (
                <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/[0.06] px-3 py-2 text-[11px] text-muted-foreground">
                  <AlertTriangle className="size-3.5 flex-shrink-0 text-warning" />
                  Some cameras are offline. Those deployments will queue as "Pending" and auto-resume on reconnect.
                </div>
              )}
            </div>
          )}
          <div className="flex justify-end gap-2 border-t border-border px-5 py-3.5">
            <Button variant="ghost" size="sm" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={commitDeploy} className="gap-1.5">
              <Rocket className="size-3.5" />
              Deploy {selectedCameras.length} Camera{selectedCameras.length === 1 ? "" : "s"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KvRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/40 pb-2 last:border-0 last:pb-0">
      <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground/60">{label}</span>
      <span className="text-[12.5px] font-semibold text-foreground">{value}</span>
    </div>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-2 text-center text-muted-foreground">
      {icon}
      <p className="text-[12px]">{text}</p>
    </div>
  );
}

/* ─── History view ───────────────────────────────────────────────────────── */


interface ModelAggregate {
  modelId: string;
  modelName: string;
  totalCameras: number;
  active: number;
  paused: number;
  failed: number;
  totalEvents: number;
  health: ModelHealth;
  deployments: DeploymentData[];
}

function HistoryView({
  deployments,
}: {
  deployments: DeploymentData[];
}) {
  const navigate = useNavigate();
  const [search, setSearch] = React.useState("");
  const [healthFilter, setHealthFilter] = React.useState<ModelHealth | "all">("all");
  const [drawerModelId, setDrawerModelId] = React.useState<string | null>(null);

  /* Aggregate deployments by modelId */
  const models = React.useMemo<ModelAggregate[]>(() => {
    const map = new Map<string, ModelAggregate>();
    for (const d of deployments) {
      let bucket = map.get(d.modelId);
      if (!bucket) {
        bucket = {
          modelId: d.modelId,
          modelName: d.modelName,
          totalCameras: 0,
          active: 0,
          paused: 0,
          failed: 0,
          totalEvents: 0,
          health: "offline",
          deployments: [],
        };
        map.set(d.modelId, bucket);
      }
      bucket.totalCameras++;
      bucket.totalEvents += d.eventCount;
      if (d.status === "active") bucket.active++;
      else if (d.status === "paused") bucket.paused++;
      else if (d.status === "failed") bucket.failed++;
      bucket.deployments.push(d);
    }
    for (const b of map.values()) b.health = computeModelHealth(b.deployments);
    return Array.from(map.values());
  }, [deployments]);

  const filteredModels = React.useMemo(() => {
    return models.filter((m) => {
      if (healthFilter !== "all" && m.health !== healthFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!m.modelName.toLowerCase().includes(q) && !m.modelId.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [models, healthFilter, search]);

  const healthCounts = React.useMemo(() => {
    const init: Record<ModelHealth, number> = { healthy: 0, degraded: 0, offline: 0, overloaded: 0 };
    for (const m of models) init[m.health]++;
    return init;
  }, [models]);

  const drawerModel = drawerModelId ? models.find((m) => m.modelId === drawerModelId) ?? null : null;

  return (
    <div className="flex flex-col gap-4">

      {/* Health filter strip */}
      <KpiGrid cols={5}>
        <KpiCard
          label="All Models"
          value={models.length}
          sub="Across all sites"
          accent="primary"
          active={healthFilter === "all"}
          onClick={() => setHealthFilter("all")}
        />
        {(["healthy", "degraded", "offline", "overloaded"] as ModelHealth[]).map((h) => {
          const accent: KpiAccent =
            h === "healthy"    ? "success" :
            h === "degraded"   ? "warning" :
            h === "offline"    ? "muted"   :
                                 "sev-critical";
          return (
            <KpiCard
              key={h}
              label={MODEL_HEALTH_STYLES[h].label}
              value={healthCounts[h]}
              sub={
                h === "healthy"    ? "All cameras running" :
                h === "degraded"   ? "Some cameras paused"  :
                h === "offline"    ? "No active cameras"    :
                                     "Excessive event load"
              }
              accent={accent}
              active={healthFilter === h}
              onClick={() => setHealthFilter((cur) => (cur === h ? "all" : h))}
            />
          );
        })}
      </KpiGrid>

      {/* Search */}
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2">
        <Search className="size-3.5 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search models by name or ID…"
          className="w-full bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground"
        />
        <p className="flex-shrink-0 text-[11px] text-muted-foreground">
          <strong className="text-foreground">{filteredModels.length}</strong> of {models.length} models
        </p>
      </div>

      {/* Model grid */}
      {filteredModels.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-20 text-muted-foreground">
          <Rocket className="size-10 opacity-20" />
          <p className="text-sm">No models match the current filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredModels.map((m) => {
            const s = MODEL_HEALTH_STYLES[m.health];
            return (
              <button
                key={m.modelId}
                onClick={() => setDrawerModelId(m.modelId)}
                className={cn(
                  "group flex flex-col gap-3 rounded-xl border bg-card px-4 py-3.5 text-left transition-colors hover:border-primary/40",
                  m.health === "overloaded" ? "border-sev-critical/30" :
                  m.health === "degraded"   ? "border-warning/30"      :
                  m.health === "offline"    ? "border-border"          :
                                              "border-success/30"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-bold text-foreground group-hover:text-primary">
                      {m.modelName}
                    </p>
                    <p className="font-mono text-[10px] text-muted-foreground">{m.modelId}</p>
                  </div>
                  <ModelHealthPill health={m.health} />
                </div>

                <div className="flex items-baseline gap-1.5">
                  <span className={cn("font-mono text-[26px] font-bold leading-none", s.text)}>
                    {m.totalCameras}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    camera{m.totalCameras === 1 ? "" : "s"} deployed
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                  <Stat label="Active"  value={m.active}  tone="success" />
                  <Stat label="Paused"  value={m.paused}  tone="warning" />
                  <Stat label="Failed"  value={m.failed}  tone="sev-critical" />
                </div>

                <div className="flex items-center justify-between border-t border-border/60 pt-2 text-[10px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Eye className="size-3" />
                    {m.totalEvents.toLocaleString()} events
                  </span>
                  <span className="inline-flex items-center gap-1 text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    Open details
                    <ChevronRight className="size-3" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {drawerModel && (
        <ModelDeploymentsDrawer
          model={drawerModel}
          onClose={() => setDrawerModelId(null)}
          onOpenCamera={(id) => navigate("/site/cameras", { state: { openCameraId: id } })}
        />
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: "success" | "warning" | "sev-critical" }) {
  const txt =
    tone === "success"      ? "text-success" :
    tone === "warning"      ? "text-warning" :
                              "text-sev-critical";
  return (
    <div className="rounded-md border border-border/60 bg-background px-2 py-1.5">
      <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/70">{label}</p>
      <p className={cn("mt-0.5 font-mono text-[13px] font-bold leading-none", txt)}>{value}</p>
    </div>
  );
}

/* ── Model deployments drawer — cameras using a given model ─────────────── */

function ModelDeploymentsDrawer({
  model,
  onClose,
  onOpenCamera,
}: {
  model: ModelAggregate;
  onClose: () => void;
  onOpenCamera: (cameraId: string) => void;
}) {
  const [siteFilter, setSiteFilter] = React.useState<string[]>([]);
  const [areaFilter, setAreaFilter] = React.useState<string[]>([]);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  /* Reset selection when filters change */
  const rows = React.useMemo(() => {
    return model.deployments.filter((d) => {
      if (siteFilter.length > 0 && !siteFilter.includes(d.siteId)) return false;
      if (areaFilter.length > 0 && !areaFilter.includes(d.areaId)) return false;
      return true;
    });
  }, [model.deployments, siteFilter, areaFilter]);

  const siteOptions = React.useMemo(() => {
    const seen = new Set<string>();
    return model.deployments
      .filter((d) => (seen.has(d.siteId) ? false : seen.add(d.siteId)))
      .map((d) => ({ value: d.siteId, label: d.siteName }));
  }, [model.deployments]);

  const areaOptions = React.useMemo(() => {
    const seen = new Set<string>();
    return model.deployments
      .filter((d) => (seen.has(d.areaId) ? false : seen.add(d.areaId)))
      .map((d) => ({ value: d.areaId, label: `${d.areaName} · ${d.siteName}` }));
  }, [model.deployments]);

  function toggleRow(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((s) => {
      if (s.size === rows.length) return new Set();
      return new Set(rows.map((r) => r.id));
    });
  }

  function runAction(label: string) {
    toast.success(`${label} · ${selected.size} camera${selected.size === 1 ? "" : "s"}`, {
      description: `Action queued for ${selected.size} deployment${selected.size === 1 ? "" : "s"} of ${model.modelName}.`,
    });
    setSelected(new Set());
  }

  const selectedCount = selected.size;
  const allChecked = rows.length > 0 && selectedCount === rows.length;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <aside className="absolute inset-y-0 right-0 flex w-[min(960px,68vw)] max-w-[95vw] flex-col bg-background shadow-2xl">
        {/* Header */}
        <div className="border-b border-border bg-card px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-1.5">
                <ModelHealthPill health={model.health} />
              </div>
              <h2 className="text-[17px] font-bold leading-snug text-foreground">{model.modelName}</h2>
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                <span className="font-mono">{model.modelId}</span>
                {" · "}
                <strong className="text-foreground">{model.totalCameras}</strong> camera{model.totalCameras === 1 ? "" : "s"}
                {" · "}
                <strong className="text-foreground">{model.totalEvents.toLocaleString()}</strong> events
              </p>
            </div>
            <button
              onClick={onClose}
              className="mt-0.5 flex size-7 flex-shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-card/40 px-5 py-3">
          <DrawerFilter label="Site"  options={siteOptions} selected={siteFilter} onChange={setSiteFilter} icon={MapPin} />
          <DrawerFilter label="Area"  options={areaOptions} selected={areaFilter} onChange={setAreaFilter} icon={Crosshair} />
          {(siteFilter.length > 0 || areaFilter.length > 0) && (
            <button
              onClick={() => { setSiteFilter([]); setAreaFilter([]); }}
              className="text-[11px] text-muted-foreground underline hover:text-foreground"
            >
              Clear
            </button>
          )}
          <p className="ml-auto text-[11px] text-muted-foreground">
            Showing <strong className="text-foreground">{rows.length}</strong> of {model.totalCameras}
          </p>
        </div>

        {/* Camera table */}
        <div className="flex-1 overflow-auto">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-20 text-muted-foreground">
              <Video className="size-8 opacity-30" />
              <p className="text-[13px]">No cameras match the current filters.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="sticky top-0 bg-muted/30 backdrop-blur">
                <tr className="border-b border-border text-left">
                  <th className="w-10 px-4 py-2.5">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      onChange={toggleAll}
                      className="size-3.5 accent-primary"
                    />
                  </th>
                  {["CAMERA", "LOCATION", "STATUS", "EVENTS", "DEPLOYED"].map((h) => (
                    <th key={h} className="px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {rows.map((d) => {
                  const isSel = selected.has(d.id);
                  return (
                    <tr
                      key={d.id}
                      onClick={() => toggleRow(d.id)}
                      className={cn(
                        "cursor-pointer text-[13px] transition-colors",
                        isSel ? "bg-primary/[0.05]" : "hover:bg-muted/20"
                      )}
                    >
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSel}
                          onChange={() => toggleRow(d.id)}
                          className="size-3.5 accent-primary"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          <button
                            onClick={(e) => { e.stopPropagation(); onOpenCamera(d.cameraId); }}
                            className="text-left font-semibold text-foreground hover:text-primary"
                          >
                            {d.cameraName}
                          </button>
                          <span className="font-mono text-[10px] text-muted-foreground">{d.cameraId}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-foreground">{d.areaName}</span>
                          <span className="text-[10px]">{d.siteName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3"><StatusPill status={d.status} /></td>
                      <td className="px-4 py-3 font-mono text-foreground">{d.eventCount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="size-3" />
                          {d.deployedAtDisplay}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Bottom action bar — only when selection is non-empty */}
        {selectedCount > 0 && (
          <div className="flex flex-shrink-0 items-center justify-between gap-3 border-t border-border bg-card px-5 py-3 shadow-lg">
            <p className="text-[12px] text-foreground">
              <strong>{selectedCount}</strong> camera{selectedCount === 1 ? "" : "s"} selected
              <button onClick={() => setSelected(new Set())} className="ml-2 text-muted-foreground underline hover:text-foreground">
                Clear
              </button>
            </p>
            <div className="flex items-center gap-1.5">
              <Button size="sm" variant="outline" onClick={() => runAction("Restarted")} className="gap-1.5">
                <Rocket className="size-3" />
                Restart
              </Button>
              <Button size="sm" variant="outline" onClick={() => runAction("Paused")} className="gap-1.5">
                <Pause className="size-3" />
                Pause
              </Button>
              <Button size="sm" variant="outline" onClick={() => runAction("Stopped")} className="gap-1.5">
                <Square className="size-3" />
                Stop
              </Button>
              <Button size="sm" variant="destructive" onClick={() => runAction("Removed model from")} className="gap-1.5">
                <Trash2 className="size-3" />
                Remove
              </Button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

function DrawerFilter({
  label,
  icon: Icon,
  options,
  selected,
  onChange,
}: {
  label: string;
  icon: React.ElementType;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const display =
    selected.length === 0           ? `All ${label.toLowerCase()}s` :
    selected.length === 1           ? options.find((o) => o.value === selected[0])?.label ?? "1 selected" :
                                      `${selected.length} ${label.toLowerCase()}s`;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "inline-flex h-8 items-center justify-between gap-2 rounded-md border bg-background pl-2.5 pr-2 text-[12px] font-semibold transition-colors",
            open ? "border-primary" : "border-input",
            selected.length === 0 ? "text-muted-foreground" : "text-foreground"
          )}
          style={{ minWidth: "160px" }}
        >
          <span className="inline-flex items-center gap-1.5">
            <Icon className="size-3" />
            {display}
          </span>
          <ChevronDown className={cn("size-3 text-muted-foreground transition-transform", open && "rotate-180")} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="max-h-[260px] w-60 overflow-y-auto p-1.5">
        <button
          onClick={() => onChange([])}
          className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[12px] text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <div className={cn("flex size-3.5 flex-shrink-0 items-center justify-center rounded border",
            selected.length === 0 ? "border-primary bg-primary" : "border-muted-foreground/40")}>
            {selected.length === 0 && <Check className="size-2.5 text-primary-foreground" strokeWidth={3} />}
          </div>
          All {label.toLowerCase()}s
        </button>
        <div className="my-1 border-t border-border" />
        {options.map((o) => {
          const checked = selected.includes(o.value);
          return (
            <button
              key={o.value}
              onClick={() => onChange(checked ? selected.filter((x) => x !== o.value) : [...selected, o.value])}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[12px] text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <div className={cn("flex size-3.5 flex-shrink-0 items-center justify-center rounded border",
                checked ? "border-primary bg-primary" : "border-muted-foreground/40")}>
                {checked && <Check className="size-2.5 text-primary-foreground" strokeWidth={3} />}
              </div>
              <span className="truncate">{o.label}</span>
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function ModelDeploymentPage() {
  const [tab, setTab] = React.useState<"deploy" | "history">("deploy");
  const [deployments, setDeployments] = React.useState<DeploymentData[]>(MOCK_DEPLOYMENTS);

  function handleCommit(newRecords: DeploymentData[]) {
    setDeployments((prev) => [...newRecords, ...prev]);
    setTab("history");
    toast.success(
      newRecords.length === 1
        ? `${newRecords[0].modelName} deployed`
        : `${newRecords.length} models deployed`,
      { description: "View status in the History tab." }
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader>
        <PageHeader.Content>
          <PageHeader.Title>Model Deployment</PageHeader.Title>
          <PageHeader.Description>
            Deploy validated AI models to cameras across sites — the final stage of the validation pipeline.
          </PageHeader.Description>
        </PageHeader.Content>
        <PageHeader.Actions>
          <div data-slot="button-group" className="flex h-7 items-center rounded-md border border-border bg-background p-0.5">
            <button onClick={() => setTab("deploy")}
              className={cn("inline-flex h-full items-center gap-1.5 rounded px-2.5 text-[12px] font-semibold transition-colors",
                tab === "deploy" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
              <Plus className="size-3.5" />
              Deploy
            </button>
            <button onClick={() => setTab("history")}
              className={cn("inline-flex h-full items-center gap-1.5 rounded px-2.5 text-[12px] font-semibold transition-colors",
                tab === "history" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
              <FileText className="size-3.5" />
              Models
            </button>
          </div>
        </PageHeader.Actions>
      </PageHeader>

      {tab === "deploy" ? (
        <DeployWizard onCommit={handleCommit} />
      ) : (
        <HistoryView deployments={deployments} />
      )}
    </div>
  );
}
