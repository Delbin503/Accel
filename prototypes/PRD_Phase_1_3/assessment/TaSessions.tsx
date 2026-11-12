import * as React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  BarChart3, CalendarClock, Check, ChevronRight, CircleCheck, CircleDot, Download, Dumbbell, FileDown, FileText, FlagTriangleRight,
  ChevronDown, ChevronUp, HeartPulse, MoreHorizontal, Plus, Radio, Search, SlidersHorizontal, Upload, User, Users, X,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { PageHeader } from "@/components/layout/PageHeader";
import { KpiCard, KpiGrid } from "@/components/shared/KpiCard";
import { FilterDropdown } from "@/components/shared/FilterDropdown";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@/components/shared/Modal";
import { FloatingBar } from "@/components/shared/FloatingBar";
import { LineChart } from "@/components/charts";
import { cn } from "@/lib/utils";
import {
  GROUP_RESULTS, SESSION_STATUS_LABEL, reportsFor, TA_AREAS, TA_SITES, USE_CASES, USE_CASE_KEYS,
  useDevicesStore, useReportsStore, useSessionsStore,
  type Participant, type SessionStatus, type TaSession, type UseCaseKey,
} from "./taData";
import { useTaModelsStore } from "./taModels";
import { TA_ANALYSIS, TA_RESULT_PATH } from "./taNav";

/* Training Assessment module — Performance & Posture.

   One page for the whole session lifecycle, switched by the tab buttons at
   the top right (the same Deploy · Models control as Model Deployment):
   · Sessions — live and scheduled sessions (a session that completes moves to
     Results); New Session picks use case → site → deployed model →
     bays/racks/rooms, then participants
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


const TH = "whitespace-nowrap px-4 py-2.5 font-mono text-2xs uppercase tracking-[0.15em] text-muted-foreground/60";
const MENU_ITEM = "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-foreground hover:bg-muted";
const LABEL = "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground";

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
    <div className={cn("overflow-hidden rounded-xl border border-border bg-card", className)}>
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <p className="text-md font-bold text-foreground">{title}</p>
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
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
    <div className="rounded-xl border border-border bg-card">
      <div className="flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-muted/30">
        <button type="button" onClick={() => setOpen((v) => !v)} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
          <SlidersHorizontal className="size-4 flex-shrink-0 text-muted-foreground" />
          <span className="text-base font-semibold text-foreground">Filters</span>
          {activeCount > 0 ? (
            <span className="rounded-full bg-primary px-2 py-px text-xs font-semibold text-primary-foreground">{activeCount} active</span>
          ) : (
            <div className="hidden flex-wrap gap-1.5 sm:flex">
              {chips.map((l) => (
                <span key={l} className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">{l}</span>
              ))}
            </div>
          )}
        </button>
        <button type="button" aria-label={open ? "Collapse filters" : "Expand filters"} onClick={() => setOpen((v) => !v)}>
          {open ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
        </button>
      </div>
      {open && (
        <div className="space-y-3 rounded-b-xl border-t border-border bg-background px-4 py-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => onSearch(e.target.value)} placeholder={placeholder} className="h-9 w-full pl-9 text-base" />
          </div>
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

const SESSION_HEAD = ["ID", "SESSION", "USE CASE", "TYPE", "WHERE", "WHEN", "STATUS", "ACTION"];
const USE_CASE_FILTER = USE_CASE_KEYS.map((k) => ({ value: k, label: USE_CASES[k].label }));
const TYPE_FILTER: { value: SessionKind; label: string }[] = [
  { value: "Individual", label: "Individual" },
  { value: "Group", label: "Group" },
];
/* The Action column stays pinned to the right edge, so the ⋯ menu is reachable
   even when a narrow window scrolls the table sideways. */
// Opaque mixes of the header and row-hover tints, so pinned cells hide what scrolls under them.
const STICKY_TH = "sticky right-0 bg-[color-mix(in_srgb,var(--muted)_30%,var(--card))]";
const STICKY_TD = "sticky right-0 bg-card px-4 py-3 group-hover:bg-[color-mix(in_srgb,var(--muted)_20%,var(--card))]";
const ROW_MENU = "flex size-7 items-center justify-center rounded border border-transparent text-muted-foreground/50 transition-colors hover:border-border hover:bg-muted hover:text-foreground";

/** ID · Session · Use case · Type · Where · When — the cells both tabs share. */
function SessionCells({ s }: { s: TaSession }) {
  const u = USE_CASES[s.useCase];
  const n = s.participants.length;
  const kind = sessionKind(s);
  const KindIcon = kind === "Group" ? Users : User;
  return (
    <>
      <td className="whitespace-nowrap px-4 py-3">
        <span className="font-mono text-sm font-semibold text-muted-foreground group-hover:text-primary">{s.id}</span>
      </td>
      <td className="min-w-[160px] px-4 py-3">
        <p className="font-semibold text-foreground group-hover:text-primary">{s.name}</p>
        <p className="text-xs text-muted-foreground">{s.coach}</p>
      </td>
      <td className="px-4 py-3"><UseCaseChip uc={s.useCase} /></td>
      <td className="whitespace-nowrap px-4 py-3">
        <p className="inline-flex items-center gap-1.5 text-foreground"><KindIcon className="size-3.5 text-muted-foreground" />{kind}</p>
        <p className="text-xs text-muted-foreground">{n} {n === 1 ? u.person : u.people}</p>
      </td>
      <td className="min-w-[140px] px-4 py-3">
        <p className="text-foreground">{s.deployment}</p>
        <p className="text-xs text-muted-foreground">{s.units.length} {s.units.length === 1 ? u.unit : u.units}{s.devices.length > 0 ? ` · ${s.devices.length} device${s.devices.length === 1 ? "" : "s"}` : " · no device"}</p>
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        <p className="text-foreground">{s.date}</p>
        <p className="text-xs text-muted-foreground">{s.time} · {s.source}</p>
      </td>
    </>
  );
}

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

function NewSessionModal({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (s: TaSession) => void }) {
  const models = useTaModelsStore((s) => s.models);
  const devices = useDevicesStore((s) => s.devices);
  const [uc, setUc] = React.useState<UseCaseKey>("golf");
  const [siteId, setSiteId] = React.useState("ma");
  const [areaId, setAreaId] = React.useState("ma-bays");
  /* Mounted fresh for each open (see SessionsTab), so it always starts on golf. */
  const [units, setUnits] = React.useState<string[]>(TA_AREAS.find((a) => a.id === "ma-bays")?.units ?? []);
  const [name, setName] = React.useState("");
  const [date, setDate] = React.useState("2026-11-14");
  const [from, setFrom] = React.useState("09:00");
  const [to, setTo] = React.useState("10:30");
  const [source, setSource] = React.useState<"Live" | "Recorded">("Live");
  const [group, setGroup] = React.useState(GROUPS.golf[0]);
  const [imported, setImported] = React.useState<[string, boolean][]>([]);
  const [error, setError] = React.useState<string | null>(null);

  const u = USE_CASES[uc];
  const sites = TA_SITES.filter((s) => s.useCase === uc);
  const site = TA_SITES.find((s) => s.id === siteId);
  const model = models.find((m) => m.assessment?.useCase === uc);
  const areas = site?.areas ?? [];
  const area = TA_AREAS.find((a) => a.id === areaId);
  const deployed = !!model && !!area;
  const areaDevices = devices.filter((d) => d.areaId === areaId && units.includes(d.unit) && d.useInSessions);


  function pickUc(k: UseCaseKey) {
    setUc(k);
    const s = TA_SITES.find((x) => x.useCase === k);
    setSiteId(s?.id ?? "");
    setAreaId(s?.areas[0]?.id ?? "");
    setUnits(s?.areas[0]?.units ?? []);
    setGroup(GROUPS[k][0]);
    setImported([]);
  }
  function pickArea(id: string) {
    setAreaId(id);
    setUnits(TA_AREAS.find((a) => a.id === id)?.units ?? []);
  }

  function create() {
    if (!name.trim()) { setError("Name the session."); return; }
    if (units.length === 0) { setError(`Pick at least one ${u.unit}.`); return; }
    if (!model || !site || !area) return;
    const d = new Date(`${date}T00:00:00`);
    const dateLabel = d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" }).replace(",", "");
    const count = Number(group.match(/\((\d+)/)?.[1] ?? 1);
    const people: Participant[] = [
      ...Array.from({ length: Math.min(count, 4) }, (_, i) => ({ name: `${u.person[0].toUpperCase()}${u.person.slice(1)} ${String(i + 1).padStart(3, "0")}`, detail: group.split(" (")[0], unit: units[i % units.length], attempts: 0, score: "—", change: "—", topFault: "—", consent: true })),
      ...imported.map(([nm, consent]) => ({ name: nm, detail: "From CSV", unit: units[0], attempts: 0, score: "—", change: "—", topFault: "—", consent })),
    ];
    onCreate({
      id: `SES-${1050 + useSessionsStore.getState().sessions.length}`, name: name.trim(), useCase: uc, modelName: model.name, siteId: site.id,
      deployment: `${site.name} · ${area.name}`, units, date: dateLabel, time: `${from}–${to}`, source,
      status: "scheduled", coach: { golf: "Daniel Lim", gym: "Sarah Koh", physio: "Dr. Lim" }[uc], participants: people, analysed: 0, captured: 0, flagged: 0, devices: areaDevices.map((x) => x.id),
    });
  }

  return (
    <Modal open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent size="xl">
        <ModalHeader title="New Assessment Session" description="Pick the use case, where it runs and who takes part." icon={CalendarClock} />
        <ModalBody className="space-y-5">
          {/* Use case */}
          <div>
            <p className={LABEL}>Use Case</p>
            <div role="radiogroup" aria-label="Use case" className="grid grid-cols-3 gap-2">
              {USE_CASE_KEYS.map((k) => {
                const Icon = UC_ICON[k];
                const on = uc === k;
                return (
                  <button key={k} type="button" role="radio" aria-checked={on} onClick={() => pickUc(k)}
                    className={cn("flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-colors", on ? "border-primary/60 bg-primary/[0.06]" : "border-border bg-background hover:border-primary/30")}>
                    <Icon className={cn("mt-0.5 size-4", on ? "text-primary" : "text-muted-foreground")} />
                    <span>
                      <span className={cn("block text-base font-semibold", on ? "text-primary" : "text-foreground")}>{USE_CASES[k].label}</span>
                      <span className="block text-xs text-muted-foreground">{USE_CASES[k].full} · {USE_CASES[k].units}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Where */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={LABEL}>Site</label>
              <Select value={siteId} onValueChange={(v) => { setSiteId(v); const s = TA_SITES.find((x) => x.id === v); pickArea(s?.areas[0]?.id ?? ""); }}>
                <SelectTrigger className="h-9 w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{sites.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <label className={LABEL}>Deployed Model</label>
              <Select value={areaId} onValueChange={pickArea}>
                <SelectTrigger className="h-9 w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {areas.map((a) => <SelectItem key={a.id} value={a.id}>{a.name} · {model?.name ?? "No model"}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="mt-1 text-2xs text-muted-foreground">Active {u.label.toLowerCase()} deployments at {site?.name}. Deploy more from Model Deployment.</p>
            </div>
          </div>

          {deployed && (
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <p className={cn(LABEL, "mb-0")}>{u.units} · from this deployment</p>
                <span className="text-xs text-muted-foreground">{units.length} of {area?.units.length} selected</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {area?.units.map((un) => {
                  const on = units.includes(un);
                  const dev = devices.find((d) => d.areaId === areaId && d.unit === un && d.useInSessions);
                  return (
                    <button key={un} type="button" aria-pressed={on} onClick={() => setUnits((cur) => (on ? cur.filter((x) => x !== un) : [...cur, un]))}
                      className={cn("inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm font-medium transition-colors",
                        on ? "border-primary/50 bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground hover:border-primary/30")}>
                      {on && <Check className="size-3" strokeWidth={3} />}
                      {un}
                      {dev && <span title={`${dev.id} · ${dev.type}`}><Radio className="size-3 text-info" /></span>}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1.5 text-2xs text-muted-foreground">
                Only these cameras are analysed.{areaDevices.length > 0 && ` ${areaDevices.length} external device${areaDevices.length === 1 ? "" : "s"} (${areaDevices.map((d) => d.id).join(", ")}) add their readings.`}
              </p>
            </div>
          )}

          {/* When */}
          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-2">
              <label className={LABEL}>Session Name</label>
              <Input value={name} onChange={(e) => { setName(e.target.value); setError(null); }} placeholder={uc === "golf" ? "Junior squad clinic" : uc === "gym" ? "6 pm barbell class" : "Knee rehab class"} className="h-9" aria-invalid={!!error && !name.trim()} />
            </div>
            <div>
              <label className={LABEL}>Date</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-9" />
            </div>
            <div>
              <label className={LABEL}>Time</label>
              <div className="flex items-center gap-1">
                <Input type="time" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9 px-2" aria-label="From" />
                <Input type="time" value={to} onChange={(e) => setTo(e.target.value)} className="h-9 px-2" aria-label="To" />
              </div>
            </div>
          </div>

          {/* Who */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Participants</label>
              <Select value={group} onValueChange={setGroup}>
                <SelectTrigger className="h-9 w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{GROUPS[uc].map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
              <div className="mt-2 flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => { setImported(SAMPLE_CSV[uc].rows); toast.message(`Read ${SAMPLE_CSV[uc].file}`, { description: `${SAMPLE_CSV[uc].rows.length} rows matched to ${u.people} profiles.` }); }}>
                  <Upload className="size-3.5" />
                  Import CSV
                </Button>
                {imported.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {SAMPLE_CSV[uc].file} · {imported.length} added
                    <button className="ml-1.5 underline hover:text-foreground" onClick={() => setImported([])}>Remove</button>
                  </span>
                )}
              </div>
              {imported.some(([, c]) => !c) && (
                <p className="mt-1.5 text-2xs text-warning">{imported.filter(([, c]) => !c).map(([n]) => n).join(", ")}: no consent on file · won't be recorded.</p>
              )}
            </div>
            <div>
              <p className={LABEL}>Footage</p>
              <div role="radiogroup" aria-label="Footage" className="grid grid-cols-2 gap-2">
                {(["Live", "Recorded"] as const).map((v) => (
                  <button key={v} type="button" role="radio" aria-checked={source === v} onClick={() => setSource(v)}
                    className={cn("rounded-lg border px-3 py-2 text-left transition-colors", source === v ? "border-primary/60 bg-primary/[0.06]" : "border-border bg-background hover:border-primary/30")}>
                    <span className={cn("block text-sm font-semibold", source === v ? "text-primary" : "text-foreground")}>{v}</span>
                    <span className="block text-2xs text-muted-foreground">{v === "Live" ? "Analyse as it happens" : "Footage the VMS recorded"}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          {error && <p className="text-sm text-sev-critical">{error}</p>}
        </ModalBody>
        <ModalFooter>
          <Button size="sm" onClick={create} className="gap-1.5" disabled={!deployed}>
            <Plus className="size-3.5" />
            Create Session
          </Button>
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

  return (
    <div className="flex flex-col gap-4">
      <KpiGrid cols={3}>
        <KpiCard label="Total Sessions" value={allSessions.length} sub="Last 2 weeks" accent="primary" onClick={() => setKpi("all")} />
        <KpiCard label="Live" value={sessions.filter((s) => s.status === "live").length} sub="Being analysed" accent="sev-critical" active={kpi === "live"} onClick={() => setKpi(kpi === "live" ? "all" : "live")} />
        <KpiCard label="Scheduled" value={sessions.filter((s) => s.status === "scheduled").length} sub="Coming up" accent="info" active={kpi === "scheduled"} onClick={() => setKpi(kpi === "scheduled" ? "all" : "scheduled")} />
      </KpiGrid>

      <FiltersBar
        chips={["All use cases", "All types", "All statuses"]}
        activeCount={ucs.length + types.length + statuses.length + (search ? 1 : 0) + (kpi !== "all" ? 1 : 0)}
        search={search}
        onSearch={setSearch}
        placeholder="Search sessions, models or coaches…"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
        {hasFilters && <button onClick={() => { setSearch(""); setUcs([]); setTypes([]); setStatuses([]); setKpi("all"); }} className="ml-2 underline hover:text-primary">Clear all</button>}
      </p>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-20 text-muted-foreground">
          <CalendarClock className="size-10 opacity-20" />
          <p className="text-sm">{sessions.length === 0 ? "No live or scheduled sessions. Finished ones are in Results." : "No sessions match the current filters."}</p>
          {sessions.length === 0 && <Button size="sm" className="gap-1.5" onClick={() => setCreating(true)}><Plus className="size-4" />New Session</Button>}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30">
                <tr className="border-b border-border text-left">
                  {SESSION_HEAD.map((h) => <th key={h} className={cn(TH, h === "ACTION" && STICKY_TH)}>{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filtered.map((s) => {
                  const hasResults = s.status === "live";
                  return (
                    <tr key={s.id} onClick={() => hasResults && openResult(s.id)} className={cn("group text-base transition-colors", hasResults && "cursor-pointer hover:bg-muted/20")}>
                      <SessionCells s={s} />
                      <td className="px-4 py-3"><StatusBadge tone={STATUS_TONE[s.status]}>{SESSION_STATUS_LABEL[s.status]}</StatusBadge></td>
                      {/* The "⋯" menu the other pages' tables use. */}
                      <td className={STICKY_TD} onClick={(e) => e.stopPropagation()}>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button aria-label={`Actions for ${s.name}`} className={ROW_MENU}>
                              <MoreHorizontal className="size-4" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-44 p-1" align="end">
                            {s.status === "scheduled" ? (
                              <button onClick={() => start(s)} className={MENU_ITEM}>
                                <CircleDot className="size-3.5 text-muted-foreground" />
                                Start session
                              </button>
                            ) : (
                              <>
                                <button onClick={() => openResult(s.id)} className={MENU_ITEM}>
                                  <BarChart3 className="size-3.5 text-muted-foreground" />
                                  View results
                                </button>
                                <button onClick={() => end(s)} className={MENU_ITEM}>
                                  <CircleCheck className="size-3.5 text-muted-foreground" />
                                  End session
                                </button>
                              </>
                            )}
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
  /* A session that ran without an external device opens its dashboard in the no-device state. */
  const noDevice = useSessionsStore.getState().sessions.find((s) => s.id === sessionId)?.devices.length === 0;
  return `${TA_ANALYSIS[uc].path}?person=${encodeURIComponent(person)}&session=${sessionId}${noDevice ? "&device=none" : ""}`;
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <StatusBadge tone={STATUS_TONE[session.status]}>{SESSION_STATUS_LABEL[session.status]}</StatusBadge>
        <UseCaseChip uc={session.useCase} />
        <span>{session.date} · {session.time}</span>
        <span>{session.deployment} · {session.units.length} {u.units}</span>
        <span>{session.modelName} · {session.coach}</span>
        {session.devices.length > 0 && <span className="inline-flex items-center gap-1"><Radio className="size-3 text-info" />{session.devices.join(", ")}</span>}
      </div>

      {session.status === "live" && (
        <div className="flex items-center gap-2 rounded-lg border border-sev-critical/30 bg-sev-critical/[0.06] px-3 py-2 text-sm text-foreground">
          <span className="size-2 animate-pulse rounded-full bg-sev-critical" />
          Live · results update as each {u.item} is analysed.
        </div>
      )}

      <KpiGrid cols={4}>
        <KpiCard label={u.people[0].toUpperCase() + u.people.slice(1)} value={session.participants.length} sub={`${session.participants.filter((p) => p.attempts > 0).length} assessed`} accent="primary" />
        <KpiCard label={g.scoreLabel} value={scoreValue} sub={g.scoreSub} accent="success" />
        <KpiCard label={`${u.items[0].toUpperCase() + u.items.slice(1)} analysed`} value={`${session.analysed} of ${session.captured}`} sub={`${session.captured - session.analysed} not analysed`} accent="info" />
        <KpiCard label="Flagged for review" value={session.flagged} sub="Low-confidence findings" accent="warning" />
      </KpiGrid>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <div>
            <p className="text-md font-bold text-foreground">Individual results</p>
            <p className="text-xs text-muted-foreground">{g.noRank ? "Alphabetical · never ranked against each other" : "Ranked as recorded"}</p>
          </div>
          <span className="whitespace-nowrap text-xs text-muted-foreground">{rows.filter((p) => p.attempts > 0).length} of {rows.length} {u.people} with results</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/30">
              <tr className="border-b border-border text-left">
                {[u.person.toUpperCase(), u.unit.toUpperCase(), u.items.toUpperCase(), session.useCase === "physio" ? "PROGRESS TO GOAL" : "SCORE", "CHANGE", session.useCase === "physio" ? "MAIN COMPENSATION" : "TOP FAULT", ""].map((h) => <th key={h} className={TH}>{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {rows.map((p) => (
                <tr key={p.name} onClick={() => open(p)} className={cn("group text-base", p.attempts > 0 && "cursor-pointer hover:bg-muted/20")}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-foreground group-hover:text-primary">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.detail}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.unit}</td>
                  <td className="px-4 py-3 text-foreground">{p.attempts || "—"}</td>
                  <td className="px-4 py-3 font-semibold text-foreground">{p.score}</td>
                  <td className={cn("px-4 py-3", p.change.startsWith("+") ? "text-success" : p.change.startsWith("−") ? "text-sev-critical" : "text-muted-foreground")}>{p.change}</td>
                  <td className="px-4 py-3 text-foreground">{p.topFault}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    {p.attempts > 0 ? (
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground group-hover:text-primary">{TA_ANALYSIS[session.useCase].label}<ChevronRight className="size-4" /></span>
                    ) : (
                      <span className="text-xs text-muted-foreground">No {u.items} yet</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
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
  const shownSelected = filtered.filter((s) => selected.has(s.id)).length;
  const allShown = filtered.length > 0 && shownSelected === filtered.length;

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

  function exportSelected(format: "PDF" | "CSV") {
    const n = selected.size;
    const count = filtered.filter((s) => selected.has(s.id)).reduce((t, s) => t + reportCount(s.id), 0);
    toast.success(`Exporting ${n} session${n === 1 ? "" : "s"} as ${format}`, {
      description: format === "PDF" ? `${count} reports, one PDF each, zipped together.` : `${count} reports, one row each, with scores and findings.`,
    });
    setSelected(new Set());
  }

  return (
    <div className={cn("flex flex-col gap-4", selected.size > 0 && "pb-24")}>
      <FiltersBar
        chips={["All sessions", "All use cases", "All types"]}
        activeCount={ucs.length + types.length + (search ? 1 : 0) + (sessionFilter !== "all" ? 1 : 0)}
        search={search}
        onSearch={setSearch}
        placeholder="Search sessions, coaches or people…"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
        {hasFilters && <button onClick={() => { setSearch(""); setUcs([]); setTypes([]); onSession("all"); }} className="ml-2 underline hover:text-primary">Clear all</button>}
      </p>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-20 text-muted-foreground">
          <FileText className="size-10 opacity-20" />
          <p className="text-sm">{sessions.length === 0 ? "No completed sessions yet. Ended sessions land here with their results." : "No sessions match the current filters."}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30">
                <tr className="border-b border-border text-left">
                  <th className={cn(TH, "w-10")}>
                    <Checkbox
                      checked={allShown ? true : shownSelected > 0 ? "indeterminate" : false}
                      onCheckedChange={() => setSelected((cur) => {
                        const next = new Set(cur);
                        filtered.forEach((s) => (allShown ? next.delete(s.id) : next.add(s.id)));
                        return next;
                      })}
                      aria-label="Select every session shown"
                    />
                  </th>
                  {SESSION_HEAD.map((h) => <th key={h} className={cn(TH, h === "ACTION" && STICKY_TH)}>{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filtered.map((s) => {
                  const on = selected.has(s.id);
                  return (
                    <tr key={s.id} onClick={() => viewResults(s)}
                      className={cn("group cursor-pointer text-base transition-colors hover:bg-muted/20", on && "bg-primary/5")}>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={on} onCheckedChange={() => toggle(s.id)} aria-label={`Select ${s.name}`} />
                      </td>
                      <SessionCells s={s} />
                      <td className="px-4 py-3"><StatusBadge tone={STATUS_TONE[s.status]}>{SESSION_STATUS_LABEL[s.status]}</StatusBadge></td>
                      <td className={STICKY_TD} onClick={(e) => e.stopPropagation()}>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button aria-label={`Actions for ${s.name}`} className={ROW_MENU}>
                              <MoreHorizontal className="size-4" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-44 p-1" align="end">
                            <button onClick={() => viewResults(s)} className={MENU_ITEM}>
                              <BarChart3 className="size-3.5 text-muted-foreground" />
                              View results
                            </button>
                            <button onClick={() => exportPdf(s)} className={MENU_ITEM}>
                              <Download className="size-3.5 text-muted-foreground" />
                              Export PDF
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

      {selected.size > 0 && (
        <FloatingBar className="flex flex-wrap items-center gap-3 rounded-xl border border-primary bg-card px-4 py-3 shadow-[0_16px_48px_hsl(var(--primary)/0.25)]">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
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
    <div className="flex flex-col gap-4">
      <PageHeader>
        <PageHeader.Content>
          <PageHeader.Title>Performance & Posture</PageHeader.Title>
        </PageHeader.Content>
        <PageHeader.Actions>
          <div role="tablist" aria-label="Performance & Posture view" data-slot="button-group" className="flex h-7 items-center rounded-md border border-border bg-background p-0.5">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}
                  className={cn("inline-flex h-full items-center gap-1.5 rounded px-2.5 text-sm font-semibold transition-colors",
                    tab === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
                  <Icon className="size-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>
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
    <div className="flex flex-col gap-4">
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
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-20 text-muted-foreground">
          <BarChart3 className="size-10 opacity-20" />
          <p className="text-sm">This result isn't available. Pick one from Results.</p>
        </div>
      )}
    </div>
  );
}
