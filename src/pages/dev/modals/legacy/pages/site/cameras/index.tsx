/**
 * Frozen copy of src/pages/site/cameras/index.tsx as last committed, before the 2026 modal redesign —
 * only the modals the Modal Gallery's "Old" side shows, and what they need.
 * Generated; do not edit. The live components are in src/pages/site/cameras/index.tsx.
 */
import * as React from "react";
import { Search, Check, Plus, AlertTriangle, HardDrive, Clock, Link2, Eye, EyeOff } from "lucide-react";
import { Modal, ModalContent, ModalHeader, ModalSubheader, ModalBody, ModalFooter } from "@/components/shared/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { TimeSelect } from "@/components/shared/TimeSelect";
import { cn } from "@/lib/utils";
import { CAMERA_SITES, CAMERA_AREAS } from "@/mocks/cameras";
import { MOCK_NVRS } from "@/mocks/nvr";
import type { CameraData } from "@/types/cameras";
import { TruncatedText } from "@/components/shared/TruncatedText";

/* ── Link NVR modal — pick an NVR + free channel at the camera's site ── */

export function LinkNvrModal({
  open, camera, onClose, onLink,
}: {
  open: boolean;
  camera: CameraData | null;
  onClose: () => void;
  onLink: (cameraId: string, nvrId: string, nvrName: string, channel: number) => void;
}) {
  const [search, setSearch] = React.useState("");
  const [selection, setSelection] = React.useState<{ nvrId: string; channel: number } | null>(null);

  React.useEffect(() => {
    if (open) { setSearch(""); setSelection(null); }
  }, [open]);

  if (!camera) return null;

  const siteNvrs = MOCK_NVRS.filter((n) => n.siteId === camera.siteId);

  // Build the candidate channel rows — only free channels are linkable.
  const rows = siteNvrs.flatMap((n) =>
    n.channels.map((ch) => ({
      nvrId: n.id,
      nvrName: n.name,
      nvrModel: n.model,
      nvrIp: n.ipAddress,
      channel: ch.channel,
      cameraId: ch.cameraId,
      nvrManaged: !!ch.nvrManaged,
    }))
  );
  const q = search.trim().toLowerCase();
  const filtered = q
    ? rows.filter((r) =>
        `${r.nvrId} ${r.nvrName} ${r.nvrModel} ${r.nvrIp} ch${r.channel} ${r.cameraId ?? ""}`.toLowerCase().includes(q)
      )
    : rows;

  function commit() {
    if (!selection || !camera) return;
    const row = rows.find((r) => r.nvrId === selection.nvrId && r.channel === selection.channel);
    if (!row) return;
    onLink(camera.id, row.nvrId, row.nvrName, row.channel);
    onClose();
  }

  return (
    <Modal open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent size="lg">
        <ModalHeader
          title="Link NVR Channel"
          description={<>Choose a channel for <span className="font-mono text-foreground">{camera.id}</span> · {camera.name}</>}
        />
        <ModalSubheader>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by NVR name, model, IP or channel…" className="h-9 pl-9 text-base" />
          </div>
        </ModalSubheader>
        <ModalBody>
          {siteNvrs.length === 0 ? (
            <p className="py-8 text-center text-sm italic text-muted-foreground">
              No NVRs registered for this site yet.
            </p>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm italic text-muted-foreground">No channels match "{search}".</p>
          ) : (
            <ul className="space-y-1">
              {filtered.map((r) => {
                const inUse = !!r.cameraId || r.nvrManaged;
                const selected = selection?.nvrId === r.nvrId && selection?.channel === r.channel;
                return (
                  <li key={`${r.nvrId}-${r.channel}`}>
                    <button
                      disabled={inUse}
                      onClick={() => setSelection({ nvrId: r.nvrId, channel: r.channel })}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
                        inUse ? "cursor-not-allowed border-border bg-muted/30 opacity-60"
                        : selected ? "border-primary bg-primary/10"
                        : "border-border bg-card hover:border-primary/40 hover:bg-muted/30"
                      )}
                    >
                      <div className="flex size-7 flex-shrink-0 items-center justify-center rounded-md bg-info/10 text-info">
                        <HardDrive className="size-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                          <TruncatedText text={r.nvrName} />
                          <span className="font-mono text-2xs text-muted-foreground">Ch {String(r.channel).padStart(2, "0")}</span>
                        </p>
                        <TruncatedText text={`${r.nvrModel} · ${r.nvrIp}`} className="mt-0.5 text-2xs text-muted-foreground" />
                      </div>
                      {inUse ? (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-2xs font-semibold text-muted-foreground">{r.cameraId ? `In use · ${r.cameraId}` : "In use on NVR"}</span>
                      ) : (
                        <span className="rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-2xs font-semibold text-success">Available</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={commit} disabled={!selection} className="gap-1.5">
            <Link2 className="size-3.5" />
            Link Channel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/* ── Camera form modal (Add + Edit) ──────────────────────────────────────── */

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
 // Mon–Fri

type RecordingMode = "continuous" | "scheduled";

export interface CameraFormFields {
  id: string;
  name: string;
  siteId: string;
  areaId: string;
  ipAddress: string;
  /** Credentials the camera stream is authenticated with. */
  username: string;
  password: string;
  /** String-typed in the form so empty inputs render as placeholders; parsed on submit. */
  rtspPort: string;
  rtspUrl: string;          // full RTSP URL the user provides (or auto-built from IP:port)
  resolution: string;
  /** String-typed in the form so empty inputs render as placeholders; parsed on submit. */
  frameRate: string;
  /** String-typed in the form so empty inputs render as placeholders; parsed on submit. */
  retentionDays: string;
  nvrId: string;
  channel: number | null;
  /** "" while the user hasn't picked yet — surfaces a "Select mode" placeholder option. */
  recordingMode: RecordingMode | "";
  scheduleDays: number[];
  scheduleStart: string;
  scheduleEnd: string;
}

function nextCameraId(takenIds: string[]): string {
  let n = 1;
  while (takenIds.includes(`Cam-${String(n).padStart(2, "0")}`)) n++;
  return `Cam-${String(n).padStart(2, "0")}`;
}

function emptyForm(takenIds: string[]): CameraFormFields {
  return {
    id: nextCameraId(takenIds),
    name: "",
    siteId: "",
    areaId: "",
    ipAddress: "",
    username: "",
    password: "",
    rtspPort: "",
    resolution: "",
    frameRate: "",
    retentionDays: "",
    nvrId: "",
    channel: null,
    rtspUrl: "",
    recordingMode: "",
    scheduleDays: [],
    scheduleStart: "",
    scheduleEnd: "",
  };
}

function FormField({ label, children, span = 1, hint, error }: { label: string; children: React.ReactNode; span?: 1 | 2; hint?: string; error?: string }) {
  return (
    <div className={cn(span === 2 && "col-span-2")}>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-sev-critical">{error}</p>}
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function TextInput({ value, onChange, mono, placeholder, type = "text", disabled, invalid }: { value: string | number; onChange: (v: string) => void; mono?: boolean; placeholder?: string; type?: "text" | "number"; disabled?: boolean; invalid?: boolean }) {
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      aria-invalid={invalid || undefined}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "h-9 w-full rounded-md border border-input bg-background px-3 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none",
        mono && "font-mono",
        disabled && "cursor-not-allowed opacity-60",
        invalid && "border-sev-critical"
      )}
    />
  );
}

// shadcn Select cannot use value="". Map "" to a sentinel internally so the
// external API (value/onChange/options accepting "" entries) stays unchanged.
const FORM_SELECT_EMPTY = "__empty__";

function FormSelect({ value, onChange, options, disabled, invalid }: { value: string; onChange: (v: string) => void; options: readonly { value: string; label: string }[]; disabled?: boolean; invalid?: boolean }) {
  const placeholder = options.find((o) => o.value === "")?.label;
  return (
    <Select
      value={value === "" ? FORM_SELECT_EMPTY : value}
      onValueChange={(v) => onChange(v === FORM_SELECT_EMPTY ? "" : v)}
      disabled={disabled}
    >
      <SelectTrigger className={cn("h-9 w-full text-base", invalid && "border-sev-critical")} aria-invalid={invalid || undefined}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value === "" ? FORM_SELECT_EMPTY : o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function CameraFormModal({
  open,
  mode,
  initial,
  takenIds,
  onClose,
  onSubmit,
}: {
  open: boolean;
  mode: "add" | "edit";
  initial: CameraFormFields | null;
  takenIds: string[];
  onClose: () => void;
  onSubmit: (fields: CameraFormFields) => void;
}) {
  const [fields, setFields] = React.useState<CameraFormFields>(() => emptyForm(takenIds));
  const [errors, setErrors] = React.useState<{ name?: string; ipAddress?: string; siteId?: string; areaId?: string; username?: string; password?: string }>({});
  const [showPassword, setShowPassword] = React.useState(false);
  const [linkNvr, setLinkNvr] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      const next = initial ?? emptyForm(takenIds);
      setFields(next);
      setErrors({});
      setShowPassword(false);
      setLinkNvr(!!next.nvrId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial]);

  function toggleLinkNvr(checked: boolean) {
    setLinkNvr(checked);
    if (!checked) setFields((curr) => ({ ...curr, nvrId: "", channel: null }));
  }

  function set<K extends keyof CameraFormFields>(key: K, value: CameraFormFields[K]) {
    setFields((curr) => ({ ...curr, [key]: value }));
    if (key in errors) setErrors((curr) => ({ ...curr, [key]: undefined }));
  }
  function toggleDay(day: number) {
    setFields((curr) => ({
      ...curr,
      scheduleDays: curr.scheduleDays.includes(day)
        ? curr.scheduleDays.filter((d) => d !== day)
        : [...curr.scheduleDays, day].sort((a, b) => a - b),
    }));
  }

  // NVRs available for the current site
  const siteNvrs = MOCK_NVRS.filter((n) => n.siteId === fields.siteId);
  const selectedNvr = MOCK_NVRS.find((n) => n.id === fields.nvrId);

  // Available channels for the selected NVR (free channels OR the channel this camera currently occupies)
  const availableChannels = React.useMemo(() => {
    if (!selectedNvr) return [] as number[];
    const ownChannel = mode === "edit" && initial?.nvrId === selectedNvr.id ? initial.channel : null;
    return selectedNvr.channels
      .filter((c) => (!c.cameraId && !c.nvrManaged) || c.channel === ownChannel)
      .map((c) => c.channel);
  }, [selectedNvr, mode, initial]);

  // When site changes, reset NVR if it's not at the new site
  React.useEffect(() => {
    if (fields.nvrId && selectedNvr && selectedNvr.siteId !== fields.siteId) {
      setFields((curr) => ({ ...curr, nvrId: "", channel: null }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields.siteId]);

  // When NVR changes, ensure channel is valid; default to first available
  React.useEffect(() => {
    if (!fields.nvrId) {
      if (fields.channel != null) setFields((curr) => ({ ...curr, channel: null }));
      return;
    }
    if (availableChannels.length === 0) {
      if (fields.channel != null) setFields((curr) => ({ ...curr, channel: null }));
      return;
    }
    if (fields.channel == null || !availableChannels.includes(fields.channel)) {
      setFields((curr) => ({ ...curr, channel: availableChannels[0] }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields.nvrId, availableChannels.length]);

  /**
   * The schedule is only asked for once the camera has somewhere to record to.
   * See the card below: no NVR, no schedule.
   */
  const scheduleShown = linkNvr && !!fields.nvrId;

  /**
   * A schedule nobody was shown cannot hold up the form.
   *
   * This gates Submit, so leaving it unconditional would have left an unlinked
   * camera stuck behind "select at least one day" for a day-picker that is not
   * on screen — a disabled-feeling button with no visible reason, which is the
   * worst kind of validation.
   */
  const scheduleValid =
    !scheduleShown ||
    fields.recordingMode === "continuous" ||
    (fields.scheduleDays.length > 0 && fields.scheduleStart < fields.scheduleEnd);

  // In edit mode, keep Save disabled until the user actually changes something.
  const isDirty =
    mode === "add" || (initial != null && JSON.stringify(fields) !== JSON.stringify(initial));

  function handleSubmit() {
    const next: { name?: string; ipAddress?: string; siteId?: string; areaId?: string; username?: string; password?: string } = {};
    if (!fields.name.trim()) next.name = "Camera name is required.";
    if (!fields.ipAddress.trim()) next.ipAddress = "IP address is required.";
    if (!fields.username.trim()) next.username = "Username is required.";
    if (!fields.password) next.password = "Password is required.";
    if (!fields.siteId) next.siteId = "Select a site.";
    if (!fields.areaId) next.areaId = "Select an area.";
    setErrors(next);
    if (Object.keys(next).length === 0 && scheduleValid) onSubmit(fields);
  }

  /* An NVR can only be linked once a site is chosen — NVRs are site-scoped.
     Before that, saying "no NVR at this site" is just wrong: no site has been
     picked yet. Three distinct states, each with its own copy. */
  const noSiteYet = !fields.siteId;

  const nvrOptions = noSiteYet
    ? [{ value: "", label: "— Select a site first —" }]
    : siteNvrs.length === 0
      ? [{ value: "", label: "— No NVR at this site —" }]
      : [{ value: "", label: "— None (unlinked) —" }, ...siteNvrs.map((n) => ({ value: n.id, label: `${n.name} (${n.id})` }))];

  const nvrHint = noSiteYet
    ? "Pick the camera's site above to see its NVRs."
    : siteNvrs.length === 0
      ? "No NVRs registered at this site."
      : "Only NVRs at the same site can be linked.";

  const channelOptions = availableChannels.length === 0
    ? [{ value: "", label: "— No available channels —" }]
    : availableChannels.map((ch) => ({ value: String(ch), label: `Channel ${ch}` }));

  return (
    <Modal open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent size="lg">
        <ModalHeader
          title={mode === "add" ? "Add Camera" : "Edit Camera"}
          description={mode === "add" ? "Register a new camera. Camera ID is generated automatically." : `Update fields for ${initial?.id}. Camera ID cannot be changed.`}
        />
        <ModalBody className="space-y-4">
          {/* Edit mode shows read-only ID */}
          {mode === "edit" && (
            <FormField label="Camera ID" span={2}>
              <TextInput value={fields.id} onChange={() => {}} mono disabled />
            </FormField>
          )}

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Camera Name" span={2} error={errors.name}>
              <TextInput
                value={fields.name}
                onChange={(v) => set("name", v)}
                placeholder="e.g. Loading Bay 3 — Dock"
                invalid={!!errors.name}
              />
            </FormField>
            <FormField label="Site" error={errors.siteId}>
              <FormSelect
                value={fields.siteId}
                onChange={(v) => set("siteId", v)}
                options={[{ value: "", label: "Select a site" }, ...CAMERA_SITES]}
                invalid={!!errors.siteId}
              />
            </FormField>
            <FormField label="Area" error={errors.areaId}>
              <FormSelect
                value={fields.areaId}
                onChange={(v) => set("areaId", v)}
                options={[{ value: "", label: "Select an area" }, ...CAMERA_AREAS]}
                invalid={!!errors.areaId}
              />
            </FormField>
            <FormField label="IP Address" error={errors.ipAddress}>
              <TextInput
                value={fields.ipAddress}
                onChange={(v) => set("ipAddress", v)}
                placeholder="10.10.0.101"
                mono
                invalid={!!errors.ipAddress}
              />
            </FormField>
            <FormField label="RTSP Port">
              <TextInput
                value={fields.rtspPort}
                onChange={(v) => set("rtspPort", v)}
                placeholder="554"
                type="number"
                mono
              />
            </FormField>
            <FormField label="Username">
              <TextInput
                value={fields.username}
                onChange={(v) => set("username", v)}
                placeholder="admin"
                mono
                invalid={!!errors.username}
              />
            </FormField>
            <FormField label="Password">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={fields.password}
                  onChange={(e) => set("password", e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  aria-invalid={!!errors.password || undefined}
                  className={cn(
                    "h-9 w-full rounded-md border border-input bg-background px-3 pr-9 font-mono text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none",
                    errors.password && "border-sev-critical"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </button>
              </div>
            </FormField>
            <FormField label="Resolution">
              <FormSelect
                value={fields.resolution}
                onChange={(v) => set("resolution", v)}
                options={[
                  { value: "",          label: "Select resolution" },
                  { value: "1280x720",  label: "1280×720 (HD)" },
                  { value: "1920x1080", label: "1920×1080 (Full HD)" },
                  { value: "2560x1440", label: "2560×1440 (2K)" },
                  { value: "3840x2160", label: "3840×2160 (4K)" },
                ]}
              />
            </FormField>
            <FormField label="Frame Rate">
              <FormSelect
                value={fields.frameRate}
                onChange={(v) => set("frameRate", v)}
                options={[
                  { value: "",   label: "Select frame rate" },
                  { value: "15", label: "15 fps" },
                  { value: "20", label: "20 fps" },
                  { value: "25", label: "25 fps" },
                  { value: "30", label: "30 fps" },
                  { value: "60", label: "60 fps" },
                ]}
              />
            </FormField>
            <FormField label="RTSP URL" span={2} hint="Full RTSP feed URL. Leave blank to auto-build from IP + port.">
              <TextInput
                value={fields.rtspUrl}
                onChange={(v) => set("rtspUrl", v)}
                placeholder={`rtsp://${fields.ipAddress || "10.10.0.x"}:${fields.rtspPort || "554"}/Streaming/Channels/101`}
                mono
              />
            </FormField>
          </div>

          {/* NVR LINKAGE, THEN THE SCHEDULE — in that order, and each revealed
              by the answer above it.

              The schedule used to sit at the top of this card, open, with the
              NVR checkbox tucked underneath it. That asked people to choose
              recording days and hours before saying where the footage would be
              recorded TO — and a camera with no NVR has nowhere to write, so
              every one of those answers was provisional. Now the toggle comes
              first, its fields appear when it is on, and the schedule appears
              once an NVR is actually chosen. */}
          <div className="rounded-lg border border-border bg-background p-3.5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              NVR Linkage
            </p>

            <label className="flex cursor-pointer items-center gap-2">
              <Checkbox checked={linkNvr} onCheckedChange={(v) => toggleLinkNvr(v === true)} />
              <span className="text-sm font-medium text-foreground">Link this camera to an NVR</span>
            </label>

            {linkNvr && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <FormField label="Link to NVR" hint={nvrHint}>
                  <FormSelect
                    value={fields.nvrId}
                    onChange={(v) => set("nvrId", v)}
                    options={nvrOptions}
                    disabled={noSiteYet || siteNvrs.length === 0}
                  />
                </FormField>
                <FormField
                  label="Channel"
                  hint={
                    fields.nvrId
                      ? availableChannels.length === 0
                        ? "All channels are in use on this NVR."
                        : `${availableChannels.length} of ${selectedNvr?.channelCount ?? 0} channels available.`
                      : "Pick an NVR first."
                  }
                >
                  <FormSelect
                    value={fields.channel != null ? String(fields.channel) : ""}
                    onChange={(v) => set("channel", v ? Number(v) : null)}
                    options={channelOptions}
                    disabled={!fields.nvrId || availableChannels.length === 0}
                  />
                </FormField>
              </div>
            )}

            {/* Retention is a policy on the linked NVR's disk, so it only means
                anything once an NVR is chosen — it used to sit up in the device
                grid, where it implied the camera itself kept the footage. */}
            {scheduleShown && (
              <div className="mt-3 border-t border-border pt-3">
                <FormField
                  label="Retention (days)"
                  span={2}
                  hint={
                    selectedNvr
                      ? `${selectedNvr.name} keeps footage for ${selectedNvr.retentionDays} days by default.`
                      : undefined
                  }
                >
                  <TextInput
                    value={fields.retentionDays}
                    onChange={(v) => set("retentionDays", v)}
                    placeholder={String(selectedNvr?.retentionDays ?? 30)}
                    type="number"
                  />
                </FormField>
              </div>
            )}

            {scheduleShown && (
              <div className="mt-3 border-t border-border pt-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Recording Schedule
                </p>
              <FormField label="Mode" span={2} hint="Continuous records 24/7. Scheduled lets you pick specific days and times.">
                <FormSelect
                  value={fields.recordingMode}
                  onChange={(v) => set("recordingMode", v as RecordingMode)}
                  options={[
                    { value: "",           label: "Select recording mode" },
                    { value: "continuous", label: "Continuous · 24/7 recording" },
                    { value: "scheduled",  label: "Scheduled · selected days & hours" },
                  ]}
                />
              </FormField>

              {fields.recordingMode === "continuous" ? (
                <div className="mt-3 flex items-center gap-2 rounded-md border border-info/30 bg-info/[0.05] px-3 py-2 text-sm text-info">
                  <Clock className="size-3.5 flex-shrink-0" />
                  Recording continuously — all 7 days, 00:00 to 23:59.
                </div>
              ) : (
                <>
                  <div className="mb-3 mt-3">
                    <p className="mb-1.5 text-2xs font-semibold uppercase tracking-widest text-muted-foreground/70">
                      Days
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {DAY_LABELS.map((label, idx) => {
                        const selected = fields.scheduleDays.includes(idx);
                        return (
                          <button
                            key={label}
                            type="button"
                            onClick={() => toggleDay(idx)}
                            className={cn(
                              "h-9 min-w-[44px] rounded-md border px-2.5 text-sm font-semibold transition-colors",
                              selected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                            )}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                    {fields.scheduleDays.length === 0 && (
                      <p className="mt-1 text-xs text-sev-critical">Select at least one day.</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Start Time">
                      <TimeSelect
                        value={fields.scheduleStart}
                        onChange={(v) => set("scheduleStart", v)}
                        aria-label="Recording start time"
                      />
                    </FormField>
                    <FormField label="End Time">
                      <TimeSelect
                        value={fields.scheduleEnd}
                        onChange={(v) => set("scheduleEnd", v)}
                        aria-label="Recording end time"
                      />
                    </FormField>
                  </div>
                  {fields.scheduleStart >= fields.scheduleEnd && (
                    <p className="mt-1 text-xs text-sev-critical">End time must be after start time.</p>
                  )}
                </>
              )}
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" disabled={mode === "edit" && !isDirty} onClick={handleSubmit} className="gap-1.5">
            {mode === "add" ? <Plus className="size-3.5" /> : <Check className="size-3.5" />}
            {mode === "add" ? "Add Camera" : "Save Changes"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/* ── Confirm modal ───────────────────────────────────────────────────────── */

export function ConfirmModal({
  open,
  title,
  description,
  detail,
  confirmLabel,
  destructive,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  /** One-line header summary. */
  description: string;
  /** Longer consequence copy, shown in the body callout. */
  detail: React.ReactNode;
  confirmLabel: string;
  destructive?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent size="lg">
        <ModalHeader
          title={title}
          description={description}
          tone={destructive ? "destructive" : "default"}
        />
        <ModalBody>
          <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/[0.06] px-3 py-2.5">
            <AlertTriangle className="mt-0.5 size-4 flex-shrink-0 text-warning" />
            <div className="text-sm leading-snug text-muted-foreground">{detail}</div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            size="sm"
            variant={destructive ? "destructive" : "default"}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
