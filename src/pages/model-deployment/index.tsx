import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
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
  MoreVertical,
  Pencil,
  Pause,
  Square,
  Shield,
  Crosshair,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PageHeader } from "@/components/layout/PageHeader";
import { cn } from "@/lib/utils";
import { MOCK_MODELS } from "@/mocks/modelManagement";
import { MOCK_CAMERAS, CAMERA_SITES, CAMERA_AREAS } from "@/mocks/cameras";
import {
  MOCK_DEPLOYMENTS,
  getSiteSummaries,
  getAreaSummaries,
  nextDeploymentId,
} from "@/mocks/deployments";
import type { ModelData } from "@/types/modelManagement";
import type { CameraData } from "@/types/cameras";
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
      {confirmOpen && selectedModel && selectedSite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="flex max-h-[85vh] w-[560px] max-w-[95vw] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
            <div className="border-b border-border px-5 py-4">
              <div className="flex items-center gap-2.5 text-[15px] font-bold text-foreground">
                <Rocket className="size-4 text-primary" />
                Confirm Deployment
              </div>
              <p className="mt-1 text-[12px] text-muted-foreground">
                Creating {selectedCameras.length} deployment record{selectedCameras.length === 1 ? "" : "s"}.
              </p>
            </div>
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
            <div className="flex justify-end gap-2 border-t border-border bg-background px-5 py-3.5">
              <Button variant="outline" size="sm" onClick={() => setConfirmOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={commitDeploy} className="gap-1.5">
                <Rocket className="size-3.5" />
                Deploy {selectedCameras.length} Camera{selectedCameras.length === 1 ? "" : "s"}
              </Button>
            </div>
          </div>
        </div>
      )}
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

type HistoryKpi = "all" | "active" | "paused" | "pending-camera" | "stopped" | "failed";

const HISTORY_KPIS: {
  key: HistoryKpi;
  label: string;
  sub: string;
  barClass: string;
  valueClass: string;
  activeClass: string;
  getValue: (items: DeploymentData[]) => number;
}[] = [
  { key: "all",            label: "Total",   sub: "All recorded",    barClass: "bg-muted-foreground/30", valueClass: "text-foreground",       activeClass: "border-primary",       getValue: (it) => it.length },
  { key: "active",         label: "Active",  sub: "Producing events",barClass: "bg-success",             valueClass: "text-success",          activeClass: "border-success",       getValue: (it) => it.filter((d) => d.status === "active").length },
  { key: "paused",         label: "Paused",  sub: "Auto-paused",     barClass: "bg-warning",         valueClass: "text-warning",      activeClass: "border-warning",   getValue: (it) => it.filter((d) => d.status === "paused").length },
  { key: "pending-camera", label: "Pending", sub: "Awaiting camera", barClass: "bg-info",                valueClass: "text-info",             activeClass: "border-info",          getValue: (it) => it.filter((d) => d.status === "pending-camera").length },
  { key: "stopped",        label: "Stopped", sub: "Manually halted", barClass: "bg-muted-foreground",    valueClass: "text-muted-foreground", activeClass: "border-muted-foreground", getValue: (it) => it.filter((d) => d.status === "stopped").length },
  { key: "failed",         label: "Failed",  sub: "Couldn't start",  barClass: "bg-sev-critical",        valueClass: "text-sev-critical",     activeClass: "border-sev-critical",  getValue: (it) => it.filter((d) => d.status === "failed").length },
];

function KpiCard({
  config,
  items,
  active,
  onClick,
}: {
  config: (typeof HISTORY_KPIS)[number];
  items: DeploymentData[];
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-xl border bg-card px-3.5 py-3 text-left transition-all hover:border-primary hover:-translate-y-px",
        active ? `${config.activeClass} bg-primary-muted` : "border-border"
      )}
    >
      {active && (
        <span className="absolute right-1.5 top-1.5 max-w-[55px] text-right text-[8.5px] font-bold uppercase leading-[1.05] tracking-tight text-primary">
          Active Filter
        </span>
      )}
      <div className={cn("absolute inset-x-0 top-0 h-0.5", config.barClass)} />
      <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
        {config.label}
      </div>
      <div className={cn("text-[26px] font-bold leading-none", config.valueClass)}>
        {config.getValue(items)}
      </div>
      <div className="mt-1 text-[10.5px] text-muted-foreground">{config.sub}</div>
    </button>
  );
}

interface DepFilters {
  site: string[];
  area: string[];
  status: string[];
  model: string[];
}
const EMPTY_DEP_FILTERS: DepFilters = { site: [], area: [], status: [], model: [] };

function FilterDropdown({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
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
          <span className="truncate font-medium">{displayLabel}</span>
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
              <span className={cn(
                "flex size-3.5 flex-shrink-0 items-center justify-center rounded border transition-colors",
                checked ? "border-primary bg-primary" : "border-muted-foreground/40"
              )}>
                {checked && <Check className="size-2.5 text-primary-foreground" strokeWidth={3} />}
              </span>
              {opt.label}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

const STATUS_OPTS = [
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "pending-camera", label: "Pending" },
  { value: "stopped", label: "Stopped" },
  { value: "failed", label: "Failed" },
];

function FilterPanel({
  filters,
  onChange,
  search,
  onSearchChange,
}: {
  filters: DepFilters;
  onChange: (f: DepFilters) => void;
  search: string;
  onSearchChange: (v: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const count = Object.values(filters).reduce((a, b) => a + b.length, 0) + (search ? 1 : 0);
  function setGroup(g: keyof DepFilters, v: string[]) {
    onChange({ ...filters, [g]: v });
  }
  const modelOpts = MOCK_MODELS.map((m) => ({ value: m.id, label: m.name }));
  return (
    <div className="rounded-xl border border-border bg-card">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-muted/30"
      >
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <SlidersHorizontal className="size-4 flex-shrink-0 text-muted-foreground" />
          <span className="text-[13px] font-semibold text-foreground">Filters</span>
          {count > 0 ? (
            <span className="rounded-full bg-primary px-2 py-px text-[11px] font-semibold text-primary-foreground">
              {count} active
            </span>
          ) : (
            <div className="hidden flex-wrap gap-1.5 sm:flex">
              {["All sites", "All areas", "All models", "All statuses"].map((l) => (
                <span key={l} className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-[11px] text-muted-foreground">
                  {l}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {count > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); onChange(EMPTY_DEP_FILTERS); onSearchChange(""); }}
              className="text-[12px] text-muted-foreground underline hover:text-primary"
            >
              Clear all
            </button>
          )}
          {open ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
        </div>
      </button>
      {open && (
        <div className="space-y-3 rounded-b-xl border-t border-border bg-background px-4 py-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by ID, model, camera, or operator…"
              className="h-9 pl-9 text-[13px]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { key: "site"   as const, label: "Site",   opts: CAMERA_SITES },
              { key: "area"   as const, label: "Area",   opts: CAMERA_AREAS },
              { key: "model"  as const, label: "Model",  opts: modelOpts },
              { key: "status" as const, label: "Status", opts: STATUS_OPTS },
            ].map(({ key, label, opts }) => (
              <div key={key}>
                <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
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

function DeploymentDrawer({
  deployment,
  onClose,
  onOpenCamera,
}: {
  deployment: DeploymentData;
  onClose: () => void;
  onOpenCamera: (id: string) => void;
}) {
  const camera = MOCK_CAMERAS.find((c) => c.id === deployment.cameraId);
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-[560px] max-w-[92vw] flex-col overflow-hidden border-l border-border bg-card shadow-2xl"
      >
        <div className="flex flex-shrink-0 items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <p className="truncate text-[15px] font-bold text-foreground">{deployment.modelName}</p>
              <span className="rounded border border-border bg-muted px-1.5 py-px font-mono text-[10px] text-muted-foreground">
                {deployment.id}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
              <StatusPill status={deployment.status} />
              <span>·</span>
              <span>Deployed by {deployment.deployedBy}</span>
              <span>·</span>
              <span>{deployment.deployedAtDisplay}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {deployment.status === "active" && (
              <Button variant="outline" size="sm" className="gap-1.5">
                <Pause className="size-3.5" />
                Pause
              </Button>
            )}
            {(deployment.status === "active" || deployment.status === "paused" || deployment.status === "pending-camera") && (
              <Button variant="outline" size="sm" className="gap-1.5 text-sev-critical hover:border-sev-critical/40 hover:bg-sev-critical/10 hover:text-sev-critical">
                <Square className="size-3.5" />
                Stop
              </Button>
            )}
            <button
              onClick={onClose}
              className="flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">

          {deployment.status === "failed" && deployment.failureReason && (
            <div className="flex items-start gap-3 rounded-xl border border-sev-critical/30 bg-sev-critical/[0.06] px-4 py-3">
              <AlertTriangle className="size-5 flex-shrink-0 text-sev-critical" />
              <div>
                <p className="text-[13px] font-semibold text-foreground">Deployment failed to start</p>
                <p className="mt-0.5 text-[12px] text-muted-foreground">{deployment.failureReason}</p>
              </div>
            </div>
          )}

          {deployment.status === "pending-camera" && (
            <div className="flex items-start gap-3 rounded-xl border border-info/30 bg-info/[0.06] px-4 py-3">
              <AlertTriangle className="size-5 flex-shrink-0 text-info" />
              <div>
                <p className="text-[13px] font-semibold text-foreground">Awaiting camera reconnect</p>
                <p className="mt-0.5 text-[12px] text-muted-foreground">
                  Camera was offline at deploy time. Deployment will auto-resume on reconnect.
                </p>
              </div>
            </div>
          )}

          {/* Camera summary */}
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Target Camera
            </p>
            <button
              onClick={() => onOpenCamera(deployment.cameraId)}
              className="group flex w-full items-center gap-3 rounded-lg border border-border bg-card px-3.5 py-3 text-left transition-colors hover:border-primary/40 hover:bg-muted/30"
            >
              <div className="flex size-8 flex-shrink-0 items-center justify-center rounded-lg border border-info/30 bg-info/10">
                <Video className="size-4 text-info" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-semibold text-foreground">{deployment.cameraName}</p>
                <p className="text-[10px] text-muted-foreground">
                  {deployment.cameraId} · {deployment.areaName} · {deployment.siteName}
                </p>
              </div>
              <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary" />
            </button>
            {camera && !camera.nvrId && (
              <div className="mt-2 flex items-center gap-1.5 rounded-md border border-warning/30 bg-warning/[0.06] px-2 py-1 text-[10.5px] text-warning">
                <AlertTriangle className="size-3" />
                Camera has no NVR linked — events lack replayable footage.
              </div>
            )}
          </div>

          {/* Run metadata */}
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Deployment Metadata
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Kv label="Deployed By" value={deployment.deployedBy} />
              <Kv label="Deployed At" value={deployment.deployedAtDisplay} />
              <Kv label="Validation Run" value={deployment.lastValidationRunId ?? "—"} mono />
              <Kv label="Events Produced" value={String(deployment.eventCount)} />
              {deployment.stoppedAtDisplay && <Kv label="Stopped At" value={deployment.stoppedAtDisplay} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Kv({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2">
      <p className="mb-0.5 font-mono text-[9px] uppercase tracking-widest text-muted-foreground/60">{label}</p>
      <p className={cn("text-[12px] font-semibold text-foreground", mono && "font-mono")}>{value}</p>
    </div>
  );
}

function HistoryView({
  deployments,
}: {
  deployments: DeploymentData[];
}) {
  const navigate = useNavigate();
  const [search, setSearch] = React.useState("");
  const [filters, setFilters] = React.useState<DepFilters>(EMPTY_DEP_FILTERS);
  const [kpi, setKpi] = React.useState<HistoryKpi>("all");
  const [sortAsc, setSortAsc] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [drawerId, setDrawerId] = React.useState<string | null>(null);
  const pageSize = 10;

  const filtered = React.useMemo(() => {
    let list = deployments.filter((d) => {
      if (kpi !== "all" && d.status !== kpi) return false;
      if (filters.site.length > 0 && !filters.site.includes(d.siteId)) return false;
      if (filters.area.length > 0 && !filters.area.includes(d.areaId)) return false;
      if (filters.model.length > 0 && !filters.model.includes(d.modelId)) return false;
      if (filters.status.length > 0 && !filters.status.includes(d.status)) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = [d.id, d.modelName, d.cameraName, d.cameraId, d.deployedBy, d.siteName, d.areaName].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    list = [...list].sort((a, b) =>
      sortAsc ? a.deployedAt.localeCompare(b.deployedAt) : b.deployedAt.localeCompare(a.deployedAt)
    );
    return list;
  }, [deployments, kpi, filters, search, sortAsc]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);
  const drawerDep = drawerId ? deployments.find((d) => d.id === drawerId) ?? null : null;
  const hasFilters = !!(search || Object.values(filters).some((a) => a.length > 0) || kpi !== "all");

  return (
    <div className="flex flex-col gap-4">

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        {HISTORY_KPIS.map((cfg) => (
          <KpiCard
            key={cfg.key}
            config={cfg}
            items={deployments}
            active={kpi === cfg.key}
            onClick={() => { setKpi((cur) => (cur === cfg.key ? "all" : cfg.key)); setPage(1); }}
          />
        ))}
      </div>

      <FilterPanel filters={filters} onChange={(f) => { setFilters(f); setPage(1); }} search={search} onSearchChange={(v) => { setSearch(v); setPage(1); }} />

      {/* Count + sort */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] text-muted-foreground">
          <strong className="text-foreground">{filtered.length}</strong>{" "}
          {filtered.length === 1 ? "deployment" : "deployments"} match current filters
          {hasFilters && (
            <button
              onClick={() => { setSearch(""); setFilters(EMPTY_DEP_FILTERS); setKpi("all"); }}
              className="ml-2 text-muted-foreground underline hover:text-primary"
            >
              Clear filters
            </button>
          )}
        </p>
        <div className="relative flex-shrink-0">
          <select
            value={sortAsc ? "oldest" : "newest"}
            onChange={(e) => setSortAsc(e.target.value === "oldest")}
            className="h-9 appearance-none rounded-lg border border-border bg-card pl-3 pr-8 text-[12px] text-foreground focus:border-primary focus:outline-none"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-20 text-muted-foreground">
          <Rocket className="size-10 opacity-20" />
          <p className="text-sm">No deployments match the current filters.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30">
                <tr className="border-b border-border text-left">
                  {["ID", "MODEL", "CAMERA", "LOCATION", "STATUS", "DEPLOYED", "EVENTS", ""].map((h) => (
                    <th key={h} className="px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {pageItems.map((d) => (
                  <tr
                    key={d.id}
                    onClick={() => navigate("/site/cameras", { state: { openCameraId: d.cameraId } })}
                    className="group cursor-pointer text-[13px] transition-colors hover:bg-muted/20"
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-[12px] font-semibold text-muted-foreground transition-colors group-hover:text-primary">
                        {d.id}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-foreground transition-colors group-hover:text-primary">
                        {d.modelName}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      <div className="flex flex-col gap-0.5">
                        <span>{d.cameraName}</span>
                        <span className="font-mono text-[11px] text-muted-foreground">{d.cameraId}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-foreground">{d.areaName}</span>
                        <span className="text-[11px]">{d.siteName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><StatusPill status={d.status} /></td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div className="flex flex-col gap-0.5">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="size-3" />
                          {d.deployedAtDisplay}
                        </span>
                        <span className="text-[11px]">by {d.deployedBy}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-foreground">{d.eventCount.toLocaleString()}</td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground">
                            <MoreVertical className="size-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-44 p-1" align="end">
                          <button
                            onClick={() => setDrawerId(d.id)}
                            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[12px] text-foreground hover:bg-muted"
                          >
                            <Rocket className="size-3.5 text-muted-foreground" />
                            View details
                          </button>
                          <button
                            onClick={() => navigate(`/site/cameras?camera=${d.cameraId}`)}
                            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[12px] text-foreground hover:bg-muted"
                          >
                            <Video className="size-3.5 text-muted-foreground" />
                            Open camera
                          </button>
                          <button className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[12px] text-foreground hover:bg-muted">
                            <Pencil className="size-3.5 text-muted-foreground" />
                            Edit
                          </button>
                          <div className="my-1 border-t border-border" />
                          <button className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[12px] text-sev-critical hover:bg-sev-critical/10">
                            <Trash2 className="size-3.5" />
                            Stop &amp; remove
                          </button>
                        </PopoverContent>
                      </Popover>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
            <p className="text-[12px] text-muted-foreground">
              {filtered.length === 0
                ? "0 of 0"
                : `${(page - 1) * pageSize + 1} – ${Math.min(page * pageSize, filtered.length)} of ${filtered.length}`}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex size-7 items-center justify-center rounded border border-border text-muted-foreground hover:border-primary/30 hover:text-foreground disabled:opacity-40"
              >
                <ChevronLeft className="size-3.5" />
              </button>
              <span className="px-2 text-[12px] text-foreground">
                {page} <span className="text-muted-foreground/60">of {pageCount}</span>
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={page === pageCount}
                className="flex size-7 items-center justify-center rounded border border-border text-muted-foreground hover:border-primary/30 hover:text-foreground disabled:opacity-40"
              >
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {drawerDep && (
        <DeploymentDrawer
          deployment={drawerDep}
          onClose={() => setDrawerId(null)}
          onOpenCamera={(id) => { setDrawerId(null); navigate(`/site/cameras?camera=${id}`); }}
        />
      )}
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function ModelDeploymentPage() {
  const [tab, setTab] = React.useState<"deploy" | "history">("deploy");
  const [deployments, setDeployments] = React.useState<DeploymentData[]>(MOCK_DEPLOYMENTS);

  function handleCommit(newRecords: DeploymentData[]) {
    setDeployments((prev) => [...newRecords, ...prev]);
    setTab("history");
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
          <div data-slot="button-group" className="flex items-center rounded-lg border border-border bg-card p-0.5">
            <button onClick={() => setTab("deploy")}
              className={cn("flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors",
                tab === "deploy" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
              <Plus className="size-3.5" />
              Deploy
            </button>
            <button onClick={() => setTab("history")}
              className={cn("flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors",
                tab === "history" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
              <FileText className="size-3.5" />
              History ({deployments.length})
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
