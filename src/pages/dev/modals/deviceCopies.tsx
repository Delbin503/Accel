import * as React from "react";
import { Eye, EyeOff, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@/components/shared/Modal";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { TimeSelect } from "@/components/shared/TimeSelect";
import { cn } from "@/lib/utils";
import { CAMERA_AREAS, CAMERA_SITES, MOCK_CAMERAS } from "@/mocks/cameras";
import { MOCK_NVRS } from "@/mocks/nvr";
import { MOCK_RECORDINGS } from "@/mocks/recordings";
import { useCamerasStore } from "@/stores/useCamerasStore";
import type { CameraData } from "@/types/cameras";
import type { NvrData } from "@/types/nvr";
import type { CameraFormFields } from "@/pages/site/cameras";

/**
 * Gallery-only copies of the Camera and NVR modals with their content reworked
 * to the new confirm style:
 *   - 550px, neutral title, no description, capped height that scrolls;
 *   - one short sentence instead of info boxes and long descriptions;
 *   - fields grouped under plain headings (no boxes), paired fields side by side;
 *   - radio cards become dropdowns or option chips; lists are single checklists;
 *   - no Cancel (✕ / Esc close), one footer action with no icon.
 * Small helpers the pages keep private (channel storage, next free ID) are
 * re-derived here from the same mocks. The pages still render their own.
 */

/* ── Shared building blocks ───────────────────────────────────────────── */

const NOTE = "text-sm leading-relaxed text-muted-foreground";
const HI = "font-semibold text-foreground";
const LABEL = "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground";

function DeviceFrame({ title, onClose, footerStart, action, children }: {
  title: React.ReactNode;
  onClose: () => void;
  footerStart?: React.ReactNode;
  action: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Modal open onOpenChange={(v) => !v && onClose()}>
      {/* Capped height: long forms scroll inside the body instead of filling the screen. */}
      <ModalContent size="sm" className="max-h-[70vh] w-[550px]">
        <ModalHeader title={title} description={null} />
        <ModalBody className="space-y-5">{children}</ModalBody>
        <ModalFooter align={footerStart ? "between" : "end"}>
          {footerStart ? <span className="min-w-0 truncate text-xs text-muted-foreground">{footerStart}</span> : null}
          {action}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/** A plain heading over a group of fields — replaces the boxed sections. */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground/80">{title}</p>
      {children}
    </section>
  );
}

function Field({ label, error, hint, className, children }: {
  label: string;
  error?: string;
  hint?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className={LABEL}>{label}</label>
      {children}
      {error ? (
        <p className="mt-1 text-xs text-sev-critical">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

function Pair({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>;
}

function TextField({ value, onChange, placeholder, mono, type, invalid, disabled }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
  type?: string;
  invalid?: boolean;
  disabled?: boolean;
}) {
  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      type={type}
      disabled={disabled}
      aria-invalid={invalid || undefined}
      className={cn("h-9 text-base", mono && "font-mono")}
    />
  );
}

function PasswordField({ value, onChange, invalid }: { value: string; onChange: (v: string) => void; invalid?: boolean }) {
  const [show, setShow] = React.useState(false);
  return (
    <div className="relative">
      <Input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="••••••••"
        autoComplete="new-password"
        aria-invalid={invalid || undefined}
        className="h-9 pr-9 font-mono text-base"
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

function SelectField({ value, onChange, placeholder, options, invalid, disabled }: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
  invalid?: boolean;
  disabled?: boolean;
}) {
  return (
    <Select value={value || undefined} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="h-9 w-full text-base" aria-invalid={invalid || undefined}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent position="popper" className="max-h-72">
        {options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

/** Row of same-size option chips — replaces radio cards and ad-hoc pill rows. */
function OptionChips<T extends string | number>({ value, options, onChange, multi }: {
  value: T | T[];
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  multi?: boolean;
}) {
  const isOn = (v: T) => (multi ? (value as T[]).includes(v) : value === v);
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          aria-pressed={isOn(o.value)}
          onClick={() => onChange(o.value)}
          className={cn(
            "h-8 min-w-12 rounded-md border px-3 text-sm transition-colors duration-[var(--duration-fast)] ease-standard",
            isOn(o.value)
              ? "border-primary bg-primary/10 text-primary"
              : "border-input text-muted-foreground hover:border-ring hover:text-foreground"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** One checklist row: checkbox, two lines of text, something on the right. */
function CheckRow({ checked, disabled, onToggle, title, meta, aside, label }: {
  checked: boolean;
  disabled?: boolean;
  onToggle: () => void;
  title: React.ReactNode;
  meta?: React.ReactNode;
  aside?: React.ReactNode;
  label: string;
}) {
  return (
    <li>
      <label
        className={cn(
          "flex items-start gap-3 px-3 py-2.5 transition-colors duration-[var(--duration-fast)] ease-standard",
          disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
          checked ? "bg-accent" : !disabled && "hover:bg-muted/40"
        )}
      >
        <Checkbox
          checked={checked}
          disabled={disabled}
          onCheckedChange={() => onToggle()}
          aria-label={label}
          className="mt-0.5"
        />
        <span className="min-w-0 flex-1">
          <span className={cn("block truncate text-sm font-medium", checked ? "text-primary" : "text-foreground")}>
            {title}
          </span>
          {meta ? <span className="mt-0.5 block truncate font-mono text-2xs text-muted-foreground">{meta}</span> : null}
        </span>
        {aside ? <span className="shrink-0 self-center">{aside}</span> : null}
      </label>
    </li>
  );
}

function CheckList({ head, children, empty }: { head?: React.ReactNode; children: React.ReactNode; empty?: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      {head}
      {empty ?? <ul className="max-h-56 divide-y divide-border/60 overflow-y-auto">{children}</ul>}
    </div>
  );
}

function SearchField({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-9 pl-9 text-base" />
    </div>
  );
}

/* Per-channel recordings and storage — the NVR page derives these the same way. */
function channelStats(nvrId: string, cameraId: string | null | undefined) {
  if (!cameraId) return { files: 0, gb: 0 };
  const recs = MOCK_RECORDINGS.filter((r) => r.nvrId === nvrId && r.cameraId === cameraId);
  const mb = recs.reduce((t, r) => t + r.fileSizeMb, 0);
  return { files: recs.length, gb: Math.round((mb / 1024) * 100) / 100 };
}

function linkedChannels(nvr: NvrData) {
  return nvr.channels
    .filter((ch) => ch.cameraId)
    .map((ch) => {
      const cam = MOCK_CAMERAS.find((c) => c.id === ch.cameraId);
      return {
        channel: ch.channel,
        cameraName: cam?.name ?? ch.cameraName ?? ch.cameraId ?? "—",
        where: [cam?.siteName, cam?.areaName].filter(Boolean).join(" · "),
        ...channelStats(nvr.id, ch.cameraId),
      };
    });
}

function nextId(prefix: string, pad: number, taken: string[]) {
  let n = 1;
  while (taken.includes(`${prefix}${String(n).padStart(pad, "0")}`)) n++;
  return `${prefix}${String(n).padStart(pad, "0")}`;
}

/* ── Site · Cameras — add / edit camera ───────────────────────────────── */

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const RESOLUTIONS = [
  { value: "1280x720", label: "1280×720 (HD)" },
  { value: "1920x1080", label: "1920×1080 (Full HD)" },
  { value: "2560x1440", label: "2560×1440 (2K)" },
  { value: "3840x2160", label: "3840×2160 (4K)" },
];
const FRAME_RATES = ["15", "20", "25", "30", "60"].map((v) => ({ value: v, label: `${v} fps` }));

type CameraErrors = Partial<Record<"name" | "siteId" | "areaId" | "ipAddress" | "username" | "password", string>>;

export function CameraFormCopy({ mode, initial, takenIds, onClose }: {
  mode: "add" | "edit";
  initial: CameraFormFields | null;
  takenIds: string[];
  onClose: () => void;
}) {
  const blank = (): CameraFormFields => ({
    id: nextId("Cam-", 2, takenIds), name: "", siteId: "", areaId: "", ipAddress: "", username: "", password: "",
    rtspPort: "", rtspUrl: "", resolution: "", frameRate: "", retentionDays: "", nvrId: "", channel: null,
    recordingMode: "", scheduleDays: [], scheduleStart: "", scheduleEnd: "",
  });
  const [f, setF] = React.useState<CameraFormFields>(() => initial ?? blank());
  const [linkNvr, setLinkNvr] = React.useState(!!initial?.nvrId);
  const [errors, setErrors] = React.useState<CameraErrors>({});

  function set<K extends keyof CameraFormFields>(key: K, value: CameraFormFields[K]) {
    setF((c) => ({ ...c, [key]: value }));
    if (key in errors) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  const siteNvrs = MOCK_NVRS.filter((n) => n.siteId === f.siteId);
  const nvr = MOCK_NVRS.find((n) => n.id === f.nvrId);
  const ownChannel = mode === "edit" && initial?.nvrId === nvr?.id ? initial?.channel : null;
  const freeChannels = nvr
    ? nvr.channels.filter((c) => (!c.cameraId && !c.nvrManaged) || c.channel === ownChannel).map((c) => c.channel)
    : [];
  const scheduleShown = linkNvr && !!f.nvrId;
  const scheduleValid =
    !scheduleShown || f.recordingMode === "continuous" ||
    (f.recordingMode === "scheduled" && f.scheduleDays.length > 0 && f.scheduleStart < f.scheduleEnd);
  const dirty = mode === "add" || JSON.stringify(f) !== JSON.stringify(initial);

  function pickNvr(id: string) {
    const next = MOCK_NVRS.find((n) => n.id === id);
    const free = next?.channels.filter((c) => !c.cameraId && !c.nvrManaged).map((c) => c.channel) ?? [];
    setF((c) => ({ ...c, nvrId: id, channel: free[0] ?? null }));
  }

  function submit() {
    const next: CameraErrors = {};
    if (!f.name.trim()) next.name = "Camera name is required.";
    if (!f.siteId) next.siteId = "Select a site.";
    if (!f.areaId) next.areaId = "Select an area.";
    if (!f.ipAddress.trim()) next.ipAddress = "IP address is required.";
    if (!f.username.trim()) next.username = "Username is required.";
    if (!f.password) next.password = "Password is required.";
    setErrors(next);
    if (Object.keys(next).length === 0 && scheduleValid) onClose();
  }

  const camLabel = initial ? `${initial.id} · ${initial.name}` : f.id;

  return (
    <DeviceFrame
      title={mode === "add" ? "Add Camera" : "Edit Camera"}
      onClose={onClose}
      action={
        <Button size="sm" disabled={!dirty} onClick={submit}>
          {mode === "add" ? "Add Camera" : "Save Changes"}
        </Button>
      }
    >
      <p className={NOTE}>
        {mode === "add" ? (
          <>This camera will get the ID <span className={HI}>{f.id}</span> automatically.</>
        ) : (
          <>Editing <span className={HI}>{camLabel}</span>. The camera ID can&apos;t be changed.</>
        )}
      </p>

      <Section title="Camera">
        <Field label="Camera Name" error={errors.name}>
          <TextField value={f.name} onChange={(v) => set("name", v)} placeholder="e.g. Loading Bay 3 — Dock" invalid={!!errors.name} />
        </Field>
        <Pair>
          <Field label="Site" error={errors.siteId}>
            <SelectField
              value={f.siteId}
              onChange={(v) => { set("siteId", v); setF((c) => ({ ...c, nvrId: "", channel: null })); }}
              placeholder="Select a site"
              options={CAMERA_SITES}
              invalid={!!errors.siteId}
            />
          </Field>
          <Field label="Area" error={errors.areaId}>
            <SelectField value={f.areaId} onChange={(v) => set("areaId", v)} placeholder="Select an area" options={CAMERA_AREAS} invalid={!!errors.areaId} />
          </Field>
        </Pair>
      </Section>

      <Section title="Connection">
        <Pair>
          <Field label="IP Address" error={errors.ipAddress}>
            <TextField value={f.ipAddress} onChange={(v) => set("ipAddress", v)} placeholder="10.10.0.101" mono invalid={!!errors.ipAddress} />
          </Field>
          <Field label="RTSP Port">
            <TextField value={f.rtspPort} onChange={(v) => set("rtspPort", v)} placeholder="554" type="number" mono />
          </Field>
        </Pair>
        <Pair>
          <Field label="Username" error={errors.username}>
            <TextField value={f.username} onChange={(v) => set("username", v)} placeholder="admin" mono invalid={!!errors.username} />
          </Field>
          <Field label="Password" error={errors.password}>
            <PasswordField value={f.password} onChange={(v) => set("password", v)} invalid={!!errors.password} />
          </Field>
        </Pair>
        <Field label="RTSP URL (Optional)" hint="Leave blank to build it from the IP and port.">
          <TextField
            value={f.rtspUrl}
            onChange={(v) => set("rtspUrl", v)}
            placeholder={`rtsp://${f.ipAddress || "10.10.0.x"}:${f.rtspPort || "554"}/Streaming/Channels/101`}
            mono
          />
        </Field>
      </Section>

      <Section title="Video">
        <Pair>
          <Field label="Resolution">
            <SelectField value={f.resolution} onChange={(v) => set("resolution", v)} placeholder="Select resolution" options={RESOLUTIONS} />
          </Field>
          <Field label="Frame Rate">
            <SelectField value={f.frameRate} onChange={(v) => set("frameRate", v)} placeholder="Select frame rate" options={FRAME_RATES} />
          </Field>
        </Pair>
      </Section>

      <Section title="Recording">
        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-foreground">
          <Checkbox
            checked={linkNvr}
            onCheckedChange={(v) => {
              setLinkNvr(v === true);
              if (v !== true) setF((c) => ({ ...c, nvrId: "", channel: null }));
            }}
          />
          Link this camera to an NVR
        </label>
        {linkNvr && (
          <Pair>
            <Field
              label="NVR"
              hint={!f.siteId ? "Pick a site first." : siteNvrs.length === 0 ? "No NVRs at this site." : undefined}
            >
              <SelectField
                value={f.nvrId}
                onChange={pickNvr}
                placeholder={!f.siteId ? "Select a site first" : siteNvrs.length === 0 ? "No NVR at this site" : "Select an NVR"}
                options={siteNvrs.map((n) => ({ value: n.id, label: n.name }))}
                disabled={!f.siteId || siteNvrs.length === 0}
              />
            </Field>
            <Field
              label="Channel"
              hint={nvr ? (freeChannels.length === 0 ? "All channels in use." : `${freeChannels.length} of ${nvr.channelCount} free.`) : undefined}
            >
              <SelectField
                value={f.channel != null ? String(f.channel) : ""}
                onChange={(v) => set("channel", Number(v))}
                placeholder={nvr ? "Select a channel" : "Pick an NVR first"}
                options={freeChannels.map((c) => ({ value: String(c), label: `Channel ${c}` }))}
                disabled={!nvr || freeChannels.length === 0}
              />
            </Field>
          </Pair>
        )}
        {scheduleShown && (
          <>
            <Pair>
              <Field label="Retention (Days)" hint={nvr ? `NVR default: ${nvr.retentionDays} days.` : undefined}>
                <TextField value={f.retentionDays} onChange={(v) => set("retentionDays", v)} placeholder={String(nvr?.retentionDays ?? 30)} type="number" />
              </Field>
              <Field label="Mode">
                <SelectField
                  value={f.recordingMode}
                  onChange={(v) => set("recordingMode", v as CameraFormFields["recordingMode"])}
                  placeholder="Select mode"
                  options={[{ value: "continuous", label: "Continuous · 24/7" }, { value: "scheduled", label: "Scheduled" }]}
                />
              </Field>
            </Pair>
            {f.recordingMode === "scheduled" && (
              <>
                <Field label="Days" error={f.scheduleDays.length === 0 ? "Pick at least one day." : undefined}>
                  <OptionChips
                    multi
                    value={f.scheduleDays}
                    options={DAY_LABELS.map((d, i) => ({ value: i, label: d }))}
                    onChange={(d) =>
                      set("scheduleDays", f.scheduleDays.includes(d) ? f.scheduleDays.filter((x) => x !== d) : [...f.scheduleDays, d].sort((a, b) => a - b))
                    }
                  />
                </Field>
                <Pair>
                  <Field label="Start" error={f.scheduleStart && f.scheduleEnd && f.scheduleStart >= f.scheduleEnd ? "Must be before the end." : undefined}>
                    <TimeSelect value={f.scheduleStart} onChange={(v) => set("scheduleStart", v)} aria-label="Recording start time" />
                  </Field>
                  <Field label="End">
                    <TimeSelect value={f.scheduleEnd} onChange={(v) => set("scheduleEnd", v)} aria-label="Recording end time" />
                  </Field>
                </Pair>
              </>
            )}
          </>
        )}
      </Section>
    </DeviceFrame>
  );
}

/* ── Site · Cameras — link a camera to an NVR channel ─────────────────── */

export function LinkNvrChannelCopy({ camera, onClose }: { camera: CameraData; onClose: () => void }) {
  const [query, setQuery] = React.useState("");
  const [picked, setPicked] = React.useState<string | null>(null);
  const siteNvrs = MOCK_NVRS.filter((n) => n.siteId === camera.siteId);
  const rows = siteNvrs.flatMap((n) =>
    n.channels.map((ch) => ({
      key: `${n.id}-${ch.channel}`,
      nvrName: n.name,
      channel: ch.channel,
      meta: `${n.model} · ${n.ipAddress}`,
      usedBy: ch.cameraId ?? (ch.nvrManaged ? "NVR" : null),
    }))
  );
  const q = query.trim().toLowerCase();
  const shown = q ? rows.filter((r) => `${r.nvrName} ${r.meta} ch${r.channel} ${r.usedBy ?? ""}`.toLowerCase().includes(q)) : rows;

  return (
    <DeviceFrame
      title="Link NVR Channel"
      onClose={onClose}
      action={<Button size="sm" disabled={!picked} onClick={onClose}>Link Channel</Button>}
    >
      <p className={NOTE}>
        Pick a free channel for <span className={HI}>{camera.id} · {camera.name}</span>. Only NVRs at the same site are
        listed.
      </p>
      <SearchField value={query} onChange={setQuery} placeholder="Search by NVR, model, IP or channel…" />
      <CheckList
        empty={
          siteNvrs.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No NVRs at this site yet.</p>
          ) : shown.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No channels match &ldquo;{query}&rdquo;.</p>
          ) : undefined
        }
      >
        {shown.map((r) => (
          <CheckRow
            key={r.key}
            checked={picked === r.key}
            disabled={!!r.usedBy}
            onToggle={() => setPicked(picked === r.key ? null : r.key)}
            label={`${r.nvrName} channel ${r.channel}`}
            title={<>{r.nvrName} <span className="font-mono text-muted-foreground">· Ch {String(r.channel).padStart(2, "0")}</span></>}
            // The badge uppercases its text, so the camera ID goes in the meta line, not the badge.
            meta={r.usedBy && r.usedBy !== "NVR" ? `${r.meta} · used by ${r.usedBy}` : r.meta}
            aside={
              r.usedBy ? (
                <StatusBadge tone="neutral" dot={false}>In use</StatusBadge>
              ) : (
                <StatusBadge tone="success">Available</StatusBadge>
              )
            }
          />
        ))}
      </CheckList>
    </DeviceFrame>
  );
}

/* ── Site · NVR — add / edit NVR ──────────────────────────────────────── */

const NVR_MODELS = [
  { value: "Hikvision DS-9664NI-I8", label: "Hikvision DS-9664NI-I8 (64-ch)" },
  { value: "Hikvision DS-7716NI-I4", label: "Hikvision DS-7716NI-I4 (16-ch)" },
  { value: "Dahua NVR5864-4KS2", label: "Dahua NVR5864-4KS2 (64-ch)" },
  { value: "Dahua NVR4232-4KS2", label: "Dahua NVR4232-4KS2 (32-ch)" },
  { value: "Uniview NVR308-32E2", label: "Uniview NVR308-32E2 (32-ch)" },
];
const AGE_PRESETS = [7, 14, 30, 60, 90];

interface NvrFields {
  name: string; model: string; channelCount: string; siteId: string; areaId: string;
  ipAddress: string; httpPort: string; username: string; password: string;
  totalStorageGb: string; retentionDays: string;
  cleanupSchedule: "" | "auto-age" | "auto-channel"; cleanupAgeDays: string; cleanupChannels: number[];
}

function NvrForm({ mode, nvr, takenIds, onClose }: {
  mode: "add" | "edit";
  nvr?: NvrData;
  takenIds: string[];
  onClose: () => void;
}) {
  const start: NvrFields = nvr
    ? {
        name: nvr.name, model: nvr.model, channelCount: String(nvr.channelCount), siteId: nvr.siteId, areaId: nvr.areaId,
        ipAddress: nvr.ipAddress, httpPort: String(nvr.httpPort), username: nvr.username, password: nvr.password,
        totalStorageGb: String(nvr.totalStorageGb), retentionDays: String(nvr.retentionDays),
        cleanupSchedule: nvr.cleanupSchedule === "manual" ? "" : nvr.cleanupSchedule,
        cleanupAgeDays: nvr.cleanupSchedule === "auto-age" ? String(nvr.retentionDays) : "", cleanupChannels: [],
      }
    : {
        name: "", model: "", channelCount: "", siteId: "", areaId: "", ipAddress: "", httpPort: "", username: "", password: "",
        totalStorageGb: "", retentionDays: "", cleanupSchedule: "", cleanupAgeDays: "", cleanupChannels: [],
      };
  const [f, setF] = React.useState<NvrFields>(start);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const id = nvr?.id ?? nextId("NVR-", 3, takenIds);

  function set<K extends keyof NvrFields>(key: K, value: NvrFields[K]) {
    setF((c) => ({ ...c, [key]: value }));
    if (errors[key as string]) setErrors((e) => { const n = { ...e }; delete n[key as string]; return n; });
  }

  const dirty = mode === "add" || JSON.stringify(f) !== JSON.stringify(start);
  const channelCount = Number(f.channelCount) || 0;

  function submit() {
    const next: Record<string, string> = {};
    if (!f.name.trim()) next.name = "NVR name is required.";
    if (mode === "add" && !f.model) next.model = "Select a model.";
    if (mode === "add" && !(channelCount > 0)) next.channelCount = "Select a channel count.";
    if (!f.siteId) next.siteId = "Select a site.";
    if (!f.areaId) next.areaId = "Select an area.";
    if (!f.ipAddress.trim()) next.ipAddress = "IP address is required.";
    if (mode === "edit" && !f.username.trim()) next.username = "Username is required.";
    if (mode === "edit" && !f.password) next.password = "Password is required.";
    if (!(Number(f.totalStorageGb) > 0)) next.totalStorageGb = "Total storage is required.";
    if (!f.cleanupSchedule) next.cleanupSchedule = "Select a cleanup mode.";
    if (f.cleanupSchedule === "auto-age" && !f.cleanupAgeDays) next.cleanupAgeDays = "Pick an age.";
    if (f.cleanupSchedule === "auto-channel" && f.cleanupChannels.length === 0) next.cleanupChannels = "Pick at least one channel.";
    setErrors(next);
    if (Object.keys(next).length === 0) onClose();
  }

  return (
    <DeviceFrame
      title={mode === "add" ? "Add NVR" : "Edit NVR"}
      onClose={onClose}
      action={<Button size="sm" disabled={!dirty} onClick={submit}>{mode === "add" ? "Add NVR" : "Save Changes"}</Button>}
    >
      <p className={NOTE}>
        {mode === "add" ? (
          <>
            This NVR will get the ID <span className={HI}>{id}</span>. All its channels start free; link cameras after it&apos;s
            added.
          </>
        ) : nvr ? (
          <>
            Editing <span className={HI}>{nvr.id} · {nvr.name}</span> ({nvr.model}, {nvr.channelsInUse} of{" "}
            {nvr.channelCount} channels in use). Model and channel count can&apos;t be changed.
          </>
        ) : null}
      </p>

      <Section title="NVR">
        <Field label="NVR Name" error={errors.name}>
          <TextField value={f.name} onChange={(v) => set("name", v)} placeholder="e.g. FedEx Changi · NVR-A" invalid={!!errors.name} />
        </Field>
        {mode === "add" && (
          <Pair>
            <Field label="Model" error={errors.model}>
              <SelectField value={f.model} onChange={(v) => set("model", v)} placeholder="Select a model" options={NVR_MODELS} invalid={!!errors.model} />
            </Field>
            <Field label="Channels" error={errors.channelCount}>
              <SelectField
                value={f.channelCount}
                onChange={(v) => set("channelCount", v)}
                placeholder="Select channels"
                options={[4, 8, 16, 32, 64].map((c) => ({ value: String(c), label: `${c} channels` }))}
                invalid={!!errors.channelCount}
              />
            </Field>
          </Pair>
        )}
        <Pair>
          <Field label="Site" error={errors.siteId}>
            <SelectField value={f.siteId} onChange={(v) => set("siteId", v)} placeholder="Select a site" options={CAMERA_SITES} invalid={!!errors.siteId} />
          </Field>
          <Field label="Area" error={errors.areaId}>
            <SelectField value={f.areaId} onChange={(v) => set("areaId", v)} placeholder="Select an area" options={CAMERA_AREAS} invalid={!!errors.areaId} />
          </Field>
        </Pair>
      </Section>

      <Section title="Connection">
        <Pair>
          <Field label="IP Address" error={errors.ipAddress}>
            <TextField value={f.ipAddress} onChange={(v) => set("ipAddress", v)} placeholder="10.10.0.10" mono invalid={!!errors.ipAddress} />
          </Field>
          <Field label="HTTP Port (Optional)">
            <TextField value={f.httpPort} onChange={(v) => set("httpPort", v)} placeholder="80" type="number" mono />
          </Field>
        </Pair>
        <Pair>
          <Field label="Username" error={errors.username}>
            <TextField value={f.username} onChange={(v) => set("username", v)} placeholder="admin" mono invalid={!!errors.username} />
          </Field>
          <Field label="Password" error={errors.password}>
            <PasswordField value={f.password} onChange={(v) => set("password", v)} invalid={!!errors.password} />
          </Field>
        </Pair>
      </Section>

      <Section title="Storage">
        <Pair>
          <Field label="Total Storage (GB)" error={errors.totalStorageGb}>
            <TextField value={f.totalStorageGb} onChange={(v) => set("totalStorageGb", v)} placeholder="8000" type="number" invalid={!!errors.totalStorageGb} />
          </Field>
          <Field label="Retention (Days, Optional)">
            <TextField value={f.retentionDays} onChange={(v) => set("retentionDays", v)} placeholder="30" type="number" />
          </Field>
        </Pair>
        <Field label="Cleanup Mode" error={errors.cleanupSchedule}>
          <SelectField
            value={f.cleanupSchedule}
            onChange={(v) => set("cleanupSchedule", v as NvrFields["cleanupSchedule"])}
            placeholder="Select cleanup mode"
            options={[{ value: "auto-age", label: "Automatic · by age" }, { value: "auto-channel", label: "Automatic · by channel" }]}
            invalid={!!errors.cleanupSchedule}
          />
        </Field>
        {f.cleanupSchedule === "auto-age" && (
          <Field label="Remove recordings older than" error={errors.cleanupAgeDays}>
            <OptionChips
              value={Number(f.cleanupAgeDays)}
              options={AGE_PRESETS.map((d) => ({ value: d, label: `${d} days` }))}
              onChange={(d) => set("cleanupAgeDays", String(d))}
            />
          </Field>
        )}
        {f.cleanupSchedule === "auto-channel" && (
          <Field
            label="Channels to clean up"
            error={errors.cleanupChannels}
            hint={channelCount === 0 ? "Pick a channel count first." : undefined}
          >
            <OptionChips
              multi
              value={f.cleanupChannels}
              options={Array.from({ length: channelCount }, (_, i) => ({ value: i + 1, label: String(i + 1) }))}
              onChange={(c) =>
                set("cleanupChannels", f.cleanupChannels.includes(c) ? f.cleanupChannels.filter((x) => x !== c) : [...f.cleanupChannels, c])
              }
            />
          </Field>
        )}
      </Section>
    </DeviceFrame>
  );
}

export function AddNvrCopy({ takenIds, onClose }: { takenIds: string[]; onClose: () => void }) {
  return <NvrForm mode="add" takenIds={takenIds} onClose={onClose} />;
}

export function EditNvrCopy({ nvr, onClose }: { nvr: NvrData; onClose: () => void }) {
  return <NvrForm mode="edit" nvr={nvr} takenIds={[]} onClose={onClose} />;
}

/* ── Site · NVR — export recordings ───────────────────────────────────── */

const EXPORT_RANGES = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "all", label: "All Time" },
];
const EXPORT_FORMATS = [
  { value: "zip", label: "ZIP archive", desc: "All recordings packed in one .zip" },
  { value: "mp4-pack", label: "MP4 pack", desc: "Individual .mp4 files in a folder" },
  { value: "manifest-only", label: "Manifest only", desc: "A JSON listing — no video files" },
];

export function ExportRecordingsCopy({ nvr, onClose }: { nvr: NvrData; onClose: () => void }) {
  const rows = linkedChannels(nvr);
  const [picked, setPicked] = React.useState<number[]>(() => rows.map((r) => r.channel));
  const [range, setRange] = React.useState("all");
  const [format, setFormat] = React.useState("zip");
  const chosen = rows.filter((r) => picked.includes(r.channel));
  const gb = chosen.reduce((t, r) => t + r.gb, 0);
  const files = chosen.reduce((t, r) => t + r.files, 0);
  const all = rows.length > 0 && chosen.length === rows.length;

  return (
    <DeviceFrame
      title="Export Recordings"
      onClose={onClose}
      footerStart={
        chosen.length > 0
          ? `${chosen.length} channel${chosen.length === 1 ? "" : "s"} · ${files} files · ${gb.toFixed(2)} GB`
          : "No channels selected"
      }
      action={<Button size="sm" disabled={chosen.length === 0} onClick={onClose}>Export</Button>}
    >
      <p className={NOTE}>
        Download recordings from <span className={HI}>{nvr.name}</span>.
      </p>
      <Field label="Channels">
        <CheckList
          head={
            rows.length > 1 ? (
              <label className="flex cursor-pointer items-center gap-3 border-b border-border px-3 py-2.5">
                <Checkbox checked={all} onCheckedChange={() => setPicked(all ? [] : rows.map((r) => r.channel))} aria-label="Select all channels" />
                <span className="text-sm font-medium text-foreground">Select all</span>
                <span className="ml-auto text-xs text-muted-foreground">{chosen.length} of {rows.length}</span>
              </label>
            ) : undefined
          }
          empty={rows.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">No channels with recordings.</p> : undefined}
        >
          {rows.map((r) => (
            <CheckRow
              key={r.channel}
              checked={picked.includes(r.channel)}
              onToggle={() => setPicked((p) => (p.includes(r.channel) ? p.filter((c) => c !== r.channel) : [...p, r.channel]))}
              label={`Export channel ${r.channel}`}
              title={<>{r.cameraName} <span className="font-mono text-muted-foreground">· Ch {r.channel}</span></>}
              meta={r.where}
              aside={<span className="font-mono text-2xs text-muted-foreground">{r.gb.toFixed(2)} GB · {r.files} files</span>}
            />
          ))}
        </CheckList>
      </Field>
      <Field label="Date Range">
        <OptionChips value={range} options={EXPORT_RANGES} onChange={setRange} />
      </Field>
      <Field label="Format" hint={EXPORT_FORMATS.find((x) => x.value === format)?.desc}>
        <SelectField value={format} onChange={setFormat} placeholder="Select format" options={EXPORT_FORMATS} />
      </Field>
    </DeviceFrame>
  );
}

/* ── Site · NVR — clean up storage ────────────────────────────────────── */

export function CleanupStorageCopy({ nvr, onClose }: { nvr: NvrData; onClose: () => void }) {
  const [method, setMethod] = React.useState<"age" | "channel">("age");
  const [ageDays, setAgeDays] = React.useState(30);
  const [picked, setPicked] = React.useState<number[]>([]);
  const rows = linkedChannels(nvr);
  const pct = Math.min(100, Math.round((nvr.usedStorageGb / nvr.totalStorageGb) * 100));
  const canSubmit = method === "age" ? ageDays > 0 : picked.length > 0;

  return (
    <DeviceFrame
      title="Clean up Storage"
      onClose={onClose}
      action={<Button variant="destructive" size="sm" disabled={!canSubmit} onClick={onClose}>Clean Up</Button>}
    >
      <div className="space-y-2">
        <p className={NOTE}>
          <span className={HI}>{nvr.name}</span> is using{" "}
          <span className={HI}>{nvr.usedStorageGb.toLocaleString()} GB</span> of {nvr.totalStorageGb.toLocaleString()} GB ({pct}%).
        </p>
        <Progress value={pct} aria-label="Storage used" className="h-1.5 bg-muted" />
      </div>
      <Field label="Clean up by">
        <OptionChips
          value={method}
          options={[{ value: "age" as const, label: "Age" }, { value: "channel" as const, label: "Channel" }]}
          onChange={setMethod}
        />
      </Field>
      {method === "age" ? (
        <Field label="Remove recordings older than">
          <OptionChips value={ageDays} options={AGE_PRESETS.map((d) => ({ value: d, label: `${d} days` }))} onChange={setAgeDays} />
        </Field>
      ) : (
        <Field label="Channels to clean up">
          <CheckList empty={rows.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">No channels with recordings.</p> : undefined}>
            {rows.map((r) => (
              <CheckRow
                key={r.channel}
                checked={picked.includes(r.channel)}
                onToggle={() => setPicked((p) => (p.includes(r.channel) ? p.filter((c) => c !== r.channel) : [...p, r.channel]))}
                label={`Clean up channel ${r.channel}`}
                title={<>{r.cameraName} <span className="font-mono text-muted-foreground">· Ch {r.channel}</span></>}
                meta={r.where}
                aside={<span className="font-mono text-2xs text-muted-foreground">{r.gb.toFixed(2)} GB · {r.files} files</span>}
              />
            ))}
          </CheckList>
        </Field>
      )}
    </DeviceFrame>
  );
}

/* ── Site · NVR — clean up finished ───────────────────────────────────── */

export function CleanupCompletedCopy({ previous, freed, current, total, processed, onClose }: {
  previous: number;
  freed: number;
  current: number;
  total: number;
  processed: { processed: number; outOf: number };
  onClose: () => void;
}) {
  const pct = total === 0 ? 0 : Math.round((current / total) * 100);
  return (
    <DeviceFrame title="Clean up complete" onClose={onClose} action={<Button size="sm" onClick={onClose}>Done</Button>}>
      <p className={NOTE}>
        Freed <span className={HI}>{freed.toLocaleString()} GB</span> from {processed.processed} of {processed.outOf} files.
      </p>
      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-3 text-xs">
          <span className="text-muted-foreground">
            {current.toLocaleString()} GB of {total.toLocaleString()} GB used
          </span>
          <span className="font-mono font-semibold tabular-nums text-foreground">{pct}%</span>
        </div>
        <Progress value={pct} aria-label="Storage used" className="h-1.5 bg-muted" />
        <p className="font-mono text-2xs text-muted-foreground">
          {previous.toLocaleString()} GB → {current.toLocaleString()} GB <span className="text-success">(−{freed.toLocaleString()} GB)</span>
        </p>
      </div>
    </DeviceFrame>
  );
}

/* ── Site · NVR — link a camera to a channel ──────────────────────────── */

export function LinkCameraCopy({ nvr, channel, onClose }: { nvr: NvrData; channel: number; onClose: () => void }) {
  const cameras = useCamerasStore((s) => s.cameras);
  const [picked, setPicked] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");
  const [area, setArea] = React.useState("all");
  const candidates = cameras.filter((c) => c.siteId === nvr.siteId && !c.nvrId);
  const areas = Array.from(new Map(candidates.map((c) => [c.areaId, c.areaName])).entries());
  const q = query.trim().toLowerCase();
  const shown = candidates.filter(
    (c) => (area === "all" || c.areaId === area) && (!q || `${c.id} ${c.name} ${c.areaName}`.toLowerCase().includes(q))
  );
  const tone = (s: CameraData["status"]) => (s === "online" ? "success" : s === "offline" ? "neutral" : "warning");

  return (
    <DeviceFrame
      title={`Link Camera to Channel ${channel}`}
      onClose={onClose}
      action={<Button size="sm" disabled={!picked} onClick={onClose}>Link Camera</Button>}
    >
      <p className={NOTE}>
        Pick a camera for <span className={HI}>channel {channel}</span> on <span className={HI}>{nvr.name}</span>. Only
        unlinked cameras at {nvr.siteName} are listed.
      </p>
      {candidates.length > 0 && (
        <div className={cn("grid gap-2", areas.length > 1 ? "grid-cols-[1fr_11rem]" : "grid-cols-1")}>
          <SearchField value={query} onChange={setQuery} placeholder="Search by camera name, ID or area…" />
          {areas.length > 1 && (
            <SelectField
              value={area}
              onChange={setArea}
              placeholder="All areas"
              options={[{ value: "all", label: `All areas (${candidates.length})` }, ...areas.map(([id, name]) => ({ value: id, label: name }))]}
            />
          )}
        </div>
      )}
      <CheckList
        empty={
          candidates.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              No unlinked cameras at {nvr.siteName}. Add one first, or unlink a camera to free it.
            </p>
          ) : shown.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No cameras match the filters.</p>
          ) : undefined
        }
      >
        {shown.map((c) => (
          <CheckRow
            key={c.id}
            checked={picked === c.id}
            onToggle={() => setPicked(picked === c.id ? null : c.id)}
            label={`Link ${c.id}`}
            title={c.name}
            meta={`${c.id} · ${c.areaName}`}
            aside={<StatusBadge tone={tone(c.status)}>{c.status}</StatusBadge>}
          />
        ))}
      </CheckList>
    </DeviceFrame>
  );
}
