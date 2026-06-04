import * as React from "react";
import {
  X,
  ChevronRight,
  ChevronLeft,
  Building2,
  MapPin,
  Clock,
  UploadCloud,
  CheckCircle2,
  Image as ImageIcon,
  Trash2,
  SkipForward,
  Check,
  Plus,
  Shapes,
  AlertTriangle,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { makeBlankSite, generatedFloorPlan, AREA_PALETTE } from "@/mocks/sites";
import type { AreaShape, SiteData } from "@/types/sites";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (site: SiteData, opts: { openEditor: boolean }) => void;
  accentChoices: string[];
}

type Step = "details" | "areas" | "floor-plan" | "review";
const STEPS: { key: Step; title: string; subtitle: string }[] = [
  { key: "details",    title: "Site Details",  subtitle: "Name, address, timezone"                    },
  { key: "areas",      title: "Areas",         subtitle: "Add at least one area for this site"        },
  { key: "floor-plan", title: "Floor Plan",    subtitle: "Optional — can upload later"                },
  { key: "review",     title: "Review",        subtitle: "Confirm and create your site"               },
];

const TIMEZONES = [
  "Asia/Singapore", "Asia/Tokyo", "Asia/Hong_Kong", "Asia/Kuala_Lumpur",
  "Asia/Bangkok", "Australia/Sydney", "Europe/London", "America/New_York",
];

function StepBadge({ index, current, label }: { index: number; current: number; label: string }) {
  const done = index < current;
  const active = index === current;
  return (
    <div className="flex items-center gap-2">
      <div className={cn("flex size-7 items-center justify-center rounded-full border text-[11px] font-bold transition-colors",
        done   ? "border-primary bg-primary text-primary-foreground" :
        active ? "border-primary bg-primary/10 text-primary" :
                 "border-border bg-card text-muted-foreground")}>
        {done ? <Check className="size-3.5" strokeWidth={3} /> : index + 1}
      </div>
      <div className="hidden flex-col sm:flex">
        <p className={cn("text-[12px] font-semibold leading-tight", active ? "text-foreground" : "text-muted-foreground")}>
          {label}
        </p>
      </div>
    </div>
  );
}

function uidArea() {
  return `area-${Math.random().toString(36).slice(2, 8)}`;
}

export function CreateSiteWizard({ open, onClose, onCreate, accentChoices }: Props) {
  const [step, setStep] = React.useState<Step>("details");
  const [name, setName] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [timezone, setTimezone] = React.useState("Asia/Singapore");
  const [opFrom, setOpFrom] = React.useState("08:00");
  const [opTo, setOpTo] = React.useState("18:00");
  const [description, setDescription] = React.useState("");
  const [accent, setAccent] = React.useState(accentChoices[0]);
  const [areas, setAreas] = React.useState<AreaShape[]>([]);
  const [newAreaName, setNewAreaName] = React.useState("");
  const [floorPlanUrl, setFloorPlanUrl] = React.useState<string | null>(null);
  const [floorPlanName, setFloorPlanName] = React.useState<string>("");
  const [floorPlanLabel, setFloorPlanLabel] = React.useState("");
  const fileRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (open) {
      setStep("details");
      setName(""); setAddress(""); setTimezone("Asia/Singapore"); setDescription("");
      setAccent(accentChoices[0]);
      setAreas([]); setNewAreaName("");
      setFloorPlanUrl(null); setFloorPlanName(""); setFloorPlanLabel("");
    }
  }, [open, accentChoices]);

  const stepIdx = STEPS.findIndex((s) => s.key === step);
  const canNextFromDetails = name.trim().length > 0;
  const canNextFromAreas   = areas.length >= 1;

  function addArea() {
    const trimmed = newAreaName.trim();
    if (!trimmed) return;
    const color = AREA_PALETTE[areas.length % AREA_PALETTE.length];
    setAreas((curr) => [...curr, { id: uidArea(), name: trimmed, color, points: [] }]);
    setNewAreaName("");
  }
  function removeArea(id: string) {
    setAreas((curr) => curr.filter((a) => a.id !== id));
  }
  function setAreaColor(id: string, color: string) {
    setAreas((curr) => curr.map((a) => (a.id === id ? { ...a, color } : a)));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFloorPlanName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setFloorPlanUrl(typeof reader.result === "string" ? reader.result : null);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function useSampleFloorPlan() {
    setFloorPlanUrl(generatedFloorPlan());
    setFloorPlanName("Sample blueprint.svg");
    if (!floorPlanLabel) setFloorPlanLabel("Level 1 — Main Floor");
  }

  function next() {
    if (step === "details" && canNextFromDetails) setStep("areas");
    else if (step === "areas" && canNextFromAreas) setStep("floor-plan");
    else if (step === "floor-plan") setStep("review");
  }
  function back() {
    if (step === "areas") setStep("details");
    else if (step === "floor-plan") setStep("areas");
    else if (step === "review") setStep("floor-plan");
  }

  function create(openEditor: boolean) {
    const site = makeBlankSite(name.trim(), accent);
    site.address = address.trim();
    site.timezone = timezone;
    site.operatingHours = { from: opFrom, to: opTo };
    site.description = description.trim() || undefined;
    site.areas = areas;
    if (floorPlanUrl) {
      site.floorPlan = { imageUrl: floorPlanUrl, label: floorPlanLabel.trim() || "Floor Plan", width: 1200, height: 800 };
      site.status = "active";
    }
    onCreate(site, { openEditor });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="flex max-h-[85vh] w-[560px] max-w-[95vw] flex-col overflow-hidden p-0">
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-foreground">Add a New Site</h2>
            <p className="mt-0.5 text-[12px] text-muted-foreground">{STEPS[stepIdx].subtitle}</p>
          </div>
          <button onClick={onClose} className="flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>

        <div className="flex items-center gap-3 border-b border-border bg-background/40 px-5 py-3">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.key}>
              <StepBadge index={i} current={stepIdx} label={s.title} />
              {i < STEPS.length - 1 && (
                <div className={cn("h-px flex-1 transition-colors", i < stepIdx ? "bg-primary" : "bg-border")} />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {step === "details" && (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <Building2 className="size-3" />
                  Site Name <span className="text-sev-critical">*</span>
                </label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Astra HQ" className="h-9 text-[13px]" />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <MapPin className="size-3" />
                  Address
                </label>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="8 Marina Boulevard, Singapore 018984" className="h-9 text-[13px]" />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <Clock className="size-3" />
                  Timezone
                </label>
                <select value={timezone} onChange={(e) => setTimezone(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-[13px] text-foreground focus:border-primary focus:outline-none">
                  {TIMEZONES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <Clock className="size-3" />
                  Operating Hours
                </label>
                <div className="flex items-center gap-2">
                  <Input type="time" value={opFrom} onChange={(e) => setOpFrom(e.target.value)} className="h-9 w-36 text-[13px]" />
                  <span className="text-[12px] text-muted-foreground">to</span>
                  <Input type="time" value={opTo} onChange={(e) => setOpTo(e.target.value)} className="h-9 w-36 text-[13px]" />
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground/70">Daily window when this site is operational.</p>
              </div>
              <div>
                <label className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Description (optional)
                </label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
                  placeholder="A short description of this site…"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-[13px] text-foreground focus:border-primary focus:outline-none" />
              </div>
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Card Accent</p>
                <div className="flex flex-wrap gap-2">
                  {accentChoices.map((c) => (
                    <button key={c} onClick={() => setAccent(c)}
                      className={cn("relative size-9 overflow-hidden rounded-lg border-2 transition-colors",
                        accent === c ? "border-primary" : "border-border hover:border-primary/40")}
                      style={{ background: c }}
                      aria-label="Choose accent color">
                      {accent === c && <Check className="absolute inset-0 m-auto size-4 text-foreground drop-shadow" strokeWidth={3} />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === "areas" && (
            <div className="space-y-4">
              <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/[0.06] px-3 py-2.5">
                <AlertTriangle className="mt-0.5 size-4 flex-shrink-0 text-warning" />
                <p className="text-[12px] leading-snug text-muted-foreground">
                  Every site needs <strong className="text-foreground">at least one area</strong>. Areas are zones inside the
                  site (e.g. Lobby, Loading Bay) where you'll place cameras. You can draw their polygons later on the floor plan.
                </p>
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <Shapes className="size-3" />
                  Add Area
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    value={newAreaName}
                    onChange={(e) => setNewAreaName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addArea(); } }}
                    placeholder="e.g. Lobby, Loading Bay, Server Room…"
                    className="h-9 flex-1 text-[13px]"
                  />
                  <Button onClick={addArea} disabled={!newAreaName.trim()} className="gap-1.5">
                    <Plus className="size-3.5" />
                    Add
                  </Button>
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">Press Enter to add quickly</p>
              </div>

              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Areas ({areas.length}) <span className={cn("ml-1 normal-case", areas.length === 0 ? "text-sev-critical" : "text-success")}>
                    {areas.length === 0 ? "· at least one required" : "· ready"}
                  </span>
                </p>
                {areas.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-8 text-muted-foreground">
                    <Shapes className="size-6 opacity-30" />
                    <p className="text-[12px]">No areas yet. Add one above to continue.</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {areas.map((a) => (
                      <div key={a.id} className="group flex items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2">
                        <span className="size-3.5 rounded" style={{ background: a.color }} />
                        <span className="flex-1 text-[13px] font-semibold text-foreground">{a.name}</span>
                        <div className="flex items-center gap-1">
                          {AREA_PALETTE.slice(0, 6).map((c) => (
                            <button key={c} onClick={() => setAreaColor(a.id, c)}
                              title="Change color"
                              className={cn("size-3.5 rounded border-2 transition-colors",
                                a.color === c ? "border-foreground" : "border-transparent opacity-60 hover:opacity-100 hover:border-foreground/40")}
                              style={{ background: c }} />
                          ))}
                        </div>
                        <button onClick={() => removeArea(a.id)}
                          className="flex size-6 items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity hover:bg-sev-critical/10 hover:text-sev-critical group-hover:opacity-100"
                          aria-label="Remove area">
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === "floor-plan" && (
            <div className="space-y-4">
              <div className="flex items-start gap-2 rounded-lg border border-info/30 bg-info/[0.06] px-3 py-2.5">
                <SkipForward className="mt-0.5 size-4 flex-shrink-0 text-info" />
                <p className="text-[12px] leading-snug text-muted-foreground">
                  Floor plans are <strong className="text-foreground">optional</strong>. Skip this step to add one later
                  — your areas are already created.
                </p>
              </div>

              {floorPlanUrl ? (
                <div className="space-y-3">
                  <div className="relative overflow-hidden rounded-xl border border-border bg-neutral-950">
                    <img src={floorPlanUrl} alt="Floor plan preview" className="block w-full" />
                    <button onClick={() => { setFloorPlanUrl(null); setFloorPlanName(""); }}
                      className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md border border-white/20 bg-black/70 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-sm hover:bg-black/90">
                      <Trash2 className="size-3" />
                      Remove
                    </button>
                  </div>
                  <div>
                    <label className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Floor Plan Label
                    </label>
                    <Input value={floorPlanLabel} onChange={(e) => setFloorPlanLabel(e.target.value)}
                      placeholder="e.g. Level 3 — North Wing" className="h-9 text-[13px]" />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    File <span className="font-mono text-foreground">{floorPlanName}</span> · Will be uploaded with the site.
                  </p>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border bg-background py-10 transition-colors hover:border-primary/40 hover:bg-muted/40 w-full"
                >
                  <UploadCloud className="size-8 text-muted-foreground" />
                  <p className="text-[13px] font-semibold text-foreground">Click to upload a floor plan</p>
                  <p className="text-[11px] text-muted-foreground">PNG, JPG or SVG · up to 10 MB</p>
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/svg+xml" className="hidden" onChange={handleFileChange} />

              {!floorPlanUrl && (
                <button onClick={useSampleFloorPlan}
                  className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2.5 text-left transition-colors hover:border-primary/40">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                    <ImageIcon className="size-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-semibold text-foreground">Use Sample Blueprint</p>
                    <p className="text-[11px] text-muted-foreground">A generic floor plan to use while you wait for the real one.</p>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </button>
              )}
            </div>
          )}

          {step === "review" && (
            <div className="space-y-4">
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="border-b border-border px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Site Details</p>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 px-4 py-3">
                  {([
                    ["Name", name || "—"],
                    ["Timezone", timezone],
                    ["Address", address || "—"],
                    ["Operating Hours", `${opFrom} – ${opTo}`],
                    ["Floor Plan", floorPlanUrl ? `Uploaded · ${floorPlanLabel || "Floor Plan"}` : "Not provided — can be added later"],
                  ] as [string, string][]).map(([label, value]) => (
                    <div key={label} className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
                      <span className="text-[12px] font-medium text-foreground">{value}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border px-4 py-3">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Areas ({areas.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {areas.map((a) => (
                      <span key={a.id} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-0.5 text-[11px] font-semibold text-foreground">
                        <span className="size-2.5 rounded" style={{ background: a.color }} />
                        {a.name}
                      </span>
                    ))}
                  </div>
                </div>
                {description && (
                  <div className="border-t border-border px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Description</p>
                    <p className="mt-1 text-[12px] text-foreground">{description}</p>
                  </div>
                )}
              </div>
              {floorPlanUrl ? (
                <div className="overflow-hidden rounded-xl border border-border bg-neutral-950">
                  <img src={floorPlanUrl} alt="Floor plan preview" className="block w-full opacity-80" />
                </div>
              ) : (
                <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/[0.06] px-3 py-2.5">
                  <ImageIcon className="mt-0.5 size-4 flex-shrink-0 text-warning" />
                  <p className="text-[12px] leading-snug text-muted-foreground">
                    No floor plan was uploaded. You'll be able to upload one and draw your areas anytime from the
                    site detail page.
                  </p>
                </div>
              )}
              <div className="flex items-start gap-2 rounded-lg border border-success/30 bg-success/[0.06] px-3 py-2.5">
                <CheckCircle2 className="mt-0.5 size-4 flex-shrink-0 text-success" />
                <p className="text-[12px] leading-snug text-muted-foreground">
                  Ready to create. {floorPlanUrl ? "We'll drop you into the floor plan editor next." : "We'll take you to the site detail page so you can configure further."}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-border bg-card px-5 py-3.5">
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
                {step === "floor-plan" && (
                  <Button variant="outline" onClick={next}>Skip for now</Button>
                )}
                <Button onClick={next}
                  disabled={
                    (step === "details"    && !canNextFromDetails) ||
                    (step === "areas"      && !canNextFromAreas)   ||
                    // Floor plan: Continue only enabled once user picks/uploads a floor plan.
                    // The "Skip for now" button above remains available for users who want to defer.
                    (step === "floor-plan" && !floorPlanUrl)
                  }
                  className="gap-1.5">
                  Continue
                  <ChevronRight className="size-3.5" />
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => create(false)}>Create & Close</Button>
                <Button onClick={() => create(true)} className="gap-1.5">
                  <Check className="size-3.5" />
                  Create & Open Editor
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

