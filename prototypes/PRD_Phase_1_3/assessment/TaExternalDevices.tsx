import * as React from "react";
import { toast } from "sonner";
import {
  Activity, Cable, Calendar, CircleCheck, MoreHorizontal, Pencil, Plus, Radio, RefreshCw, Search, Trash2, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { PageHeader } from "@/components/layout/PageHeader";
import { KpiCard, KpiGrid } from "@/components/shared/KpiCard";
import { FilterDropdown } from "@/components/shared/FilterDropdown";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@/components/shared/Modal";
import { cn } from "@/lib/utils";
import {
  CONNECTIONS, DEVICE_TYPES, DEVICE_TYPE_INFO, TA_AREAS, TA_SITES, USE_CASES, nextDeviceId, useDevicesStore, useSessionsStore,
  type Connection, type DeviceStatus, type DeviceType, type ExternalDevice,
} from "./taData";
import { useTaModelsStore } from "./taModels";

/* Site › External Devices — new page for the Training Assessment module.

   Non-camera hardware that runs alongside assessment sessions: launch monitors
   in golf bays, bar speed sensors on racks, depth cameras and force plates in
   clinic rooms. Each device is paired to one bay, rack or room, so Model
   Deployment can list it beside that unit's cameras, and its data joins the
   assessment results of whoever is in that unit. Laid out like NVR Devices. */

const STATUS_TONE: Record<DeviceStatus, "success" | "neutral" | "warning"> = { online: "success", offline: "neutral", pairing: "warning" };
const STATUS_LABEL: Record<DeviceStatus, string> = { online: "Online", offline: "Offline", pairing: "Pairing" };

type KpiKey = "all" | "online" | "offline" | "pairing" | "in-sessions";

const LIVE_READOUT: Record<DeviceType, [string, string][]> = {
  "Launch monitor": [["Club speed", "79 mph"], ["Ball speed", "104 mph"], ["Launch", "18.4°"], ["Carry", "148 m"]],
  "Bar speed sensor": [["Mean bar speed", "0.62 m/s"], ["Peak bar speed", "0.91 m/s"], ["Range", "54 cm"], ["Speed loss", "11%"]],
  "Depth camera": [["Depth range", "0.4–6 m"], ["Frame rate", "60 fps"], ["Joints tracked", "33"], ["Latency", "38 ms"]],
  "Force plate": [["Peak force", "1.42 × BW"], ["Weight shift L/R", "46 / 54%"], ["Sway area", "3.1 cm²"], ["Sample rate", "1000 Hz"]],
};

const LABEL = "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground";

/* ── Add / edit device ─────────────────────────────────────────────────── */

interface DeviceForm {
  type: DeviceType | "";
  model: string;
  serial: string;
  siteId: string;
  areaId: string;
  unit: string;
  connection: Connection | "";
  address: string;
  useInSessions: boolean;
}

const EMPTY_FORM: DeviceForm = { type: "", model: "", serial: "", siteId: "", areaId: "", unit: "", connection: "", address: "", useInSessions: true };

function DeviceModal({
  open, initial, onClose, onConfirm,
}: { open: boolean; initial?: ExternalDevice | null; onClose: () => void; onConfirm: (f: DeviceForm) => void }) {
  /* Mounted fresh for each open (see the page), so the form starts from the device. */
  const [f, setF] = React.useState<DeviceForm>(() => initial ? {
    type: initial.type, model: initial.model, serial: initial.serial, siteId: initial.siteId, areaId: initial.areaId, unit: initial.unit,
    connection: initial.connection, address: initial.address, useInSessions: initial.useInSessions,
  } : EMPTY_FORM);
  const [errors, setErrors] = React.useState<Partial<Record<keyof DeviceForm, string>>>({});

  const areas = TA_AREAS.filter((a) => a.siteId === f.siteId);
  const units = TA_AREAS.find((a) => a.id === f.areaId)?.units ?? [];
  const set = (p: Partial<DeviceForm>) => {
    setF((cur) => ({ ...cur, ...p }));
    setErrors((e) => { const next = { ...e }; for (const k of Object.keys(p)) delete next[k as keyof DeviceForm]; return next; });
  };

  function submit() {
    const e: Partial<Record<keyof DeviceForm, string>> = {};
    if (!f.type) e.type = "Choose a device type.";
    if (!f.model.trim()) e.model = "Enter the device model.";
    if (!f.siteId) e.siteId = "Choose a site.";
    if (!f.areaId) e.areaId = "Choose an area.";
    if (!f.unit) e.unit = "Choose what it is paired to.";
    if (!f.connection) e.connection = "Choose how it connects.";
    if (!f.address.trim()) e.address = "Enter its address.";
    setErrors(e);
    if (Object.keys(e).length === 0) onConfirm(f);
  }

  const err = (k: keyof DeviceForm) => errors[k] && <p className="mt-1 text-xs text-sev-critical">{errors[k]}</p>;

  return (
    <Modal open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent size="lg">
        <ModalHeader title={initial ? "Edit External Device" : "Add External Device"} description="Pair a device with a bay, rack or room so its data joins assessment results." icon={Radio} />
        <ModalBody className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Device Type</label>
              <Select
                value={f.type}
                onValueChange={(v) => {
                  const type = v as DeviceType;
                  const site = TA_SITES.find((s) => s.useCase === DEVICE_TYPE_INFO[type].useCase);
                  set({ type, connection: DEVICE_TYPE_INFO[type].connection, ...(f.siteId ? {} : { siteId: site?.id ?? "", areaId: site?.areas[0]?.id ?? "", unit: "" }) });
                }}
              >
                <SelectTrigger className="h-9 w-full" aria-invalid={!!errors.type}><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {DEVICE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
              {err("type")}
            </div>
            <div>
              <label className={LABEL}>Model</label>
              <Input value={f.model} onChange={(e) => set({ model: e.target.value })} placeholder="e.g. Radar LM Pro" className="h-9" aria-invalid={!!errors.model} />
              {err("model")}
            </div>
          </div>
          {f.type && (
            <p className="-mt-1 rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              Adds to {USE_CASES[DEVICE_TYPE_INFO[f.type].useCase].label.toLowerCase()} results: {DEVICE_TYPE_INFO[f.type].measures}.
            </p>
          )}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={LABEL}>Site</label>
              <Select value={f.siteId} onValueChange={(v) => set({ siteId: v, areaId: TA_AREAS.find((a) => a.siteId === v)?.id ?? "", unit: "" })}>
                <SelectTrigger className="h-9 w-full" aria-invalid={!!errors.siteId}><SelectValue placeholder="Site" /></SelectTrigger>
                <SelectContent>{TA_SITES.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
              {err("siteId")}
            </div>
            <div>
              <label className={LABEL}>Area</label>
              <Select value={f.areaId} onValueChange={(v) => set({ areaId: v, unit: "" })} disabled={!f.siteId}>
                <SelectTrigger className="h-9 w-full" aria-invalid={!!errors.areaId}><SelectValue placeholder="Area" /></SelectTrigger>
                <SelectContent>{areas.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
              </Select>
              {err("areaId")}
            </div>
            <div>
              <label className={LABEL}>Paired To</label>
              <Select value={f.unit} onValueChange={(v) => set({ unit: v })} disabled={!f.areaId}>
                <SelectTrigger className="h-9 w-full" aria-invalid={!!errors.unit}><SelectValue placeholder="Bay, rack or room" /></SelectTrigger>
                <SelectContent>{units.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
              </Select>
              {err("unit")}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={LABEL}>Connection</label>
              <Select value={f.connection} onValueChange={(v) => set({ connection: v as Connection })}>
                <SelectTrigger className="h-9 w-full" aria-invalid={!!errors.connection}><SelectValue placeholder="Connection" /></SelectTrigger>
                <SelectContent>{CONNECTIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
              {err("connection")}
            </div>
            <div>
              <label className={LABEL}>{f.connection === "Bluetooth" ? "BLE Address" : f.connection === "USB via edge box" ? "Edge Box Port" : "IP Address"}</label>
              <Input value={f.address} onChange={(e) => set({ address: e.target.value })} placeholder={f.connection === "Bluetooth" ? "BLE 1C:4F:2A" : "10.20.4.40"} className="h-9 font-mono" aria-invalid={!!errors.address} />
              {err("address")}
            </div>
            <div>
              <label className={LABEL}>Serial (optional)</label>
              <Input value={f.serial} onChange={(e) => set({ serial: e.target.value })} placeholder="SN-…" className="h-9 font-mono" />
            </div>
          </div>
          <label className="flex items-start gap-3 rounded-lg border border-border bg-background px-3.5 py-3">
            <input type="checkbox" className="mt-0.5 size-4 accent-[var(--primary)]" checked={f.useInSessions} onChange={(e) => set({ useInSessions: e.target.checked })} />
            <span>
              <span className="block text-base font-semibold text-foreground">Use in assessment sessions</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">Its readings are added to the results of whoever is in {f.unit || "the paired unit"}.</span>
            </span>
          </label>
        </ModalBody>
        <ModalFooter>
          <Button size="sm" onClick={submit} className="gap-1.5">
            {initial ? <Pencil className="size-3.5" /> : <Cable className="size-3.5" />}
            {initial ? "Save Changes" : "Add & Pair Device"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/* ── Drawer ────────────────────────────────────────────────────────────── */

function Kv({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 text-base">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("text-right text-foreground", mono && "font-mono text-sm")}>{value}</span>
    </div>
  );
}

function DeviceDrawer({
  device, onClose, onEdit, onRemove, onTest, onToggleSessions,
}: {
  device: ExternalDevice | null;
  onClose: () => void;
  onEdit: () => void;
  onRemove: () => void;
  onTest: () => void;
  onToggleSessions: (v: boolean) => void;
}) {
  const models = useTaModelsStore((s) => s.models);
  const sessions = useSessionsStore((s) => s.sessions);
  if (!device) return null;
  const info = DEVICE_TYPE_INFO[device.type];
  const usedBy = models.filter((m) => m.assessment?.useCase === info.useCase);
  const recent = sessions.filter((s) => s.devices.includes(device.id)).slice(0, 4);

  return (
    <Sheet open onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" showCloseButton={false} className="flex w-[min(860px,58vw)] max-w-[95vw] flex-col gap-0 p-0">
        <SheetHeader className="border-b border-border bg-card px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                <span className="rounded border border-border bg-muted px-1.5 py-px font-mono text-xs text-muted-foreground">{device.id}</span>
                <StatusBadge tone={STATUS_TONE[device.status]}>{STATUS_LABEL[device.status]}</StatusBadge>
                <span className="rounded-full border border-info/30 bg-info/10 px-2 py-0.5 text-2xs font-semibold text-info">{device.type}</span>
              </div>
              <SheetTitle className="text-lg text-foreground">{device.name}</SheetTitle>
              <p className="text-sm text-muted-foreground">{device.model} · {device.siteName} › {device.areaName}</p>
            </div>
            <div className="flex flex-shrink-0 items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={onTest}><RefreshCw className="size-3.5" />Test Connection</Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={onEdit}><Pencil className="size-3.5" />Edit</Button>
              <button onClick={onClose} aria-label="Close" className="flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground">
                <X className="size-4" />
              </button>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-border bg-card px-4 py-2">
              <p className="pt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pairing</p>
              <div className="divide-y divide-border/60">
                <Kv label="Paired to" value={<strong>{device.unit}</strong>} />
                <Kv label="Area" value={`${device.areaName} · ${device.siteName}`} />
                <Kv label="Connection" value={device.connection} />
                <Kv label="Address" value={device.address} mono />
                <Kv label="Serial" value={device.serial} mono />
                <Kv label="Firmware" value={device.firmware} mono />
                <Kv label="Last active" value={device.lastSeenDisplay} />
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Adds to assessment results</p>
                <p className="mt-1 text-base text-foreground">{info.measures}</p>
                <label className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2.5">
                  <span className="text-sm font-semibold text-foreground">Use in assessment sessions</span>
                  <input type="checkbox" className="size-4 accent-[var(--primary)]" checked={device.useInSessions} onChange={(e) => onToggleSessions(e.target.checked)} />
                </label>
                <p className="mt-2 text-xs text-muted-foreground">
                  Used by {usedBy.length ? usedBy.map((m) => m.name).join(", ") : "no assessment model yet"} when deployed to {device.unit}.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Activity className="size-3.5" />
                  {device.status === "online" ? "Latest reading" : "Last reading"}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {LIVE_READOUT[device.type].map(([k, v]) => (
                    <div key={k} className="rounded-lg border border-border bg-background px-3 py-2">
                      <p className="text-2xs text-muted-foreground">{k}</p>
                      <p className={cn("text-md font-semibold", device.status === "online" ? "text-foreground" : "text-muted-foreground")}>{device.status === "pairing" ? "—" : v}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <p className="border-b border-border px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recent assessment sessions</p>
            {recent.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">Not used in a session yet.</p>
            ) : (
              <div className="divide-y divide-border/60">
                {recent.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-base">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.date} · {s.time} · {s.modelName}</p>
                    </div>
                    <span className="font-mono text-xs text-muted-foreground">{s.id}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button onClick={onRemove} className="inline-flex items-center gap-1.5 text-sm font-semibold text-sev-critical hover:underline">
            <Trash2 className="size-3.5" />
            Remove device
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ── Page ──────────────────────────────────────────────────────────────── */

export function TaExternalDevices() {
  const devices = useDevicesStore((s) => s.devices);
  const setDevices = useDevicesStore((s) => s.setDevices);
  const [kpi, setKpi] = React.useState<KpiKey>("all");
  const [search, setSearch] = React.useState("");
  const [sites, setSites] = React.useState<string[]>([]);
  const [types, setTypes] = React.useState<string[]>([]);
  const [drawerId, setDrawerId] = React.useState<string | null>(null);
  const [modal, setModal] = React.useState<null | "add" | "edit" | "remove">(null);

  const drawer = devices.find((d) => d.id === drawerId) ?? null;

  const filtered = devices.filter((d) => {
    if (kpi === "in-sessions" && !d.useInSessions) return false;
    if (kpi !== "all" && kpi !== "in-sessions" && d.status !== kpi) return false;
    if (sites.length && !sites.includes(d.siteId)) return false;
    if (types.length && !types.includes(d.type)) return false;
    const q = search.toLowerCase().trim();
    return !q || [d.id, d.name, d.model, d.address, d.unit, d.type].join(" ").toLowerCase().includes(q);
  });
  const hasFilters = kpi !== "all" || !!search || sites.length > 0 || types.length > 0;

  function clearAll() { setKpi("all"); setSearch(""); setSites([]); setTypes([]); }

  function patch(id: string, p: Partial<ExternalDevice>) {
    setDevices((cur) => cur.map((d) => (d.id === id ? { ...d, ...p } : d)));
  }

  function testConnection(d: ExternalDevice) {
    if (d.status === "offline") {
      toast.error(`${d.id} didn't respond`, { description: `Check it is powered on and reachable at ${d.address}.` });
      return;
    }
    toast.success(`${d.id} is connected`, { description: `Reading received from ${d.unit} · 42 ms round trip.` });
  }

  function add(f: DeviceForm) {
    if (!f.type || !f.connection) return;
    const id = nextDeviceId(f.type, devices.map((d) => d.id));
    const site = TA_SITES.find((s) => s.id === f.siteId);
    const area = TA_AREAS.find((a) => a.id === f.areaId);
    const d: ExternalDevice = {
      id, name: `${f.unit} · ${f.type}`, type: f.type, model: f.model.trim(), serial: f.serial.trim() || "—",
      siteId: f.siteId, siteName: site?.name ?? "", areaId: f.areaId, areaName: area?.name ?? "", unit: f.unit,
      connection: f.connection, address: f.address.trim(), status: "pairing", firmware: "—", useInSessions: f.useInSessions,
      lastSeenDisplay: "Pairing…", addedDisplay: "Today",
    };
    setDevices((cur) => [d, ...cur]);
    setModal(null);
    toast.message(`Pairing ${id} with ${f.unit}…`);
    /* Pairing is simulated: the device comes online a moment later. */
    window.setTimeout(() => {
      useDevicesStore.getState().setDevices((cur) => cur.map((x) => (x.id === id ? { ...x, status: "online", firmware: "2.4.1", lastSeenDisplay: "Just now" } : x)));
      toast.success(`${id} paired with ${f.unit}`, { description: "It now appears beside that unit's cameras in Model Deployment." });
    }, 2500);
  }

  function edit(f: DeviceForm) {
    if (!drawer || !f.type || !f.connection) return;
    const site = TA_SITES.find((s) => s.id === f.siteId);
    const area = TA_AREAS.find((a) => a.id === f.areaId);
    patch(drawer.id, {
      name: `${f.unit} · ${f.type}`, type: f.type, model: f.model.trim(), serial: f.serial.trim() || drawer.serial,
      siteId: f.siteId, siteName: site?.name ?? drawer.siteName, areaId: f.areaId, areaName: area?.name ?? drawer.areaName, unit: f.unit,
      connection: f.connection, address: f.address.trim(), useInSessions: f.useInSessions,
    });
    setModal(null);
    toast.success(`${drawer.id} updated`);
  }

  function remove() {
    if (!drawer) return;
    const id = drawer.id;
    setDevices((cur) => cur.filter((d) => d.id !== id));
    setModal(null);
    setDrawerId(null);
    toast.success(`${id} removed`, { description: "Deployments that used it keep running on cameras only." });
  }

  const KPIS: { key: KpiKey; label: string; sub: string; accent: "primary" | "success" | "warning" | "info" | "sev-critical"; value: number }[] = [
    { key: "all", label: "Total devices", sub: "Across all sites", accent: "primary", value: devices.length },
    { key: "online", label: "Online", sub: "Sending readings", accent: "success", value: devices.filter((d) => d.status === "online").length },
    { key: "offline", label: "Offline", sub: "Not responding", accent: "sev-critical", value: devices.filter((d) => d.status === "offline").length },
    { key: "pairing", label: "Pairing", sub: "Waiting for first reading", accent: "warning", value: devices.filter((d) => d.status === "pairing").length },
    { key: "in-sessions", label: "Used in sessions", sub: "Data joins results", accent: "info", value: devices.filter((d) => d.useInSessions).length },
  ];

  return (
    <div className="flex flex-col gap-4">
      <PageHeader>
        <PageHeader.Content>
          <PageHeader.Title>External Devices</PageHeader.Title>
        </PageHeader.Content>
        <PageHeader.Actions>
          <Button size="sm" className="gap-1.5" onClick={() => setModal("add")}>
            <Plus className="size-4" />
            Add Device
          </Button>
        </PageHeader.Actions>
      </PageHeader>

      <KpiGrid cols={5}>
        {KPIS.map((k) => (
          <KpiCard key={k.key} label={k.label} value={k.value} sub={k.sub} accent={k.accent}
            active={k.key !== "all" && kpi === k.key} onClick={() => setKpi(kpi === k.key ? "all" : k.key)} />
        ))}
      </KpiGrid>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by ID, name, model, address or bay…" className="h-9 pl-9 text-base" />
        </div>
        <FilterDropdown label="All sites" options={TA_SITES.map((s) => ({ value: s.id, label: s.name }))} selected={sites} onChange={setSites} className="w-44" />
        <FilterDropdown label="All types" options={DEVICE_TYPES.map((t) => ({ value: t, label: t }))} selected={types} onChange={setTypes} className="w-44" />
      </div>

      <p className="text-base text-muted-foreground">
        <strong className="text-foreground">{filtered.length}</strong> {filtered.length === 1 ? "device" : "devices"} match current filters
        {hasFilters && <button onClick={clearAll} className="ml-2 text-muted-foreground underline hover:text-primary">Clear all</button>}
      </p>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-20 text-muted-foreground">
          <Radio className="size-10 opacity-20" />
          {devices.length === 0 ? (
            <>
              <p className="text-sm font-medium text-foreground">No external devices yet</p>
              <p className="text-sm">Add a launch monitor, bar speed sensor or other device to use it in assessment sessions.</p>
              <Button size="sm" className="gap-1.5" onClick={() => setModal("add")}><Plus className="size-4" />Add Device</Button>
            </>
          ) : (
            <>
              <p className="text-sm">No devices match the current filters.</p>
              <Button variant="ghost" size="sm" onClick={clearAll}>Clear filters</Button>
            </>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30">
                <tr className="border-b border-border text-left">
                  {["ID", "NAME · MODEL", "TYPE", "STATUS", "PAIRED TO", "CONNECTION", "IN SESSIONS", "LAST ACTIVE", "ACTION"].map((h) => (
                    <th key={h} className="whitespace-nowrap px-4 py-2.5 font-mono text-2xs uppercase tracking-[0.15em] text-muted-foreground/60">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filtered.map((d) => (
                  <tr key={d.id} onClick={() => setDrawerId(d.id)} className="group cursor-pointer text-base transition-colors hover:bg-muted/20">
                    <td className="whitespace-nowrap px-4 py-3"><span className="font-mono text-sm font-semibold text-muted-foreground group-hover:text-primary">{d.id}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-foreground group-hover:text-primary">{d.name}</span>
                        <span className="font-mono text-xs text-muted-foreground">{d.model}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-foreground">{d.type}</td>
                    <td className="px-4 py-3"><StatusBadge tone={STATUS_TONE[d.status]}>{STATUS_LABEL[d.status]}</StatusBadge></td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-foreground">{d.unit}</span>
                        <span className="text-xs text-muted-foreground">{d.areaName} · {d.siteName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-foreground">{d.connection}</span>
                        <span className="font-mono text-xs text-muted-foreground">{d.address}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {d.useInSessions
                        ? <span className="inline-flex items-center gap-1 text-sm text-success"><CircleCheck className="size-3.5" />Yes</span>
                        : <span className="text-sm text-muted-foreground">Off</span>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      <span className="flex items-center gap-1.5"><Calendar className="size-3" />{d.lastSeenDisplay}</span>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button aria-label={`Actions for ${d.id}`} className="flex size-7 items-center justify-center rounded border border-transparent text-muted-foreground/50 transition-colors hover:border-border hover:bg-muted hover:text-foreground">
                            <MoreHorizontal className="size-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-44 p-1" align="end">
                          <button onClick={() => setDrawerId(d.id)} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-foreground hover:bg-muted">
                            <Radio className="size-3.5 text-muted-foreground" />View details
                          </button>
                          <button onClick={() => testConnection(d)} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-foreground hover:bg-muted">
                            <RefreshCw className="size-3.5 text-muted-foreground" />Test connection
                          </button>
                          <button onClick={() => { setDrawerId(d.id); setModal("edit"); }} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-foreground hover:bg-muted">
                            <Pencil className="size-3.5 text-muted-foreground" />Edit device
                          </button>
                          <div className="my-1 border-t border-border" />
                          <button onClick={() => { setDrawerId(d.id); setModal("remove"); }} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-sev-critical hover:bg-sev-critical/10">
                            <Trash2 className="size-3.5" />Remove
                          </button>
                        </PopoverContent>
                      </Popover>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <DeviceDrawer
        device={modal === null ? drawer : null}
        onClose={() => setDrawerId(null)}
        onEdit={() => setModal("edit")}
        onRemove={() => setModal("remove")}
        onTest={() => drawer && testConnection(drawer)}
        onToggleSessions={(v) => {
          if (!drawer) return;
          patch(drawer.id, { useInSessions: v });
          toast.message(v ? `${drawer.id} readings will join assessment results` : `${drawer.id} no longer used in sessions`);
        }}
      />
      {modal === "add" && <DeviceModal open onClose={() => setModal(null)} onConfirm={add} />}
      {modal === "edit" && <DeviceModal open initial={drawer} onClose={() => setModal(null)} onConfirm={edit} />}
      <ConfirmDialog
        open={modal === "remove"}
        onOpenChange={(v) => !v && setModal(null)}
        title="Remove External Device"
        description={<>Are you sure you want to remove <strong className="text-foreground">{drawer?.name}</strong>? It stops sending readings to assessment sessions.</>}
        confirmLabel="Remove"
        destructive
        onConfirm={remove}
      />
    </div>
  );
}
