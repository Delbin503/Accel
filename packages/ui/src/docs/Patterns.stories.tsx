import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Cctv, Download, MoreHorizontal, Plus, SearchX } from "lucide-react";
import { Button } from "../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { SegmentedControl, SegmentedControlItem } from "../components/ui/segmented-control";
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderContent,
  PageHeaderDescription,
  PageHeaderTitle,
} from "../components/layout";
import { ConfirmDialog } from "../components/shared/ConfirmDialog";
import { DataTable, type DataTableColumn } from "../components/shared/DataTable";
import { DescriptionItem, DescriptionList } from "../components/shared/DescriptionList";
import {
  DetailDrawer as DetailDrawerRoot,
  DetailDrawerBody,
  DetailDrawerDescription,
  DetailDrawerFooter,
  DetailDrawerFooterStart,
  DetailDrawerHeader,
  DetailDrawerTitle,
} from "../components/shared/DetailDrawer";
import { Stepper } from "../components/shared/Stepper";
import { FilterDropdown } from "../components/shared/FilterDropdown";
import { KpiCard, KpiGrid } from "../components/shared/KpiCard";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalSubheader } from "../components/shared/Modal";
import {
  MODAL_NOTE,
  ModalField,
  ModalFieldPair,
  ModalFormSection,
  ModalSelect,
  ModalTextInput,
  OptionChips,
} from "../components/shared/ModalForm";
import { ListErrorState, ListLoadingState } from "../components/shared/PageStates";
import { SectionCard } from "../components/shared/SectionCard";
import { StatusBadge } from "../components/shared/StatusBadge";
import { Toolbar, ToolbarSearch } from "../components/shared/Toolbar";
import { formatRelativeTime } from "../lib/formatters";

/**
 * Page patterns — full, working compositions built only from approved
 * components, so a newcomer can copy a list page, a detail drawer or a form
 * wizard straight out of Storybook. Each story starts with a numbered anatomy
 * naming the component behind every region (docs/choosing-components.md).
 */
const meta: Meta = {
  title: "Guidelines/Page patterns",
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj;

/* ─── Mock data ────────────────────────────────────────────────────────── */

const NOW = new Date("2026-11-15T10:00:00Z");
const ago = (min: number) => formatRelativeTime(new Date(NOW.getTime() - min * 60_000), NOW);

type CameraStatus = "online" | "degraded" | "offline";
type Severity = "critical" | "high" | "medium" | "low";

interface Incident {
  id: string;
  title: string;
  severity: Severity;
  minutesAgo: number;
}

interface Camera {
  id: string;
  name: string;
  site: string;
  zone: string;
  status: CameraStatus;
  model: string;
  ip: string;
  resolution: string;
  fps: number;
  retentionDays: number;
  lastSeenMin: number;
  incidents: Incident[];
}

const SITES = [
  { value: "hq", label: "HQ Tower" },
  { value: "dock", label: "North Dock" },
  { value: "mall", label: "Riverside Mall" },
] as const;

const STATUS_OPTIONS = [
  { value: "online", label: "Online" },
  { value: "degraded", label: "Degraded" },
  { value: "offline", label: "Offline" },
] as const;

const siteLabel = (v: string) => SITES.find((s) => s.value === v)?.label ?? v;

const STATUS_TONE: Record<CameraStatus, "success" | "warning" | "critical"> = {
  online: "success",
  degraded: "warning",
  offline: "critical",
};

const CAMERAS: Camera[] = [
  { id: "CAM-001", name: "Lobby entrance", site: "hq", zone: "Ground floor", status: "online", model: "Axis P3265-LVE", ip: "10.0.1.21", resolution: "1080p", fps: 25, retentionDays: 30, lastSeenMin: 0, incidents: [{ id: "INC-2041", title: "Tailgating at turnstile", severity: "medium", minutesAgo: 42 }] },
  { id: "CAM-002", name: "Reception desk", site: "hq", zone: "Ground floor", status: "online", model: "Hanwha XNV-8080R", ip: "10.0.1.22", resolution: "4K", fps: 15, retentionDays: 30, lastSeenMin: 0, incidents: [] },
  { id: "CAM-007", name: "Server room door", site: "hq", zone: "Level 3", status: "degraded", model: "Axis M3106-L", ip: "10.0.3.11", resolution: "720p", fps: 10, retentionDays: 90, lastSeenMin: 3, incidents: [{ id: "INC-2038", title: "Door held open", severity: "high", minutesAgo: 95 }, { id: "INC-2030", title: "Low frame rate", severity: "low", minutesAgo: 600 }] },
  { id: "CAM-014", name: "Loading bay 1", site: "dock", zone: "Yard", status: "online", model: "Bosch FLEXIDOME 5100i", ip: "10.2.0.14", resolution: "1080p", fps: 25, retentionDays: 14, lastSeenMin: 0, incidents: [] },
  { id: "CAM-015", name: "Loading bay 2", site: "dock", zone: "Yard", status: "offline", model: "Bosch FLEXIDOME 5100i", ip: "10.2.0.15", resolution: "1080p", fps: 0, retentionDays: 14, lastSeenMin: 87, incidents: [{ id: "INC-2044", title: "Camera offline", severity: "critical", minutesAgo: 87 }, { id: "INC-2035", title: "Vehicle in no-park zone", severity: "medium", minutesAgo: 300 }] },
  { id: "CAM-016", name: "Perimeter fence east", site: "dock", zone: "Perimeter", status: "online", model: "Hanwha XNO-6080R", ip: "10.2.0.16", resolution: "1080p", fps: 20, retentionDays: 30, lastSeenMin: 0, incidents: [{ id: "INC-2043", title: "Person loitering after hours", severity: "high", minutesAgo: 20 }] },
  { id: "CAM-022", name: "Food court", site: "mall", zone: "Level 1", status: "online", model: "Axis P3265-LVE", ip: "10.4.1.22", resolution: "1080p", fps: 25, retentionDays: 30, lastSeenMin: 0, incidents: [] },
  { id: "CAM-023", name: "Car park B ramp", site: "mall", zone: "Car park", status: "degraded", model: "Uniview IPC2325", ip: "10.4.2.23", resolution: "1080p", fps: 12, retentionDays: 14, lastSeenMin: 6, incidents: [{ id: "INC-2042", title: "Wrong-way vehicle", severity: "medium", minutesAgo: 33 }] },
  { id: "CAM-024", name: "Service corridor", site: "mall", zone: "Back of house", status: "offline", model: "Uniview IPC2325", ip: "10.4.2.24", resolution: "720p", fps: 0, retentionDays: 14, lastSeenMin: 1440, incidents: [{ id: "INC-2028", title: "Camera offline", severity: "critical", minutesAgo: 1440 }] },
];

/* ─── Shared bits ──────────────────────────────────────────────────────── */

/** Numbered "which component makes which region" list shown above each pattern. */
function Anatomy({ title, intro, items }: { title: string; intro: string; items: [region: string, components: string][] }) {
  return (
    <section data-slot="pattern-anatomy" aria-label={`${title} anatomy`} className="border-b border-border bg-card px-6 py-5">
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
      <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{intro}</p>
      <ol className="mt-3 grid gap-x-8 gap-y-1.5 text-sm sm:grid-cols-2">
        {items.map(([region, components], i) => (
          <li key={region} className="flex gap-2">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-2xs font-bold text-primary-ink">
              {i + 1}
            </span>
            <span className="text-foreground">
              <span className="font-semibold">{region}</span>
              <span className="text-muted-foreground"> — {components}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ─── Pattern 2: detail drawer ─────────────────────────────────────────── */

const INCIDENT_COLUMNS: DataTableColumn<Incident>[] = [
  { key: "id", header: "Incident", cell: (r) => <span className="font-mono text-xs">{r.id}</span> },
  { key: "title", header: "What happened" },
  { key: "severity", header: "Severity", cell: (r) => <StatusBadge tone={r.severity}>{r.severity}</StatusBadge> },
  { key: "when", header: "When", align: "right", cell: (r) => <span className="text-xs text-muted-foreground">{ago(r.minutesAgo)}</span> },
];

function CameraDrawer({
  camera,
  open,
  onOpenChange,
  onDelete,
}: {
  camera: Camera | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (camera: Camera) => void;
}) {
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [restartedId, setRestartedId] = React.useState<string | null>(null);
  const restarted = camera != null && restartedId === camera.id;

  return (
    <DetailDrawerRoot open={open} onOpenChange={onOpenChange} size="md">
        {camera && (
          <>
            {/* 1 · Header — status, title, ID / site line; close is built in */}
            <DetailDrawerHeader data-slot="camera-drawer-header">
              <div className="flex items-center gap-1.5">
                <StatusBadge tone={STATUS_TONE[camera.status]}>{camera.status}</StatusBadge>
              </div>
              <DetailDrawerTitle>{camera.name}</DetailDrawerTitle>
              <DetailDrawerDescription>
                <span className="font-mono">{camera.id}</span> · {siteLabel(camera.site)} · {camera.zone}
              </DetailDrawerDescription>
            </DetailDrawerHeader>

            {/* 2 · Body — scrolls; sections are SectionCards */}
            <DetailDrawerBody data-slot="camera-drawer-body" className="gap-4">
              <KpiGrid cols={3} className="grid-cols-3">
                <KpiCard compact label="Frame rate" value={`${camera.fps} fps`} tone={camera.fps === 0 ? "severity-critical" : "success"} />
                <KpiCard compact label="Retention" value={`${camera.retentionDays} d`} tone="info" />
                <KpiCard compact label="Open incidents" value={camera.incidents.length} tone={camera.incidents.length ? "warning" : "muted"} />
              </KpiGrid>

              <SectionCard title="Device" size="sm">
                <DescriptionList columns={2}>
                  <DescriptionItem label="Model">{camera.model}</DescriptionItem>
                  <DescriptionItem label="IP address" mono>{camera.ip}</DescriptionItem>
                  <DescriptionItem label="Resolution">{camera.resolution}</DescriptionItem>
                  <DescriptionItem label="Last seen">{camera.lastSeenMin === 0 ? "Live now" : ago(camera.lastSeenMin)}</DescriptionItem>
                  <DescriptionItem label="Restarted">{restarted ? "Restart requested just now" : undefined}</DescriptionItem>
                </DescriptionList>
              </SectionCard>

              <SectionCard title="Recent incidents" description={`${camera.incidents.length} in the last 24 hours`} size="sm" flushBody>
                <DataTable
                  variant="list"
                  columns={INCIDENT_COLUMNS}
                  data={camera.incidents}
                  getRowId={(r) => r.id}
                  empty={{ title: "No incidents in the last 24 hours", variant: "inline" }}
                />
              </SectionCard>
            </DetailDrawerBody>

            {/* 3 · Footer — destructive left, secondary + primary right */}
            <DetailDrawerFooter data-slot="camera-drawer-footer">
              <DetailDrawerFooterStart>
                <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
                  Delete camera
                </Button>
              </DetailDrawerFooterStart>
              <Button variant="outline" onClick={() => camera && setRestartedId(camera.id)}>
                Restart stream
              </Button>
              <Button>View live feed</Button>
            </DetailDrawerFooter>

            {/* 4 · Destructive confirm */}
            <ConfirmDialog
              open={confirmOpen}
              onOpenChange={setConfirmOpen}
              title="Delete camera"
              description={
                <>
                  Are you sure you want to delete <strong>{camera.name}</strong>? Its recordings stay until retention expires.
                </>
              }
              confirmLabel="Delete camera"
              destructive
              onConfirm={() => {
                setConfirmOpen(false);
                onDelete(camera);
              }}
            />
          </>
        )}
    </DetailDrawerRoot>
  );
}

/* ─── Pattern 1: list page ─────────────────────────────────────────────── */

type PreviewState = "populated" | "loading" | "empty" | "error";

function PreviewStateBar({ value, onChange }: { value: PreviewState; onChange: (v: PreviewState) => void }) {
  return (
    <div data-slot="pattern-preview-bar" className="flex flex-wrap items-center gap-3 border-b border-border bg-muted/40 px-6 py-2.5">
      <span className="text-2xs font-bold uppercase tracking-wider text-muted-foreground">Preview state</span>
      <SegmentedControl
        type="single"
        size="sm"
        value={value}
        onValueChange={(v) => v && onChange(v as PreviewState)}
        aria-label="Preview state"
      >
        <SegmentedControlItem value="populated">Populated</SegmentedControlItem>
        <SegmentedControlItem value="loading">Loading</SegmentedControlItem>
        <SegmentedControlItem value="empty">Empty</SegmentedControlItem>
        <SegmentedControlItem value="error">Error</SegmentedControlItem>
      </SegmentedControl>
      <span className="text-sm text-muted-foreground">Story control, not part of the page.</span>
    </div>
  );
}

function CamerasListPage({ initialOpenId }: { initialOpenId?: string }) {
  const [state, setState] = React.useState<PreviewState>("populated");
  const [cameras, setCameras] = React.useState<Camera[]>(CAMERAS);
  const [query, setQuery] = React.useState("");
  const [sites, setSites] = React.useState<string[]>([]);
  const [statuses, setStatuses] = React.useState<string[]>([]);
  const [openId, setOpenId] = React.useState<string | null>(initialOpenId ?? null);
  const [toDelete, setToDelete] = React.useState<Camera | null>(null);
  const [adding, setAdding] = React.useState(false);

  const source = state === "empty" ? [] : cameras;
  const q = query.trim().toLowerCase();
  const rows = source.filter(
    (c) =>
      (!q || c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q) || c.ip.includes(q)) &&
      (sites.length === 0 || sites.includes(c.site)) &&
      (statuses.length === 0 || statuses.includes(c.status))
  );
  const filtered = q !== "" || sites.length > 0 || statuses.length > 0;
  const clearFilters = () => {
    setQuery("");
    setSites([]);
    setStatuses([]);
  };

  const count = (s: CameraStatus) => source.filter((c) => c.status === s).length;
  const openIncidents = source.reduce((n, c) => n + c.incidents.length, 0);
  const offlineOnly = statuses.length === 1 && statuses[0] === "offline";

  const removeCamera = (cam: Camera) => {
    setCameras((cs) => cs.filter((c) => c.id !== cam.id));
    setOpenId(null);
  };

  const columns: DataTableColumn<Camera>[] = [
    {
      key: "name",
      header: "Camera",
      cell: (c) => (
        <div className="min-w-0">
          <p className="font-medium text-foreground">{c.name}</p>
          <p className="font-mono text-xs text-muted-foreground">{c.id}</p>
        </div>
      ),
    },
    { key: "site", header: "Site", cell: (c) => <span className="text-muted-foreground">{siteLabel(c.site)}</span> },
    { key: "status", header: "Status", cell: (c) => <StatusBadge tone={STATUS_TONE[c.status]}>{c.status}</StatusBadge> },
    { key: "incidents", header: "Open incidents", align: "right", cell: (c) => <span className="tabular-nums">{c.incidents.length}</span> },
    {
      key: "seen",
      header: "Last seen",
      cell: (c) => <span className="text-xs text-muted-foreground">{c.lastSeenMin === 0 ? "Live" : ago(c.lastSeenMin)}</span>,
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      align: "right",
      stopRowClick: true,
      sticky: "right",
      cell: (c) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${c.name}`}>
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setOpenId(c.id)}>View details</DropdownMenuItem>
            <DropdownMenuItem>Restart stream</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => setToDelete(c)}>
              Delete camera
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const openCamera = cameras.find((c) => c.id === openId) ?? null;

  return (
    <>
      <PreviewStateBar value={state} onChange={setState} />
      <div data-slot="cameras-page" className="space-y-5 bg-background p-6">
        {/* 1 · PageHeader */}
        <PageHeader>
          <PageHeaderContent>
            <PageHeaderTitle>Cameras</PageHeaderTitle>
            <PageHeaderDescription>Every camera across your sites, with live health and open incidents.</PageHeaderDescription>
          </PageHeaderContent>
          <PageHeaderActions>
            <Button variant="outline">
              <Download /> Export
            </Button>
            <Button onClick={() => setAdding(true)}>
              <Plus /> Add camera
            </Button>
          </PageHeaderActions>
        </PageHeader>

        {state === "loading" ? (
          <ListLoadingState kpiCols={4} columns={5} rows={6} />
        ) : state === "error" ? (
          <ListErrorState title="Couldn't load cameras" onRetry={() => setState("populated")} />
        ) : (
          <>
            {/* 2 · KpiGrid of KpiCards — "Offline" doubles as a filter */}
            <KpiGrid cols={4}>
              <KpiCard label="Total cameras" value={source.length} sub={`Across ${SITES.length} sites`} tone="primary" />
              <KpiCard label="Online" value={count("online")} sub={`${count("degraded")} degraded`} tone="success" />
              <KpiCard
                label="Offline"
                value={count("offline")}
                sub={offlineOnly ? "Click to clear" : "Click to filter"}
                tone="severity-critical"
                active={offlineOnly}
                onClick={() => setStatuses(offlineOnly ? [] : ["offline"])}
              />
              <KpiCard
                label="Open incidents"
                value={openIncidents}
                sub="vs yesterday"
                tone="warning"
                trend={{ value: "3", direction: "up", sentiment: "negative" }}
              />
            </KpiGrid>

            {/* 3 · Toolbar — search + filters, trailing count */}
            <Toolbar>
              <ToolbarSearch value={query} onChange={setQuery} placeholder="Search name, ID or IP…" aria-label="Search cameras" />
              <FilterDropdown label="All sites" options={SITES} selected={sites} onChange={setSites} className="w-40" />
              <FilterDropdown label="Any status" options={STATUS_OPTIONS} selected={statuses} onChange={setStatuses} className="w-40" />
              {filtered && (
                <Button variant="link" onClick={clearFilters}>
                  Clear all
                </Button>
              )}
              <span className="ml-auto text-sm text-muted-foreground" aria-live="polite">
                {rows.length} of {source.length} cameras
              </span>
            </Toolbar>

            {/* 4 · DataTable variant="list" — row opens the drawer, ⋯ menu doesn't */}
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <DataTable
                variant="list"
                columns={columns}
                data={rows}
                getRowId={(c) => c.id}
                onRowClick={(c) => setOpenId(c.id)}
                getRowClassName={(c) => (c.status === "offline" ? "bg-severity-critical/5" : undefined)}
                empty={
                  filtered
                    ? { icon: SearchX, title: "No cameras match the filters", description: "Try another site or status, or clear the search." }
                    : { icon: Cctv, title: "No cameras yet", description: "Add a camera to start monitoring this site." }
                }
              />
            </div>
          </>
        )}
      </div>

      {/* 5 · Detail drawer (pattern 2) + 6 · ConfirmDialog for the menu's Delete */}
      <AddCameraModal
        open={adding}
        onOpenChange={setAdding}
        onAdded={(f) =>
          setCameras((cs) => [
            {
              id: `CAM-${String(100 + cs.length).padStart(3, "0")}`,
              name: f.name,
              site: f.site,
              zone: "Unassigned",
              status: "online",
              model: "Unknown",
              ip: f.ip,
              resolution: "1080p",
              fps: 25,
              retentionDays: f.retention,
              lastSeenMin: 0,
              incidents: [],
            },
            ...cs,
          ])
        }
      />
      <CameraDrawer camera={openCamera} open={openCamera != null} onOpenChange={(o) => !o && setOpenId(null)} onDelete={removeCamera} />
      <ConfirmDialog
        open={toDelete != null}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Delete camera"
        description={
          <>
            Are you sure you want to delete <strong>{toDelete?.name}</strong>? Its recordings stay until retention expires.
          </>
        }
        confirmLabel="Delete camera"
        destructive
        onConfirm={() => {
          if (toDelete) removeCamera(toDelete);
          setToDelete(null);
        }}
      />
    </>
  );
}

export const ListPage: Story = {
  name: "List page",
  render: () => (
    <div className="min-h-screen bg-background text-base text-foreground">
      <Anatomy
        title="List page"
        intro="The standard Accel list page. Use the Preview state control to see loading, empty and error — each renders inside the page chrome. Search and both filters work on the mock data; click a row to open its drawer."
        items={[
          ["Page title, description, primary action", "PageHeader (layout) — one default Button, the rest outline"],
          ["Headline metrics", "KpiGrid of KpiCards, colour via tone; a card with onClick + active filters the list"],
          ["Search and filters", "Toolbar + ToolbarSearch + FilterDropdown; Button variant=\"link\" for Clear all"],
          ["Records", "DataTable variant=\"list\" with StatusBadge column and a DropdownMenu column (stopRowClick, sticky=\"right\")"],
          ["Row detail", "DetailDrawer opened from onRowClick — see Detail drawer"],
          ["Delete from the menu", "ConfirmDialog with destructive"],
          ["Add camera", "the Form wizard pattern, opened from the PageHeader primary action"],
          ["Loading / error", "ListLoadingState / ListErrorState (PageStates)"],
          ["Empty / no results", "DataTable empty → EmptyState, different copy for filtered vs no data"],
        ]}
      />
      <CamerasListPage />
    </div>
  ),
};

export const DetailDrawer: Story = {
  name: "Detail drawer",
  render: () => (
    <div className="min-h-screen bg-background text-base text-foreground">
      <Anatomy
        title="Detail drawer"
        intro="A row's detail opens in a right-side DetailDrawer so the list stays in view. Close it and click any row to reopen. Delete camera opens a ConfirmDialog on top of the drawer."
        items={[
          ["Shell", "DetailDrawer size=\"md\" (Sheet with the Accel drawer chrome; lg is the default record width)"],
          ["Header", "DetailDrawerHeader → StatusBadge, DetailDrawerTitle, DetailDrawerDescription; close button built in"],
          ["Mini-stats", "KpiGrid of KpiCard compact"],
          ["Key / value section", "SectionCard size=\"sm\" around a DescriptionList"],
          ["Related records", "SectionCard flushBody + DataTable variant=\"list\", empty.variant=\"inline\""],
          ["Footer actions", "DetailDrawerFooter: destructive Button in DetailDrawerFooterStart; outline secondary + one default primary right"],
          ["Destructive confirm", "ConfirmDialog destructive — one action, ✕ / Esc to cancel"],
        ]}
      />
      <CamerasListPage initialOpenId="CAM-015" />
    </div>
  ),
};

/* ─── Pattern 3: form wizard in a modal ────────────────────────────────── */

const STEPS = ["Details", "Connection", "Recording"] as const;

const PROTOCOLS = [
  { value: "rtsp", label: "RTSP" },
  { value: "onvif", label: "ONVIF" },
  { value: "http", label: "HTTP (MJPEG)" },
] as const;

const RETENTION: { value: number; label: string }[] = [
  { value: 7, label: "7 days" },
  { value: 14, label: "14 days" },
  { value: 30, label: "30 days" },
  { value: 90, label: "90 days" },
];

interface WizardForm {
  name: string;
  site: string;
  ip: string;
  port: string;
  protocol: string;
  retention: number;
}

const EMPTY_FORM: WizardForm = { name: "", site: "", ip: "", port: "554", protocol: "rtsp", retention: 30 };

type Errors = Partial<Record<keyof WizardForm, string>>;

function validate(step: number, f: WizardForm): Errors {
  const e: Errors = {};
  if (step === 0) {
    if (!f.name.trim()) e.name = "Give the camera a name.";
    if (!f.site) e.site = "Choose the site this camera belongs to.";
  }
  if (step === 1) {
    if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(f.ip.trim())) e.ip = "Enter an IPv4 address, e.g. 10.0.1.21.";
    if (!/^\d+$/.test(f.port) || Number(f.port) > 65535) e.port = "Port must be a number up to 65535.";
  }
  return e;
}

function AddCameraModal({
  open,
  onOpenChange,
  onAdded,
  initialErrors = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded: (form: WizardForm) => void;
  initialErrors?: boolean;
}) {
  const [step, setStep] = React.useState(0);
  const [form, setForm] = React.useState<WizardForm>(EMPTY_FORM);
  const [errors, setErrors] = React.useState<Errors>(() => (initialErrors ? validate(0, EMPTY_FORM) : {}));

  // Start fresh next time: reset when the modal closes (✕, Esc or Finish).
  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setStep(0);
      setForm(EMPTY_FORM);
      setErrors({});
    }
    onOpenChange(next);
  };

  const set = <K extends keyof WizardForm>(key: K) => (value: WizardForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const last = step === STEPS.length - 1;
  const next = () => {
    const e = validate(step, form);
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    if (last) {
      onAdded(form);
      handleOpenChange(false);
      return;
    }
    setStep((s) => s + 1);
  };

  return (
    <Modal open={open} onOpenChange={handleOpenChange}>
      <ModalContent size="lg">
        {/* 1 · Header */}
        <ModalHeader title="Add camera" description="Register a camera in three steps: details, connection, recording." />

        {/* 2 · Step indicator in the subheader slot */}
        <ModalSubheader data-slot="wizard-steps">
          <Stepper steps={STEPS.map((label) => ({ id: label, label }))} current={step} labels="always" aria-label="Add camera steps" />
        </ModalSubheader>

        {/* 3 · Body — ModalForm fields, errors under each field */}
        <ModalBody className="space-y-5 pt-4">
          {step === 0 && (
            <ModalFormSection title="Camera">
              <p className={MODAL_NOTE}>Name it after what it sees — operators pick cameras by name.</p>
              <ModalField label="Name" error={errors.name}>
                <ModalTextInput value={form.name} onChange={set("name")} placeholder="e.g. Loading bay 3" invalid={!!errors.name} />
              </ModalField>
              <ModalField label="Site" error={errors.site}>
                <ModalSelect
                  value={form.site}
                  onChange={set("site")}
                  placeholder="Choose a site"
                  options={SITES}
                  invalid={!!errors.site}
                  ariaLabel="Site"
                />
              </ModalField>
            </ModalFormSection>
          )}
          {step === 1 && (
            <ModalFormSection title="Connection">
              <ModalFieldPair>
                <ModalField label="IP address" error={errors.ip}>
                  <ModalTextInput value={form.ip} onChange={set("ip")} placeholder="10.0.1.21" mono invalid={!!errors.ip} />
                </ModalField>
                <ModalField label="Port" error={errors.port} hint="554 for RTSP">
                  <ModalTextInput value={form.port} onChange={set("port")} mono invalid={!!errors.port} />
                </ModalField>
              </ModalFieldPair>
              <ModalField label="Protocol">
                <ModalSelect value={form.protocol} onChange={set("protocol")} placeholder="Choose a protocol" options={PROTOCOLS} ariaLabel="Protocol" />
              </ModalField>
            </ModalFormSection>
          )}
          {step === 2 && (
            <>
              <ModalFormSection title="Retention">
                <OptionChips value={form.retention} options={RETENTION} onChange={set("retention")} />
              </ModalFormSection>
              <ModalFormSection title="Review">
                <DescriptionList layout="inline">
                  <DescriptionItem label="Name">{form.name || undefined}</DescriptionItem>
                  <DescriptionItem label="Site">{form.site ? siteLabel(form.site) : undefined}</DescriptionItem>
                  <DescriptionItem label="Address" mono>{form.ip ? `${form.ip}:${form.port}` : undefined}</DescriptionItem>
                  <DescriptionItem label="Protocol">{PROTOCOLS.find((p) => p.value === form.protocol)?.label}</DescriptionItem>
                </DescriptionList>
              </ModalFormSection>
            </>
          )}
        </ModalBody>

        {/* 4 · Footer — Back left, Next / Finish right */}
        <ModalFooter align="between">
          <Button variant="outline" onClick={() => setStep((s) => s - 1)} disabled={step === 0}>
            Back
          </Button>
          <Button onClick={next}>{last ? "Add camera" : "Next"}</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function AddCameraWizard({ initialErrors = false }: { initialErrors?: boolean }) {
  const [open, setOpen] = React.useState(true);
  const [added, setAdded] = React.useState<string | null>(null);
  return (
    <div data-slot="wizard-pattern" className="flex flex-wrap items-center gap-3 p-6">
      <Button onClick={() => setOpen(true)}>
        <Plus /> Add camera
      </Button>
      {added && <StatusBadge tone="success">{added} added</StatusBadge>}
      <AddCameraModal open={open} onOpenChange={setOpen} onAdded={(f) => setAdded(f.name)} initialErrors={initialErrors} />
    </div>
  );
}

const WIZARD_ANATOMY: [string, string][] = [
  ["Shell", "Modal + ModalContent size=\"lg\" — header / subheader / body / footer, in that order"],
  ["Title", "ModalHeader (description is read to screen readers only)"],
  ["Step indicator", "Stepper in the ModalSubheader slot"],
  ["Fields", "ModalFormSection, ModalField, ModalFieldPair, ModalTextInput, ModalSelect, OptionChips"],
  ["Validation", "ModalField error + the input's invalid prop, checked on Next; editing a field clears its error"],
  ["Footer", "ModalFooter align=\"between\": outline Back, default Next → final-step label names the action"],
];

export const FormWizard: Story = {
  name: "Form wizard",
  render: () => (
    <div className="min-h-screen bg-background text-base text-foreground">
      <Anatomy
        title="Form in a modal (wizard)"
        intro="A focused multi-step task. Press Next with empty fields to see validation; finish to see the result on the page. Close with ✕ or Esc."
        items={WIZARD_ANATOMY}
      />
      <AddCameraWizard />
    </div>
  ),
};

export const FormWizardErrors: Story = {
  name: "Form wizard — validation errors",
  render: () => (
    <div className="min-h-screen bg-background text-base text-foreground">
      <Anatomy
        title="Form in a modal — validation state"
        intro="The same wizard after pressing Next on an empty first step: each field shows its own error under it, and the step doesn't advance."
        items={WIZARD_ANATOMY}
      />
      <AddCameraWizard initialErrors />
    </div>
  ),
};
