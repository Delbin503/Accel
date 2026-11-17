import * as React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  AlertTriangle, BarChart3, Building2, CalendarClock, CalendarDays, Check, ChevronLeft, ChevronRight, CircleCheck, CircleDot, Clock, Cpu, Download, Dumbbell, FileDown, FileText, FlagTriangleRight,
  ChevronDown, ChevronUp, HeartPulse, Layers, MoreHorizontal, Plus, Shapes, SlidersHorizontal, UploadCloud, User, Users, X,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@accel/ui/components/ui/popover";
import { Button } from "@accel/ui/components/ui/button";
import { SegmentedControl, SegmentedControlItem } from "@accel/ui/components/ui/segmented-control";
import { Input } from "@accel/ui/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@accel/ui/components/ui/select";
import { PageHeader } from "@accel/ui/components/layout/PageHeader";
import { KpiCard, KpiGrid } from "@accel/ui/components/shared/KpiCard";
import { ToolbarSearch } from "@accel/ui/components/shared/Toolbar";
import { FilterDropdown } from "@accel/ui/components/shared/FilterDropdown";
import { StatusBadge } from "@accel/ui/components/shared/StatusBadge";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalSubheader } from "@accel/ui/components/shared/Modal";
import { Stepper } from "@accel/ui/components/shared/Stepper";
import { TimeSelect } from "@accel/ui/components/shared/TimeSelect";
import { FloatingBar } from "@accel/ui/components/shared/FloatingBar";
import { LineChart } from "@accel/ui/components/charts";
import { cn } from "@accel/ui/lib/utils";
import {
  GROUP_RESULTS, SESSION_STATUS_LABEL, reportsFor, TA_AREAS, TA_SITES, USE_CASES, USE_CASE_KEYS,
  useDevicesStore, useReportsStore, useSessionsStore,
  type Participant, type SessionStatus, type TaSession, type UseCaseKey,
} from "./taData";
import { useTaModelsStore } from "./taModels";
import { TA_ANALYSIS, TA_RESULT_PATH } from "./taNav";
import { ItemButton } from "@accel/ui/components/ui/item";
import { DataTable, type DataTableColumn } from "@accel/ui/components/shared/DataTable";

/* Training Assessment module — Performance & Posture.

   One page for the whole session lifecycle, switched by the tab buttons at
   the top right (the same Deploy · Models control as Model Deployment):
   · Sessions — live and scheduled sessions (a session that completes moves to
     Results); New Session picks use case → site → deployed model →
     areas, then participants
   · Results  — completed sessions, with the same columns as Sessions (ID,
     session, use case, individual or group, where, when, status). A group
     session opens its result details page (TaSessionResult, below), where
     each person's results lead to their analysis dashboard — Swing, Lift or
     Rehab Analysis; an individual session opens that person's analysis. */

type Tab = "sessions" | "results";

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "sessions", label: "Sessions", icon: CalendarClock },
  { key: "results", label: "Results", icon: BarChart3 },
];

const UC_ICON: Record<UseCaseKey, React.ElementType> = { golf: FlagTriangleRight, gym: Dumbbell, physio: HeartPulse };

const STATUS_TONE: Record<SessionStatus, "info" | "critical" | "warning" | "success"> = {
  scheduled: "info", live: "critical", complete: "success",
};


const MENU_ITEM = "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-foreground hover:bg-muted";

function UseCaseChip({ uc }: { uc: UseCaseKey }) {
  const Icon = UC_ICON[uc];
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-border bg-muted px-2 py-0.5 text-2xs font-semibold text-muted-foreground">
      <Icon className="size-3" />
      {USE_CASES[uc].label}
    </span>
  );
}

function Panel({ title, sub, action, children, className }: { title: string; sub?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div data-slot="sessions-panel" className={cn("overflow-hidden rounded-xl border border-border bg-card", className)}>
      <div data-slot="sessions-panel-header" className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <p className="text-md font-bold text-foreground">{title}</p>
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>
        {action}
      </div>
      <div data-slot="sessions-panel-body" className="p-4">{children}</div>
    </div>
  );
}

/* ── Filters bar ──────────────────────────────────────────────────────── */

/* The collapsible Filters bar the app's list pages use (Incident Cases,
   Recordings): a summary row of the defaults — or how many are active — that
   opens to search and the labelled filter dropdowns. */
function FiltersBar({ chips, activeCount, search, onSearch, placeholder, children }: {
  chips: string[];
  activeCount: number;
  search: string;
  onSearch: (v: string) => void;
  placeholder: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <div data-slot="filters-bar" className="rounded-xl border border-border bg-card">
      <div className="flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-muted/30">
        <ItemButton variant="plain" type="button" onClick={() => setOpen((v) => !v)} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
          <SlidersHorizontal className="size-4 flex-shrink-0 text-muted-foreground" />
          <span className="text-base font-semibold text-foreground">Filters</span>
          {activeCount > 0 ? (
            <span className="rounded-full bg-primary-fill px-2 py-px text-xs font-semibold text-primary-foreground">{activeCount} active</span>
          ) : (
            <div className="hidden flex-wrap gap-1.5 sm:flex">
              {chips.map((l) => (
                <span key={l} className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">{l}</span>
              ))}
            </div>
          )}
        </ItemButton>
        <Button variant="ghost" size="icon-xs" className="border-0 hover:bg-transparent" type="button" aria-label={open ? "Collapse filters" : "Expand filters"} onClick={() => setOpen((v) => !v)}>
          {open ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
        </Button>
      </div>
      {open && (
        <div data-slot="filters-bar-body" className="space-y-3 rounded-b-xl border-t border-border bg-background px-4 py-4">
          <ToolbarSearch value={search} onChange={onSearch} placeholder={placeholder} className="sm:w-full" />
          {children}
        </div>
      )}
    </div>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}

/* ── Session columns — Sessions and Results list sessions the same way ── */

type SessionKind = "Individual" | "Group";

/** One person is an individual session; more than one is a group. */
function sessionKind(s: TaSession): SessionKind {
  return s.participants.length > 1 ? "Group" : "Individual";
}

function sessionMatches(s: TaSession, q: string) {
  return [s.id, s.name, s.modelName, s.deployment, s.coach, USE_CASES[s.useCase].label].join(" ").toLowerCase().includes(q);
}

const USE_CASE_FILTER = USE_CASE_KEYS.map((k) => ({ value: k, label: USE_CASES[k].label }));
const TYPE_FILTER: { value: SessionKind; label: string }[] = [
  { value: "Individual", label: "Individual" },
  { value: "Group", label: "Group" },
];
/* The Action column stays pinned to the right edge (DataTable `sticky: "right"`),
   so the ⋯ menu is reachable even when a narrow window scrolls the table sideways. */
const ROW_MENU = "flex size-7 items-center justify-center rounded border border-transparent text-muted-foreground transition-colors hover:border-border hover:bg-muted hover:text-foreground";
const HEAD = "whitespace-nowrap";

/** ID · Session · Use case · Type · Where · When · Status — the columns both tabs share. */
const SESSION_COLUMNS: DataTableColumn<TaSession>[] = [
  {
    key: "id", header: "ID", className: "whitespace-nowrap", headClassName: HEAD,
    cell: (s) => <span className="font-mono text-sm font-semibold text-muted-foreground group-hover:text-primary-ink">{s.id}</span>,
  },
  {
    key: "session", header: "SESSION", className: "min-w-[160px]", headClassName: HEAD,
    cell: (s) => (
      <>
        <p className="font-semibold text-foreground group-hover:text-primary-ink">{s.name}</p>
        <p className="text-xs text-muted-foreground">{s.coach}</p>
      </>
    ),
  },
  { key: "useCase", header: "USE CASE", headClassName: HEAD, cell: (s) => <UseCaseChip uc={s.useCase} /> },
  {
    key: "type", header: "TYPE", className: "whitespace-nowrap", headClassName: HEAD,
    cell: (s) => {
      const u = USE_CASES[s.useCase];
      const n = s.participants.length;
      const kind = sessionKind(s);
      const KindIcon = kind === "Group" ? Users : User;
      return (
        <>
          <p className="inline-flex items-center gap-1.5 text-foreground"><KindIcon className="size-3.5 text-muted-foreground" />{kind}</p>
          <p className="text-xs text-muted-foreground">{n} {n === 1 ? u.person : u.people}</p>
        </>
      );
    },
  },
  {
    key: "where", header: "WHERE", className: "min-w-[140px]", headClassName: HEAD,
    cell: (s) => {
      const u = USE_CASES[s.useCase];
      return (
        <>
          <p className="text-foreground">{s.deployment}</p>
          <p className="text-xs text-muted-foreground">{s.units.length} {s.units.length === 1 ? u.unit : u.units}</p>
        </>
      );
    },
  },
  {
    key: "when", header: "WHEN", className: "whitespace-nowrap", headClassName: HEAD,
    cell: (s) => (
      <>
        <p className="text-foreground">{s.date}</p>
        <p className="text-xs text-muted-foreground">{s.time} · {s.source}</p>
      </>
    ),
  },
  {
    key: "status", header: "STATUS", headClassName: HEAD,
    cell: (s) => <StatusBadge tone={STATUS_TONE[s.status]}>{SESSION_STATUS_LABEL[s.status]}</StatusBadge>,
  },
];

/* ── New session ───────────────────────────────────────────────────────── */

const SAMPLE_CSV: Record<UseCaseKey, { file: string; rows: [string, boolean][] }> = {
  golf: { file: "junior_squad.csv", rows: [["Ethan Lim", true], ["Chloe Ng", true], ["Lucas Tay", true]] },
  gym: { file: "barbell_class.csv", rows: [["Ben Ong", true], ["Nur Aisyah", false], ["Kelvin Chua", true]] },
  physio: { file: "knee_rehab_class.csv", rows: [["Daniel Wong", true], ["Siti Rahman", true], ["Mei Ling Chua", true]] },
};

const GROUPS: Record<UseCaseKey, string[]> = {
  golf: ["Junior squad (8 golfers)", "Academy squad (10 golfers)", "One golfer · lesson"],
  gym: ["6 pm barbell class (12 lifters)", "PT clients (18 lifters)", "One client · PT session"],
  physio: ["Knee rehab class (6 patients)", "Falls prevention class (8 patients)", "One-to-one visit"],
};

type NewSessionStep = "details" | "where" | "participants" | "review";
const NEW_SESSION_STEPS: { id: NewSessionStep; label: string; subtitle: string }[] = [
  { id: "details", label: "Session Details", subtitle: "Use case, name and when it runs" },
  { id: "where", label: "Where", subtitle: "Site, deployed model and the areas it covers" },
  { id: "participants", label: "Participants", subtitle: "Who takes part in this session" },
  { id: "review", label: "Review", subtitle: "Confirm and create your session" },
];
/* Same label as the Add a New Site wizard: small uppercase with a leading icon. */
const FIELD_LABEL = "mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground";

/* New Session follows the Add a New Site wizard: a step strip under the
   title, one question per step, Back / Continue in the footer and a review
   card before anything is created. Mounted fresh for each open (see
   SessionsTab), so it always starts on step 1 with golf picked. */
function NewSessionModal({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (s: TaSession) => void }) {
  const models = useTaModelsStore((s) => s.models);
  const devices = useDevicesStore((s) => s.devices);
  const [step, setStep] = React.useState<NewSessionStep>("details");
  const [uc, setUc] = React.useState<UseCaseKey>("golf");
  const [siteId, setSiteId] = React.useState("ma");
  const [deploymentId, setDeploymentId] = React.useState("ma-bays");
  const [areas, setAreas] = React.useState<string[]>(TA_AREAS.find((a) => a.id === "ma-bays")?.units ?? []);
  const [name, setName] = React.useState("");
  const [date, setDate] = React.useState("2026-11-14");
  const [from, setFrom] = React.useState("09:00");
  const [to, setTo] = React.useState("10:30");
  const [source, setSource] = React.useState<"Live" | "Recorded">("Live");
  const [group, setGroup] = React.useState(GROUPS.golf[0]);
  const [imported, setImported] = React.useState<[string, boolean][]>([]);
  const [errors, setErrors] = React.useState<{ name?: string; areas?: string }>({});

  const u = USE_CASES[uc];
  const sites = TA_SITES.filter((s) => s.useCase === uc);
  const site = TA_SITES.find((s) => s.id === siteId);
  const model = models.find((m) => m.assessment?.useCase === uc);
  const deployments = site?.areas ?? [];
  const deployment = TA_AREAS.find((a) => a.id === deploymentId);
  const deployed = !!model && !!deployment;
  const stepIdx = NEW_SESSION_STEPS.findIndex((s) => s.id === step);
  const UcIcon = UC_ICON[uc];
  const dateLabel = new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" }).replace(",", "");

  function pickUc(k: UseCaseKey) {
    setUc(k);
    const s = TA_SITES.find((x) => x.useCase === k);
    setSiteId(s?.id ?? "");
    pickDeployment(s?.areas[0]?.id ?? "");
    setGroup(GROUPS[k][0]);
    setImported([]);
  }
  function pickDeployment(id: string) {
    setDeploymentId(id);
    setAreas(TA_AREAS.find((a) => a.id === id)?.units ?? []);
    setErrors((e) => ({ ...e, areas: undefined }));
  }

  function next() {
    if (step === "details") {
      if (!name.trim()) { setErrors((e) => ({ ...e, name: "Session name is required." })); return; }
      setStep("where");
    } else if (step === "where") {
      if (!deployed) return;
      if (areas.length === 0) { setErrors((e) => ({ ...e, areas: "Pick at least one area." })); return; }
      setStep("participants");
    } else if (step === "participants") {
      setStep("review");
    }
  }
  function back() {
    if (step === "where") setStep("details");
    else if (step === "participants") setStep("where");
    else if (step === "review") setStep("participants");
  }

  function create() {
    if (!model || !site || !deployment) return;
    const count = Number(group.match(/\((\d+)/)?.[1] ?? 1);
    const people: Participant[] = [
      ...Array.from({ length: Math.min(count, 4) }, (_, i) => ({ name: `${u.person[0].toUpperCase()}${u.person.slice(1)} ${String(i + 1).padStart(3, "0")}`, detail: group.split(" (")[0], unit: areas[i % areas.length], attempts: 0, score: "—", change: "—", topFault: "—", consent: true })),
      ...imported.map(([nm, consent]) => ({ name: nm, detail: "From CSV", unit: areas[0], attempts: 0, score: "—", change: "—", topFault: "—", consent })),
    ];
    const areaDevices = devices.filter((d) => d.areaId === deploymentId && areas.includes(d.unit) && d.useInSessions);
    onCreate({
      id: `SES-${1050 + useSessionsStore.getState().sessions.length}`, name: name.trim(), useCase: uc, modelName: model.name, siteId: site.id,
      deployment: `${site.name} · ${deployment.name}`, units: areas, date: dateLabel, time: `${from}–${to}`, source,
      status: "scheduled", coach: { golf: "Daniel Lim", gym: "Sarah Koh", physio: "Dr. Lim" }[uc], participants: people, analysed: 0, captured: 0, flagged: 0, devices: areaDevices.map((x) => x.id),
    });
  }

  return (
    <Modal open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent size="lg">
        <ModalHeader title="New Assessment Session" description={NEW_SESSION_STEPS[stepIdx].subtitle} />

        <ModalSubheader>
          <Stepper steps={NEW_SESSION_STEPS} current={stepIdx} aria-label="New session steps" />
        </ModalSubheader>

        <ModalBody>
          {step === "details" && (
            <div data-slot="new-session-modal-details" className="space-y-4">
              <div>
                <label className={FIELD_LABEL}><Layers className="size-3" />Use Case</label>
                <Select value={uc} onValueChange={(v) => pickUc(v as UseCaseKey)}>
                  <SelectTrigger className="h-9 w-full text-base" aria-label="Use case"><SelectValue /></SelectTrigger>
                  <SelectContent position="popper">
                    {USE_CASE_KEYS.map((k) => {
                      const Icon = UC_ICON[k];
                      return (
                        <SelectItem key={k} value={k}>
                          <Icon className="size-4 text-muted-foreground" />
                          {USE_CASES[k].label}
                          <span className="text-muted-foreground">· {USE_CASES[k].full}</span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className={FIELD_LABEL}><FileText className="size-3" />Session Name</label>
                <Input value={name} onChange={(e) => { setName(e.target.value); setErrors((er) => ({ ...er, name: undefined })); }}
                  placeholder={uc === "golf" ? "e.g. Junior squad clinic" : uc === "gym" ? "e.g. 6 pm barbell class" : "e.g. Knee rehab class"}
                  className="h-9 text-base" aria-invalid={!!errors.name} />
                {errors.name && <p className="mt-1 text-xs text-severity-critical">{errors.name}</p>}
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={FIELD_LABEL}><CalendarDays className="size-3" />Date</label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-9 text-base" />
                </div>
                <div>
                  <label className={FIELD_LABEL}><Clock className="size-3" />Time</label>
                  <div className="flex items-center gap-2">
                    <TimeSelect value={from} onChange={setFrom} aria-label="Start time" className="min-w-0 flex-1" />
                    <span className="text-sm text-muted-foreground">to</span>
                    <TimeSelect value={to} onChange={setTo} aria-label="End time" className="min-w-0 flex-1" />
                  </div>
                </div>
              </div>
              <div>
                <p className={FIELD_LABEL}>Footage</p>
                <div role="radiogroup" aria-label="Footage" className="grid grid-cols-2 gap-2">
                  {(["Live", "Recorded"] as const).map((v) => (
                    <ItemButton variant="plain" key={v} role="radio" aria-checked={source === v} onClick={() => setSource(v)}
                      className={cn("flex-col items-start gap-0.5 rounded-lg border px-3 py-2.5 text-left transition-colors", source === v ? "border-primary/60 bg-primary/[0.06]" : "border-border bg-background hover:border-primary/30")}>
                      <span className={cn("text-base font-semibold", source === v ? "text-primary-ink" : "text-foreground")}>{v}</span>
                      <span className="text-xs text-muted-foreground">{v === "Live" ? "Analyse as it happens" : "Footage the VMS recorded"}</span>
                    </ItemButton>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === "where" && (
            <div data-slot="new-session-modal-where" className="space-y-4">
              <div>
                <label className={FIELD_LABEL}><Building2 className="size-3" />Site</label>
                <Select value={siteId} onValueChange={(v) => { setSiteId(v); pickDeployment(TA_SITES.find((x) => x.id === v)?.areas[0]?.id ?? ""); }}>
                  <SelectTrigger className="h-9 w-full text-base" aria-label="Site"><SelectValue /></SelectTrigger>
                  <SelectContent position="popper">{sites.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className={FIELD_LABEL}><Cpu className="size-3" />Deployed Model</label>
                <Select value={deploymentId} onValueChange={pickDeployment}>
                  <SelectTrigger className="h-9 w-full text-base" aria-label="Deployed model"><SelectValue /></SelectTrigger>
                  <SelectContent position="popper">
                    {deployments.map((a) => <SelectItem key={a.id} value={a.id}>{model?.name ?? "No model"} · {a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <p className="mt-1 text-xs text-muted-foreground">Active {u.label.toLowerCase()} deployments at {site?.name}. Deploy more from Model Deployment.</p>
              </div>
              {deployed && (
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className={cn(FIELD_LABEL, "mb-0")}><Shapes className="size-3" />Areas</label>
                    <span className={cn("text-xs", areas.length === 0 ? "text-severity-critical" : "text-muted-foreground")}>
                      {areas.length} of {deployment?.units.length} selected
                    </span>
                  </div>
                  <SegmentedControl type="multiple" variant="outline" value={areas} onValueChange={(v) => { setAreas(v); setErrors((e) => ({ ...e, areas: undefined })); }} aria-label="Areas">
                    {deployment?.units.map((a) => (
                      <SegmentedControlItem key={a} value={a}
                        className="h-auto rounded-lg bg-background px-2.5 py-1.5 text-sm hover:bg-background hover:text-muted-foreground hover:border-primary/30 data-[state=on]:border-primary/50 data-[state=on]:hover:border-primary/50 data-[state=on]:hover:bg-primary/10 data-[state=on]:hover:text-primary-ink">
                        {areas.includes(a) && <Check className="size-3" strokeWidth={3} />}
                        {a}
                      </SegmentedControlItem>
                    ))}
                  </SegmentedControl>
                  {errors.areas
                    ? <p className="mt-1 text-xs text-severity-critical">{errors.areas}</p>
                    : <p className="mt-1 text-xs text-muted-foreground">Only the cameras in these areas are analysed.</p>}
                </div>
              )}
            </div>
          )}

          {step === "participants" && (
            <div data-slot="new-session-modal-participants" className="space-y-4">
              <div>
                <label className={FIELD_LABEL}><Users className="size-3" />Participants</label>
                <Select value={group} onValueChange={setGroup}>
                  <SelectTrigger className="h-9 w-full text-base" aria-label="Participants"><SelectValue /></SelectTrigger>
                  <SelectContent position="popper">{GROUPS[uc].map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <p className={FIELD_LABEL}>Add From a File (Optional)</p>
                {imported.length === 0 ? (
                  <ItemButton variant="plain"
                    onClick={() => { setImported(SAMPLE_CSV[uc].rows); toast.message(`Read ${SAMPLE_CSV[uc].file}`, { description: `${SAMPLE_CSV[uc].rows.length} rows matched to ${u.people} profiles.` }); }}
                    className="flex-col gap-2 rounded-xl border-2 border-dashed border-border bg-background py-8 text-center transition-colors hover:border-primary/40 hover:bg-muted/40">
                    <UploadCloud className="size-7 text-muted-foreground" />
                    <span className="text-base font-semibold text-foreground">Click to import a CSV</span>
                    <span className="text-xs text-muted-foreground">One {u.person} per row · matched to existing profiles</span>
                  </ItemButton>
                ) : (
                  <div className="space-y-1.5">
                    {imported.map(([nm, consent]) => (
                      <div key={nm} className="flex items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2">
                        <User className="size-3.5 text-muted-foreground" />
                        <span className="flex-1 text-base font-semibold text-foreground">{nm}</span>
                        <span className={cn("text-xs", consent ? "text-success" : "text-warning")}>{consent ? "Consent on file" : "No consent · won't be recorded"}</span>
                      </div>
                    ))}
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      {SAMPLE_CSV[uc].file} · {imported.length} added
                      <Button variant="link" className="h-auto border-0 p-0 text-xs underline hover:text-foreground" onClick={() => setImported([])}>Remove</Button>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === "review" && (
            <div data-slot="new-session-modal-review" className="space-y-4">
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                  <UcIcon className="size-3.5 text-primary-ink" />
                  <p className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground">Session Details</p>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 px-4 py-3">
                  {([
                    ["Name", name || "—"],
                    ["Use Case", `${u.label} · ${u.full}`],
                    ["Date", dateLabel],
                    ["Time", `${from} – ${to}`],
                    ["Site", site?.name ?? "—"],
                    ["Deployed Model", `${model?.name ?? "—"} · ${deployment?.name ?? "—"}`],
                    ["Footage", source === "Live" ? "Live · analyse as it happens" : "Recorded · footage the VMS recorded"],
                    ["Participants", `${group}${imported.length ? ` + ${imported.length} from CSV` : ""}`],
                  ] as [string, string][]).map(([label, value]) => (
                    <div key={label} className="flex flex-col gap-0.5">
                      <span className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
                      <span className="text-sm font-medium text-foreground">{value}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border px-4 py-3">
                  <p className="mb-2 text-2xs font-semibold uppercase tracking-widest text-muted-foreground">Areas ({areas.length})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {areas.map((a) => (
                      <span key={a} className="inline-flex items-center rounded-md border border-border bg-background px-2 py-0.5 text-xs font-semibold text-foreground">{a}</span>
                    ))}
                  </div>
                </div>
              </div>
              {imported.some(([, c]) => !c) && (
                <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/[0.06] px-3 py-2.5">
                  <AlertTriangle className="mt-0.5 size-4 flex-shrink-0 text-warning" />
                  <p className="text-sm leading-snug text-muted-foreground">
                    {imported.filter(([, c]) => !c).map(([n]) => n).join(", ")} {imported.filter(([, c]) => !c).length === 1 ? "has" : "have"} no consent on file and won't be recorded.
                  </p>
                </div>
              )}
              <div className="flex items-start gap-2 rounded-lg border border-success/30 bg-success/[0.06] px-3 py-2.5">
                <CircleCheck className="mt-0.5 size-4 flex-shrink-0 text-success" />
                <p className="text-sm leading-snug text-muted-foreground">Ready to create. The session joins Sessions as scheduled, and you can start it from there.</p>
              </div>
            </div>
          )}
        </ModalBody>

        <ModalFooter align="between" className="bg-card">
          <div>
            {step !== "details" && (
              <Button variant="ghost" onClick={back} className="gap-1.5">
                <ChevronLeft className="size-3.5" />
                Back
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {step !== "review" ? (
              <>
                {step === "participants" && imported.length === 0 && (
                  <Button variant="outline" onClick={next}>Skip for now</Button>
                )}
                <Button onClick={next} className="gap-1.5" disabled={step === "where" && !deployed}>
                  Continue
                  <ChevronRight className="size-3.5" />
                </Button>
              </>
            ) : (
              <Button onClick={create} className="gap-1.5" disabled={!deployed}>
                <Check className="size-3.5" />
                Create Session
              </Button>
            )}
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/* ── Sessions tab ──────────────────────────────────────────────────────── */

/* Live and scheduled sessions. Once a session completes it moves to Results,
   where its reports are; the KPIs still count every session. */
function SessionsTab({ onShowResults, creating, onCreating }: { onShowResults: () => void; creating: boolean; onCreating: (v: boolean) => void }) {
  const navigate = useNavigate();
  const allSessions = useSessionsStore((s) => s.sessions);
  const sessions = allSessions.filter((s) => s.status !== "complete");
  const setSessions = useSessionsStore((s) => s.setSessions);
  const setReports = useReportsStore((s) => s.setReports);
  const [search, setSearch] = React.useState("");
  const [ucs, setUcs] = React.useState<string[]>([]);
  const [types, setTypes] = React.useState<string[]>([]);
  const [statuses, setStatuses] = React.useState<string[]>([]);
  const [kpi, setKpi] = React.useState<"all" | "live" | "scheduled">("all");
  const setCreating = onCreating;

  const filtered = sessions.filter((s) => {
    if (kpi !== "all" && s.status !== kpi) return false;
    if (ucs.length && !ucs.includes(s.useCase)) return false;
    if (types.length && !types.includes(sessionKind(s))) return false;
    if (statuses.length && !statuses.includes(s.status)) return false;
    const q = search.toLowerCase().trim();
    return !q || sessionMatches(s, q);
  });
  const hasFilters = !!search || ucs.length > 0 || types.length > 0 || statuses.length > 0 || kpi !== "all";

  function start(s: TaSession) {
    setSessions((cur) => cur.map((x) => (x.id === s.id ? { ...x, status: "live", date: "Today", captured: 0 } : x)));
    toast.success(`${s.name} is live`, { description: `Analysing ${s.units.length} ${USE_CASES[s.useCase].units}.` });
  }

  /* Ending a session completes it: it leaves this list and its reports join Results. */
  function end(s: TaSession) {
    const done: TaSession = { ...s, status: "complete", analysed: s.captured };
    setSessions((cur) => cur.map((x) => (x.id === s.id ? done : x)));
    setReports((cur) => [...reportsFor(done, true), ...cur.filter((r) => r.sessionId !== s.id)]);
    toast.success(`${s.name} complete`, {
      description: "Moved to Results with its reports.",
      action: { label: "View results", onClick: onShowResults },
    });
  }

  const openResult = (id: string) => navigate(`${TA_RESULT_PATH}?session=${id}`);

  const sessionTabColumns: DataTableColumn<TaSession>[] = [
    ...SESSION_COLUMNS,
    {
      key: "action", header: "ACTION", headClassName: HEAD, sticky: "right", stopRowClick: true,
      cell: (s) => (
        /* The "⋯" menu the other pages' tables use. */
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon-xs" aria-label={`Actions for ${s.name}`} className={cn("border-0", ROW_MENU)}>
              <MoreHorizontal className="size-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-44 p-1" align="end">
            {s.status === "scheduled" ? (
              <ItemButton variant="plain" onClick={() => start(s)} className={MENU_ITEM}>
                <CircleDot className="size-3.5 text-muted-foreground" />
                Start session
              </ItemButton>
            ) : (
              <>
                <ItemButton variant="plain" onClick={() => openResult(s.id)} className={MENU_ITEM}>
                  <BarChart3 className="size-3.5 text-muted-foreground" />
                  View results
                </ItemButton>
                <ItemButton variant="plain" onClick={() => end(s)} className={MENU_ITEM}>
                  <CircleCheck className="size-3.5 text-muted-foreground" />
                  End session
                </ItemButton>
              </>
            )}
          </PopoverContent>
        </Popover>
      ),
    },
  ];

  return (
    <div data-slot="sessions-tab" className="flex flex-col gap-4">
      <KpiGrid cols={3}>
        <KpiCard label="Total Sessions" value={allSessions.length} sub="Last 2 weeks" tone="primary" onClick={() => setKpi("all")} />
        <KpiCard label="Live" value={sessions.filter((s) => s.status === "live").length} sub="Being analysed" tone="severity-critical" active={kpi === "live"} onClick={() => setKpi(kpi === "live" ? "all" : "live")} />
        <KpiCard label="Scheduled" value={sessions.filter((s) => s.status === "scheduled").length} sub="Coming up" tone="info" active={kpi === "scheduled"} onClick={() => setKpi(kpi === "scheduled" ? "all" : "scheduled")} />
      </KpiGrid>

      <FiltersBar
        chips={["All use cases", "All types", "All statuses"]}
        activeCount={ucs.length + types.length + statuses.length + (search ? 1 : 0) + (kpi !== "all" ? 1 : 0)}
        search={search}
        onSearch={setSearch}
        placeholder="Search sessions, models or coaches…"
      >
        <div data-slot="sessions-tab-kpis" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <FilterField label="Use case">
            <FilterDropdown label="All use cases" options={USE_CASE_FILTER} selected={ucs} onChange={setUcs} className="w-full" />
          </FilterField>
          <FilterField label="Type">
            <FilterDropdown label="All types" options={TYPE_FILTER} selected={types} onChange={setTypes} className="w-full" />
          </FilterField>
          <FilterField label="Status">
            <FilterDropdown label="All statuses" options={(["live", "scheduled"] as SessionStatus[]).map((k) => ({ value: k, label: SESSION_STATUS_LABEL[k] }))} selected={statuses} onChange={setStatuses} className="w-full" />
          </FilterField>
        </div>
      </FiltersBar>

      <p className="px-1 text-base text-muted-foreground">
        <strong className="text-foreground">{filtered.length}</strong> session{filtered.length === 1 ? "" : "s"} match current filters
        {hasFilters && <Button variant="link" onClick={() => { setSearch(""); setUcs([]); setTypes([]); setStatuses([]); setKpi("all"); }} className="h-auto p-0 border-0 ml-2 underline hover:text-primary-ink">Clear all</Button>}
      </p>

      {filtered.length === 0 ? (
        <div data-slot="sessions-tab-empty" className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-20 text-muted-foreground">
          <CalendarClock className="size-10 opacity-20" />
          <p className="text-sm">{sessions.length === 0 ? "No live or scheduled sessions. Finished ones are in Results." : "No sessions match the current filters."}</p>
          {sessions.length === 0 && <Button size="sm" className="gap-1.5" onClick={() => setCreating(true)}><Plus className="size-4" />New Session</Button>}
        </div>
      ) : (
        <div data-slot="sessions-tab-table" className="overflow-hidden rounded-xl border border-border bg-card">
          <DataTable
            variant="list"
            columns={sessionTabColumns}
            data={filtered}
            getRowId={(s) => s.id}
            onRowClick={(s) => s.status === "live" && openResult(s.id)}
            // Only live sessions have results to open.
            getRowClassName={(s) => (s.status === "live" ? undefined : "cursor-default hover:bg-transparent")}
          />
        </div>
      )}

      {creating && <NewSessionModal
        open
        onClose={() => setCreating(false)}
        onCreate={(s) => {
          setSessions((cur) => [s, ...cur]);
          setCreating(false);
          toast.success(`${s.name} scheduled`, { description: `${s.date} · ${s.time} · ${s.participants.length} ${USE_CASES[s.useCase].people}` });
        }}
      />}
    </div>
  );
}

/* ── Session picker ────────────────────────────────────────────────────── */

function SessionPicker({ value, onChange, sessions, allowAll }: { value: string; onChange: (id: string) => void; sessions: TaSession[]; allowAll?: boolean }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 w-full" aria-label="Session"><SelectValue /></SelectTrigger>
      <SelectContent>
        {allowAll && <SelectItem value="all">All sessions</SelectItem>}
        {sessions.map((s) => (
          <SelectItem key={s.id} value={s.id}>{s.name} · {s.date}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** One person's result opens their use case's analysis dashboard — swing, lift or rehab. */
function analysisHref(uc: UseCaseKey, person: string, sessionId: string) {
  return `${TA_ANALYSIS[uc].path}?person=${encodeURIComponent(person)}&session=${sessionId}`;
}

/* ── Group results (a group report, or a session opened from Sessions) ─── */

function GroupResults({ session }: { session: TaSession }) {
  const navigate = useNavigate();
  const u = USE_CASES[session.useCase];
  const g = GROUP_RESULTS[session.useCase];
  const maxFault = Math.max(...g.faults.map(([, n]) => n));
  /* Physio counts who is on track against their own goal (60%+ of the way there) in this session. */
  const scoreValue = session.useCase === "physio"
    ? `${session.participants.filter((p) => parseInt(p.score, 10) >= 60).length} of ${session.participants.length}`
    : g.scoreValue;
  const rows = g.noRank ? [...session.participants].sort((a, b) => a.name.localeCompare(b.name)) : session.participants;
  const open = (p: Participant) => p.attempts > 0 && navigate(analysisHref(session.useCase, p.name, session.id));
  const columns: DataTableColumn<Participant>[] = [
    {
      key: "person", header: u.person.toUpperCase(), headClassName: HEAD,
      cell: (p) => (
        <>
          <p className="font-semibold text-foreground group-hover:text-primary-ink">{p.name}</p>
          <p className="text-xs text-muted-foreground">{p.detail}</p>
        </>
      ),
    },
    { key: "unit", header: u.unit.toUpperCase(), headClassName: HEAD, className: "text-muted-foreground", cell: (p) => p.unit },
    { key: "items", header: u.items.toUpperCase(), headClassName: HEAD, className: "text-foreground", cell: (p) => p.attempts || "—" },
    { key: "score", header: session.useCase === "physio" ? "PROGRESS TO GOAL" : "SCORE", headClassName: HEAD, className: "font-semibold text-foreground", cell: (p) => p.score },
    {
      key: "change", header: "CHANGE", headClassName: HEAD,
      cell: (p) => <span className={p.change.startsWith("+") ? "text-success" : p.change.startsWith("−") ? "text-severity-critical" : "text-muted-foreground"}>{p.change}</span>,
    },
    { key: "fault", header: session.useCase === "physio" ? "MAIN COMPENSATION" : "TOP FAULT", headClassName: HEAD, className: "text-foreground", cell: (p) => p.topFault },
    {
      key: "open", header: "", headClassName: HEAD, className: "whitespace-nowrap text-right",
      cell: (p) => p.attempts > 0 ? (
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground group-hover:text-primary-ink">{TA_ANALYSIS[session.useCase].label}<ChevronRight className="size-4" /></span>
      ) : (
        <span className="text-xs text-muted-foreground">No {u.items} yet</span>
      ),
    },
  ];

  return (
    <div data-slot="group-results" className="flex flex-col gap-4">
      <div data-slot="group-results-meta" className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <StatusBadge tone={STATUS_TONE[session.status]}>{SESSION_STATUS_LABEL[session.status]}</StatusBadge>
        <UseCaseChip uc={session.useCase} />
        <span>{session.date} · {session.time}</span>
        <span>{session.deployment} · {session.units.length} {u.units}</span>
        <span>{session.modelName} · {session.coach}</span>
      </div>

      {session.status === "live" && (
        <div className="flex items-center gap-2 rounded-lg border border-severity-critical/30 bg-severity-critical/[0.06] px-3 py-2 text-sm text-foreground">
          <span className="size-2 animate-pulse rounded-full bg-severity-critical" />
          Live · results update as each {u.item} is analysed.
        </div>
      )}

      <KpiGrid cols={4}>
        <KpiCard label={u.people[0].toUpperCase() + u.people.slice(1)} value={session.participants.length} sub={`${session.participants.filter((p) => p.attempts > 0).length} assessed`} tone="primary" />
        <KpiCard label={g.scoreLabel} value={scoreValue} sub={g.scoreSub} tone="success" />
        <KpiCard label={`${u.items[0].toUpperCase() + u.items.slice(1)} analysed`} value={`${session.analysed} of ${session.captured}`} sub={`${session.captured - session.analysed} not analysed`} tone="info" />
        <KpiCard label="Flagged for review" value={session.flagged} sub="Low-confidence findings" tone="warning" />
      </KpiGrid>

      <div data-slot="group-results-table" className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <div>
            <p className="text-md font-bold text-foreground">Individual results</p>
            <p className="text-xs text-muted-foreground">{g.noRank ? "Alphabetical · never ranked against each other" : "Ranked as recorded"}</p>
          </div>
          <span className="whitespace-nowrap text-xs text-muted-foreground">{rows.filter((p) => p.attempts > 0).length} of {rows.length} {u.people} with results</span>
        </div>
        <DataTable
          variant="list"
          columns={columns}
          data={rows}
          getRowId={(p) => p.name}
          onRowClick={open}
          // Only people with results open an analysis.
          getRowClassName={(p) => (p.attempts > 0 ? undefined : "cursor-default hover:bg-transparent")}
        />
      </div>

      <div data-slot="group-results-charts" className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Panel title={g.trendTitle} sub="Last five sessions">
          <LineChart data={g.trend} xKey="session" series={[{ key: "score", label: session.useCase === "physio" ? "Attended" : "Score" }]} className="h-52" />
        </Panel>
        <Panel title={g.faultsTitle} sub={`Out of ${session.participants.length} ${u.people}`}>
          <div className="space-y-3">
            {g.faults.map(([name, n]) => (
              <div key={name}>
                <div className="mb-1 flex justify-between text-sm"><span className="text-foreground">{name}</span><span className="text-muted-foreground">{n} {n === 1 ? u.person : u.people}</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-warning" style={{ width: `${(n / maxFault) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* ── Results tab: completed sessions, one row each — the same columns as
   Sessions. The group and individual reports live inside the session's
   results, so a row opens them: a group session its result details page,
   an individual session that person's analysis. ─────────────────────── */

function ResultsTab({ sessionId, onSession, focus }: {
  sessionId: string;
  onSession: (id: string) => void;
  focus?: string;
}) {
  const navigate = useNavigate();
  const sessions = useSessionsStore((s) => s.sessions).filter((s) => s.status === "complete");
  const reports = useReportsStore((s) => s.reports);
  const [ucs, setUcs] = React.useState<string[]>([]);
  const [types, setTypes] = React.useState<string[]>([]);
  const [search, setSearch] = React.useState(focus ?? "");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  const sessionFilter = sessionId && sessions.some((s) => s.id === sessionId) ? sessionId : "all";
  const reportCount = (id: string) => reports.filter((r) => r.sessionId === id).length;
  const q = search.toLowerCase().trim();
  const filtered = sessions.filter((s) => {
    if (sessionFilter !== "all" && s.id !== sessionFilter) return false;
    if (ucs.length && !ucs.includes(s.useCase)) return false;
    if (types.length && !types.includes(sessionKind(s))) return false;
    // People are searchable too, so a name finds the session they were in.
    return !q || sessionMatches(s, q) || s.participants.some((p) => p.name.toLowerCase().includes(q));
  });
  const hasFilters = !!search || ucs.length > 0 || types.length > 0 || sessionFilter !== "all";

  function viewResults(s: TaSession) {
    navigate(sessionKind(s) === "Group" ? `${TA_RESULT_PATH}?session=${s.id}` : analysisHref(s.useCase, s.participants[0].name, s.id));
  }

  function exportPdf(s: TaSession) {
    toast.success("Exporting PDF", { description: `${s.id}_${s.name.replace(/[\s·]+/g, "_")}.pdf · ${reportCount(s.id)} report${reportCount(s.id) === 1 ? "" : "s"}` });
  }

  function toggle(id: string) {
    setSelected((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const resultColumns: DataTableColumn<TaSession>[] = [
    ...SESSION_COLUMNS,
    {
      key: "action", header: "ACTION", headClassName: HEAD, sticky: "right", stopRowClick: true,
      cell: (s) => (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon-xs" aria-label={`Actions for ${s.name}`} className={cn("border-0", ROW_MENU)}>
              <MoreHorizontal className="size-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-44 p-1" align="end">
            <ItemButton variant="plain" onClick={() => viewResults(s)} className={MENU_ITEM}>
              <BarChart3 className="size-3.5 text-muted-foreground" />
              View results
            </ItemButton>
            <ItemButton variant="plain" onClick={() => exportPdf(s)} className={MENU_ITEM}>
              <Download className="size-3.5 text-muted-foreground" />
              Export PDF
            </ItemButton>
          </PopoverContent>
        </Popover>
      ),
    },
  ];

  function exportSelected(format: "PDF" | "CSV") {
    const n = selected.size;
    const count = filtered.filter((s) => selected.has(s.id)).reduce((t, s) => t + reportCount(s.id), 0);
    toast.success(`Exporting ${n} session${n === 1 ? "" : "s"} as ${format}`, {
      description: format === "PDF" ? `${count} reports, one PDF each, zipped together.` : `${count} reports, one row each, with scores and findings.`,
    });
    setSelected(new Set());
  }

  return (
    <div data-slot="results-tab" className={cn("flex flex-col gap-4", selected.size > 0 && "pb-24")}>
      <FiltersBar
        chips={["All sessions", "All use cases", "All types"]}
        activeCount={ucs.length + types.length + (search ? 1 : 0) + (sessionFilter !== "all" ? 1 : 0)}
        search={search}
        onSearch={setSearch}
        placeholder="Search sessions, coaches or people…"
      >
        <div data-slot="results-tab-kpis" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <FilterField label="Session">
            <SessionPicker value={sessionFilter} onChange={onSession} sessions={sessions} allowAll />
          </FilterField>
          <FilterField label="Use case">
            <FilterDropdown label="All use cases" options={USE_CASE_FILTER} selected={ucs} onChange={setUcs} className="w-full" />
          </FilterField>
          <FilterField label="Type">
            <FilterDropdown label="All types" options={TYPE_FILTER} selected={types} onChange={setTypes} className="w-full" />
          </FilterField>
        </div>
      </FiltersBar>

      <p className="px-1 text-base text-muted-foreground">
        <strong className="text-foreground">{filtered.length}</strong> session{filtered.length === 1 ? "" : "s"} match current filters
        {hasFilters && <Button variant="link" onClick={() => { setSearch(""); setUcs([]); setTypes([]); onSession("all"); }} className="h-auto p-0 border-0 ml-2 underline hover:text-primary-ink">Clear all</Button>}
      </p>

      {filtered.length === 0 ? (
        <div data-slot="results-tab-empty" className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-20 text-muted-foreground">
          <FileText className="size-10 opacity-20" />
          <p className="text-sm">{sessions.length === 0 ? "No completed sessions yet. Ended sessions land here with their results." : "No sessions match the current filters."}</p>
        </div>
      ) : (
        <div data-slot="results-tab-table" className="overflow-hidden rounded-xl border border-border bg-card">
          <DataTable
            variant="list"
            columns={resultColumns}
            data={filtered}
            getRowId={(s) => s.id}
            onRowClick={viewResults}
            getRowClassName={(s) => (selected.has(s.id) ? "bg-primary/5 data-[state=selected]:bg-primary/5" : undefined)}
            selection={{
              selectedIds: selected,
              onToggle: (id) => toggle(id),
              onToggleAll: (checked) => setSelected((cur) => {
                const next = new Set(cur);
                filtered.forEach((s) => (checked ? next.add(s.id) : next.delete(s.id)));
                return next;
              }),
              getRowLabel: (s) => `Select ${s.name}`,
            }}
          />
        </div>
      )}

      {selected.size > 0 && (
        <FloatingBar className="flex flex-wrap items-center gap-3 rounded-xl border border-primary bg-card px-4 py-3 shadow-[0_16px_48px_hsl(var(--primary)/0.25)]">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary-fill text-primary-foreground">
              <Check className="size-3.5" strokeWidth={3} />
            </div>
            <span className="text-base font-semibold text-foreground">{selected.size} session{selected.size === 1 ? "" : "s"} selected</span>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            <Button variant="ghost" className="gap-1.5 text-sm text-muted-foreground" onClick={() => setSelected(new Set())}>
              <X className="size-3.5" />
              Clear selection
            </Button>
            <div className="mx-1 h-4 w-px bg-border" />
            <Button variant="outline" className="gap-1.5" onClick={() => exportSelected("CSV")}>
              <Download className="size-3.5" />
              Export CSV
            </Button>
            <Button className="gap-1.5" onClick={() => exportSelected("PDF")}>
              <Download className="size-3.5" />
              Export PDF
            </Button>
          </div>
        </FloatingBar>
      )}
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────────────────── */

export function TaSessions() {
  const location = useLocation();
  // The Reports tab merged into Results, so old links to it land there.
  const asked = new URLSearchParams(location.search).get("tab");
  const [tab, setTab] = React.useState<Tab>(asked === "results" || asked === "reports" ? "results" : "sessions");
  const [sessionId, setSessionId] = React.useState("all");
  const [creating, setCreating] = React.useState(false);

  return (
    <div data-slot="ta-sessions-page" className="flex flex-col gap-4">
      <PageHeader>
        <PageHeader.Content>
          <PageHeader.Title>Performance & Posture</PageHeader.Title>
        </PageHeader.Content>
        <PageHeader.Actions>
          <SegmentedControl type="single" value={tab} onValueChange={(v) => v && setTab(v as Tab)} aria-label="Performance & Posture view"
            className="h-7 gap-0 rounded-md border border-border bg-background p-0.5">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <SegmentedControlItem key={t.key} value={t.key}
                  className="h-full gap-1.5 rounded px-2.5 font-semibold data-[state=off]:hover:bg-muted data-[state=on]:bg-primary-fill data-[state=on]:text-primary-foreground data-[state=on]:shadow-none data-[state=on]:hover:text-primary-foreground">
                  <Icon className="size-3.5" />
                  {t.label}
                </SegmentedControlItem>
              );
            })}
          </SegmentedControl>
          {/* Sessions' main action, top right, as on every list page. */}
          {tab === "sessions" && (
            <Button size="sm" className="gap-1.5" onClick={() => setCreating(true)}>
              <Plus className="size-4" />
              New Session
            </Button>
          )}
        </PageHeader.Actions>
      </PageHeader>

      {tab === "sessions" && <SessionsTab creating={creating} onCreating={setCreating} onShowResults={() => { setSessionId("all"); setTab("results"); }} />}
      {tab === "results" && <ResultsTab sessionId={sessionId} onSession={setSessionId} />}
    </div>
  );
}

/* ── Result details page ───────────────────────────────────────────────── */

/* A session's results on a page of its own: titled with the result's name,
   with Export PDF. Opened from a group result in Results, or a live session;
   the breadcrumb leads back to Results. */
export function TaSessionResult() {
  const location = useLocation();
  const id = new URLSearchParams(location.search).get("session");
  const session = useSessionsStore((s) => s.sessions).find((s) => s.id === id);

  return (
    <div data-slot="ta-session-result-page" className="flex flex-col gap-4">
      <PageHeader>
        <PageHeader.Content>
          <PageHeader.Title>{session?.name ?? "Result not found"}</PageHeader.Title>
        </PageHeader.Content>
        {session && (
          <PageHeader.Actions>
            <Button size="sm" className="gap-1.5" onClick={() => toast.success("Report exported", { description: `${session.id}_${session.name.replace(/\s+/g, "_")}.pdf` })}>
              <FileDown className="size-3.5" />
              Export PDF
            </Button>
          </PageHeader.Actions>
        )}
      </PageHeader>
      {session ? (
        <GroupResults session={session} />
      ) : (
        <div data-slot="ta-session-result-page-empty" className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-20 text-muted-foreground">
          <BarChart3 className="size-10 opacity-20" />
          <p className="text-sm">This result isn't available. Pick one from Results.</p>
        </div>
      )}
    </div>
  );
}
