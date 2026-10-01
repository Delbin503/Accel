import * as React from "react";
import { toast } from "sonner";
import { Check, CircleCheck, Layers, LoaderCircle, Map as MapIcon, Pencil, Rocket, ScanLine, VideoOff, Wand2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { BoundaryZone, CameraData } from "@/types/cameras";
import type { ModelData } from "./reidModels";
import {
  OUTLIER_CM,
  applyEdits,
  autoPlace,
  markerPosition,
  sceneMarkers,
  zoneBox,
  type MarkerEdit,
  type Placement,
  type SceneMarker,
  type Verdict,
} from "./calibrationGeometry";
import { ReidSiteMapModal } from "./ReidSiteMap";
import { useReidMapsStore } from "./reidMaps";

/* Re-ID deployment — calibration drawer.

   "Ready to Deploy" on a Re-ID model opens this drawer instead of the zone
   modal. Per camera: Auto-Place Markers fits the markers in view and joins the
   ones left into the camera's zone — re-run until it looks right, or Edit the
   marker table by hand — then Confirm Calibration saves it and moves on to the
   next camera without one. Calibrate All Cameras does that for every camera
   still uncalibrated in one go and opens the merged zone map. Once every online
   camera is calibrated, Save & Deploy opens the same site map review, and its
   Confirm finishes the deployment.
   Closing the drawer keeps the progress; changing the selection resets it. */

const VB_W = 1600;
const VB_H = 900;
/** Long enough to read as work, short enough to re-run freely. */
const PLACE_MS = 700;
/** Calibrate All works through every camera, so it reads as a longer job. */
const PLACE_ALL_MS = 1400;
/** Calibrate All re-runs a camera's fit up to this many times to get past a poor one. */
const MAX_RUNS = 8;
/** placingId while Calibrate All is running. */
const ALL = "__all__";

const VERDICT: Record<Verdict, { label: string; box: string; text: string }> = {
  good: { label: "good", box: "border-success/40 bg-success/[0.06]", text: "text-success" },
  usable: { label: "usable", box: "border-warning/40 bg-warning/[0.06]", text: "text-warning" },
  poor: { label: "poor", box: "border-sev-critical/40 bg-sev-critical/[0.06]", text: "text-sev-critical" },
};

const VERDICT_FILL: Record<Verdict, string> = {
  good: "fill-success",
  usable: "fill-warning",
  poor: "fill-sev-critical",
};

/* ── Camera frame ─────────────────────────────────────────────────────── */

function Marker({ m, state }: { m: SceneMarker; state: "idle" | "used" | "dropped" }) {
  const s = m.size;
  const cell = (s * 0.62) / 4;
  const inner = s * 0.62;
  return (
    <g transform={`translate(${m.u * VB_W} ${m.v * VB_H}) rotate(${m.rot})`}>
      {/* White sheet, black border, 4×4 bit field — a printed ArUco tag. */}
      <rect x={-s * 0.75} y={-s * 0.75} width={s * 1.5} height={s * 1.5} className="fill-neutral-100" />
      <rect x={-s / 2} y={-s / 2} width={s} height={s} className="fill-neutral-950" />
      {m.bits.map((on, i) =>
        on ? (
          <rect
            key={i}
            x={-inner / 2 + (i % 4) * cell}
            y={-inner / 2 + Math.floor(i / 4) * cell}
            width={cell}
            height={cell}
            className="fill-neutral-100"
          />
        ) : null
      )}
      {state !== "idle" && (
        <rect
          x={-s * 0.95}
          y={-s * 0.95}
          width={s * 1.9}
          height={s * 1.9}
          fill="none"
          strokeWidth={4}
          className={state === "used" ? "stroke-success" : "stroke-sev-critical"}
        />
      )}
      {state === "dropped" && (
        <path
          d={`M${-s * 0.95} ${-s * 0.95} L${s * 0.95} ${s * 0.95} M${s * 0.95} ${-s * 0.95} L${-s * 0.95} ${s * 0.95}`}
          strokeWidth={4}
          className="stroke-sev-critical"
        />
      )}
    </g>
  );
}

function MarkerLabel({ m, error }: { m: SceneMarker; error?: number }) {
  return (
    <text
      x={m.u * VB_W + m.size * 1.15}
      y={m.v * VB_H - m.size * 0.35}
      className="fill-purple font-mono"
      fontSize={20}
      fontWeight={700}
    >
      {m.id}
      <tspan className="fill-purple/80" fontWeight={500} fontSize={16}>
        {error === undefined ? ` (${m.x.toFixed(2)}, ${m.y.toFixed(2)} m)` : ` ${error.toFixed(1)} cm`}
      </tspan>
    </text>
  );
}

function CameraFrame({
  camera,
  markers,
  placement,
  placing,
  placingLabel = "Placing markers…",
}: {
  camera: CameraData;
  markers: SceneMarker[];
  placement: Placement | undefined;
  placing: boolean;
  placingLabel?: string;
}) {
  const byId = new Map(markers.map((m) => [m.id, m]));
  const outline = placement?.boundary.map((id) => byId.get(id)).filter((m): m is SceneMarker => !!m) ?? [];
  const seconds = String(10 + (camera.id.length * 7) % 49).padStart(2, "0");

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      role="img"
      aria-label={`${camera.name} — ${markers.length} markers in view${placement ? `, zone through ${placement.boundary.join(", ")}` : ""}`}
      className="block h-auto w-full"
    >
      {/* Room: back wall, floor in perspective, a few desks — enough to read as a CCTV frame. */}
      <rect width={VB_W} height={VB_H} className="fill-neutral-900" />
      <rect width={VB_W} height={300} className="fill-neutral-800" />
      <path d={`M0 ${VB_H} L${VB_W} ${VB_H} L1250 300 L350 300 Z`} className="fill-neutral-700" />
      <g className="stroke-neutral-600" strokeWidth={2} opacity={0.5}>
        {Array.from({ length: 9 }, (_, i) => {
          const x = 350 + (i * 900) / 8;
          return <line key={`r${i}`} x1={x} y1={300} x2={(i * VB_W) / 8} y2={VB_H} />;
        })}
        {[380, 480, 610, 760].map((y) => {
          const t = (y - 300) / 600;
          return <line key={`h${y}`} x1={350 - 350 * t} y1={y} x2={1250 + 350 * t} y2={y} />;
        })}
      </g>
      <g className="fill-neutral-600">
        <path d="M0 330 L230 300 L250 520 L0 600 Z" />
        <path d="M1600 320 L1370 300 L1350 500 L1600 570 Z" />
        <rect x={620} y={210} width={140} height={90} rx={4} className="fill-neutral-700" />
        <rect x={860} y={225} width={180} height={75} rx={4} className="fill-neutral-700" />
      </g>

      {/* Zone — the used markers joined into the camera's floor boundary. */}
      {placement && outline.length >= 3 && (
        <polygon
          points={outline.map((m) => `${m.u * VB_W},${m.v * VB_H}`).join(" ")}
          strokeWidth={5}
          strokeLinejoin="round"
          className="fill-success/15 stroke-success"
        />
      )}

      {markers.map((m) => (
        <Marker
          key={m.id}
          m={m}
          state={!placement ? "idle" : placement.dropped.includes(m.id) ? "dropped" : "used"}
        />
      ))}
      {markers.map((m) => (
        <MarkerLabel key={m.id} m={m} error={placement?.errors[m.id]} />
      ))}

      {/* CCTV burn-in */}
      <text x={40} y={70} className="fill-neutral-100 font-mono" fontSize={40} fontWeight={600}>
        09-29-2026 Tue 17:16:{seconds}
      </text>
      <text x={VB_W - 40} y={VB_H - 40} textAnchor="end" className="fill-neutral-100 font-mono" fontSize={38} fontWeight={600}>
        {camera.name}
      </text>
      {placement && (
        <text x={40} y={118} className={cn("font-mono", VERDICT_FILL[placement.verdict])} fontSize={26} fontWeight={700}>
          RMSE {placement.rmse.toFixed(1)} cm · max {placement.worst.toFixed(1)} cm ({placement.verdict})
          {placement.dropped.length > 0 ? ` · dropped ${placement.dropped.join(", ")}` : ""}
        </text>
      )}

      {placing && (
        <g>
          <rect width={VB_W} height={VB_H} className="fill-neutral-950/40" />
          <text x={VB_W / 2} y={VB_H / 2} textAnchor="middle" className="fill-neutral-100" fontSize={40} fontWeight={600}>
            {placingLabel}
          </text>
        </g>
      )}
    </svg>
  );
}

/* ── Marker list ──────────────────────────────────────────────────────── */

type Draft = Record<string, { x: string; y: string; error: string }>;

/** A typed number, or null when the field doesn't hold one. */
function parseNum(v: string): number | null {
  if (v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function MarkerTable({
  markers,
  placement,
  disabled,
  onSave,
}: {
  markers: SceneMarker[];
  placement: Placement;
  disabled: boolean;
  onSave: (edits: Record<string, MarkerEdit>) => void;
}) {
  const [draft, setDraft] = React.useState<Draft | null>(null);
  const editing = draft !== null;

  // Sorted from the placement, not the draft, so rows don't jump while typing.
  const rows = [...markers].sort((a, b) => {
    const rank = (id: string) => (placement.boundary.includes(id) ? 0 : placement.dropped.includes(id) ? 2 : 1);
    return rank(a.id) - rank(b.id) || a.id.localeCompare(b.id);
  });

  function startEdit() {
    setDraft(
      Object.fromEntries(
        markers.map((m) => {
          const pos = markerPosition(m, placement);
          return [m.id, { x: pos.x.toFixed(3), y: pos.y.toFixed(3), error: placement.errors[m.id].toFixed(1) }];
        })
      )
    );
  }

  const invalid = (id: string, field: "x" | "y" | "error") => {
    if (!draft) return false;
    const n = parseNum(draft[id][field]);
    return n === null || (field === "error" && n < 0);
  };
  const anyInvalid = editing && markers.some((m) => invalid(m.id, "x") || invalid(m.id, "y") || invalid(m.id, "error"));

  function save() {
    if (!draft || anyInvalid) return;
    onSave(
      Object.fromEntries(
        markers.map((m) => [
          m.id,
          { x: parseNum(draft[m.id].x) ?? m.x, y: parseNum(draft[m.id].y) ?? m.y, error: parseNum(draft[m.id].error) ?? 0 },
        ])
      )
    );
    setDraft(null);
  }

  const set = (id: string, field: "x" | "y" | "error", value: string) =>
    setDraft((d) => (d ? { ...d, [id]: { ...d[id], [field]: value } } : d));

  const cellInput = (id: string, field: "x" | "y" | "error", label: string) => (
    <Input
      value={draft?.[id][field] ?? ""}
      onChange={(e) => set(id, field, e.target.value)}
      inputMode="decimal"
      aria-label={`${id} ${label}`}
      aria-invalid={invalid(id, field) || undefined}
      className="ml-auto h-7 w-24 px-2 text-right font-mono text-sm"
    />
  );

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <CircleCheck className="size-3.5" />
          Markers intersected · {placement.boundary.length} on the boundary,{" "}
          {placement.used.length - placement.boundary.length} inside, {placement.dropped.length} dropped
        </p>
        <div className="ml-auto flex items-center gap-1.5">
          {editing ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => setDraft(null)} className="gap-1.5">
                <X className="size-3.5" /> Cancel
              </Button>
              <Button size="sm" onClick={save} disabled={anyInvalid} className="gap-1.5">
                <Check className="size-3.5" /> Save changes
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={startEdit} disabled={disabled} className="gap-1.5">
              <Pencil className="size-3.5" /> Edit markers
            </Button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr className="text-left text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
              <th className="px-3 py-2">Marker</th>
              <th className="px-3 py-2 text-right">Floor x (m)</th>
              <th className="px-3 py-2 text-right">Floor y (m)</th>
              <th className="px-3 py-2 text-right">Fit error{editing ? " (cm)" : ""}</th>
              <th className="px-3 py-2">In this map</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((m) => {
              const onBoundary = placement.boundary.includes(m.id);
              const dropped = placement.dropped.includes(m.id);
              const pos = markerPosition(m, placement);
              return (
                <tr key={m.id} className={cn(dropped && !editing && "text-muted-foreground")}>
                  <td className="px-3 py-2 font-mono font-semibold text-foreground">
                    {m.id}
                    {placement.edited?.includes(m.id) && (
                      <span className="ml-1.5 font-sans text-2xs font-medium text-info">edited</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right font-mono">{editing ? cellInput(m.id, "x", "floor x") : pos.x.toFixed(3)}</td>
                  <td className="px-3 py-2 text-right font-mono">{editing ? cellInput(m.id, "y", "floor y") : pos.y.toFixed(3)}</td>
                  <td className={cn("px-3 py-2 text-right font-mono", dropped && !editing && "text-sev-critical")}>
                    {editing ? cellInput(m.id, "error", "fit error") : `${placement.errors[m.id].toFixed(1)} cm`}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-2xs font-semibold",
                        onBoundary
                          ? "border-success/40 bg-success/10 text-success"
                          : dropped
                            ? "border-sev-critical/40 bg-sev-critical/10 text-sev-critical"
                            : "border-border bg-muted text-muted-foreground"
                      )}
                    >
                      {onBoundary ? "On boundary" : dropped ? "Dropped · outlier" : "Inside zone"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {editing && (
        <p className="mt-2 text-xs text-muted-foreground">
          Floor positions are metres from the site origin. A fit error of {OUTLIER_CM} cm or more drops the marker as an
          outlier — saving re-fits the zone, and you confirm the calibration again.
        </p>
      )}
    </div>
  );
}

/* ── Drawer ───────────────────────────────────────────────────────────── */

type CameraState = "offline" | "saved" | "unsaved" | "empty";

const STATE_LABEL: Record<CameraState, { label: string; text: string }> = {
  offline: { label: "offline", text: "text-muted-foreground" },
  saved: { label: "calibrated", text: "text-success" },
  unsaved: { label: "placed · not saved", text: "text-warning" },
  empty: { label: "not calibrated", text: "text-muted-foreground" },
};

export function ReidCalibrationDrawer({
  open,
  model,
  siteName,
  cameras,
  onClose,
  onConfirm,
}: {
  open: boolean;
  model: ModelData | null;
  siteName: string;
  cameras: CameraData[];
  onClose: () => void;
  onConfirm: (zones: Record<string, BoundaryZone[]>) => void;
}) {
  const [cameraId, setCameraId] = React.useState(
    () => cameras.find((c) => c.status === "online")?.id ?? cameras[0]?.id ?? ""
  );
  /** The latest auto-place run (plus hand edits) per camera — what the frame shows. */
  const [placements, setPlacements] = React.useState<Record<string, Placement>>({});
  /** Calibrations the operator has confirmed — what deploys. */
  const [saved, setSaved] = React.useState<Record<string, Placement>>({});
  const [placingId, setPlacingId] = React.useState<string | null>(null);
  /** The site map modal: "review" before deploying, "view" to look at progress. */
  const [mapMode, setMapMode] = React.useState<"review" | "view" | null>(null);
  const setMapOpen = (open: boolean) => setMapMode(open ? "review" : null);
  const timer = React.useRef<number | null>(null);
  React.useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  const markersByCamera = React.useMemo(
    () => Object.fromEntries(cameras.map((c) => [c.id, sceneMarkers(c.id)])),
    [cameras]
  );

  const camera = cameras.find((c) => c.id === cameraId) ?? cameras[0];
  const markers = camera ? markersByCamera[camera.id] : [];
  const placement = camera ? placements[camera.id] : undefined;
  const offline = camera?.status !== "online";

  // Offline cameras have no frame to calibrate — they pick it up on reconnect.
  const calibratable = cameras.filter((c) => c.status === "online");
  const savedCameras = calibratable.filter((c) => saved[c.id]);
  const canDeploy = calibratable.length > 0 && savedCameras.length === calibratable.length && !placingId;

  const stateOf = (c: CameraData): CameraState =>
    c.status !== "online"
      ? "offline"
      : placements[c.id] && placements[c.id] !== saved[c.id]
        ? "unsaved"
        : saved[c.id]
          ? "saved"
          : "empty";

  const currentSaved = !!camera && !!placement && saved[camera.id] === placement;
  const canConfirm = !!placement && placement.verdict !== "poor" && !currentSaved && !placingId;

  function runAutoPlace() {
    if (!camera || offline) return;
    const id = camera.id;
    const run = (placements[id]?.run ?? 0) + 1;
    setPlacingId(id);
    timer.current = window.setTimeout(() => {
      setPlacements((p) => ({ ...p, [id]: autoPlace(id, markersByCamera[id], run) }));
      setPlacingId(null);
    }, PLACE_MS);
  }

  /** Auto-places every online camera without a saved calibration, saves them, and opens the merged map. */
  function calibrateAll() {
    if (placingId || calibratable.length === 0) return;
    setPlacingId(ALL);
    timer.current = window.setTimeout(() => {
      const nextPlacements = { ...placements };
      const nextSaved = { ...saved };
      const failed: CameraData[] = [];
      for (const c of calibratable) {
        if (nextSaved[c.id]) continue;
        let run = placements[c.id]?.run ?? 0;
        let p: Placement | undefined;
        // Keep re-running a poor fit, the way an operator would.
        for (let i = 0; i < MAX_RUNS; i++) {
          p = autoPlace(c.id, markersByCamera[c.id], ++run);
          if (p.verdict !== "poor") break;
        }
        if (!p) continue;
        nextPlacements[c.id] = p;
        if (p.verdict === "poor") failed.push(c);
        else nextSaved[c.id] = p;
      }
      setPlacements(nextPlacements);
      setSaved(nextSaved);
      setPlacingId(null);
      if (failed.length) {
        setCameraId(failed[0].id);
        toast.warning(`${calibratable.length - failed.length} of ${calibratable.length} cameras calibrated`, {
          description: `${failed.map((c) => c.name).join(", ")} couldn't get a usable fit — re-run or edit ${
            failed.length === 1 ? "it" : "them"
          } by hand.`,
        });
        return;
      }
      toast.success(`All ${calibratable.length} cameras calibrated`, {
        description: "Merged into one zone map — review it, then confirm to deploy.",
      });
      setMapOpen(true);
    }, PLACE_ALL_MS);
  }

  function saveEdits(edits: Record<string, MarkerEdit>) {
    if (!camera || !placement) return;
    const next = applyEdits(markers, placement, edits);
    setPlacements((p) => ({ ...p, [camera.id]: next }));
    toast.success(`Marker edits applied to ${camera.name}`, {
      description: `Re-fitted — RMSE ${next.rmse.toFixed(1)} cm (${next.verdict}), ${next.used.length} markers. ${
        next.verdict === "poor" ? "Too poor to save — adjust again or re-run Auto-Place Markers." : "Confirm Calibration to save it."
      }`,
    });
  }

  function confirmCalibration() {
    if (!camera || !placement) return;
    const nextSaved = { ...saved, [camera.id]: placement };
    setSaved(nextSaved);

    // Move on to the next online camera — after this one, wrapping — that isn't calibrated yet.
    const start = calibratable.findIndex((c) => c.id === camera.id);
    const ordered = [...calibratable.slice(start + 1), ...calibratable.slice(0, start)];
    const next = ordered.find((c) => !nextSaved[c.id]);
    if (next) setCameraId(next.id);

    const done = calibratable.filter((c) => nextSaved[c.id]).length;
    toast.success(`Calibration saved for ${camera.name}`, {
      description: next
        ? `${placement.used.length} markers · RMSE ${placement.rmse.toFixed(1)} cm. Next: ${next.name} (${done} of ${calibratable.length} done).`
        : `${placement.used.length} markers · RMSE ${placement.rmse.toFixed(1)} cm. All ${calibratable.length} cameras are calibrated — Save & Deploy is ready.`,
    });
  }

  function deploy() {
    if (!model) return;
    const zones: Record<string, BoundaryZone[]> = {};
    for (const c of calibratable) {
      const p = saved[c.id];
      zones[c.id] = [
        { id: `${c.id}-reid`, label: `Re-ID floor zone · ${p.used.length} markers`, box: zoneBox(markersByCamera[c.id], p.used) },
      ];
    }
    // The linked groups become the Re-ID maps Live Monitoring tracks weapons on.
    useReidMapsStore.getState().addDeployment({
      siteName,
      modelName: model.name,
      usedByCamera: Object.fromEntries(calibratable.map((c) => [c.id, saved[c.id].used])),
      positionsByCamera: Object.fromEntries(calibratable.map((c) => [c.id, saved[c.id].positions ?? {}])),
    });
    setMapOpen(false);
    onConfirm(zones);
  }

  const v = placement ? VERDICT[placement.verdict] : null;
  const usedByCamera = Object.fromEntries(savedCameras.map((c) => [c.id, saved[c.id].used]));
  const positionsByCamera = Object.fromEntries(savedCameras.map((c) => [c.id, saved[c.id].positions ?? {}]));

  return (
    <>
      <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
        <SheetContent
          side="right"
          showCloseButton={false}
          className="flex w-[min(860px,58vw)] max-w-[95vw] flex-col gap-0 p-0"
        >
          {/* Header */}
          <SheetHeader className="border-b border-border bg-card px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <SheetTitle className="text-lg font-bold">Calibrate cameras</SheetTitle>
                <SheetDescription className="mt-0.5 text-sm">
                  {model?.name} · {siteName} — auto-place the markers on each camera and confirm its calibration. Save &amp;
                  Deploy once every camera is calibrated.
                </SheetDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close" className="-mr-1 size-8">
                <X className="size-4" />
              </Button>
            </div>
          </SheetHeader>

          {camera ? (
            <>
              {/* Camera picker */}
              <div className="flex flex-wrap items-start gap-x-2 gap-y-2 border-b border-border bg-card px-5 py-3">
                <span className="flex h-9 items-center text-sm font-semibold text-foreground">Camera</span>
                <div className="flex flex-col gap-1">
                  <Select value={camera.id} onValueChange={setCameraId}>
                    <SelectTrigger className="h-9 w-72 text-sm" aria-label="Camera">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {cameras.map((c) => {
                        const st = STATE_LABEL[stateOf(c)];
                        return (
                          <SelectItem key={c.id} value={c.id}>
                            <span className="flex items-center gap-2">
                              {c.name}
                              <span className={cn("text-2xs", st.text)}>· {st.label}</span>
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <span className="text-xs text-muted-foreground">
                    <strong className={cn(canDeploy ? "text-success" : "text-foreground")}>{savedCameras.length}</strong> of{" "}
                    {calibratable.length} camera{calibratable.length === 1 ? "" : "s"} calibrated
                  </span>
                </div>
                <span className="flex h-9 items-center font-mono text-2xs text-muted-foreground">
                  {camera.id} · {markers.length} markers in view
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMapMode("view")}
                  disabled={savedCameras.length === 0}
                  title={savedCameras.length === 0 ? "Calibrate a camera to see it on the map" : "See every calibrated zone on one floor plan"}
                  className="ml-auto mt-1 gap-1.5"
                >
                  <MapIcon className="size-3.5" /> View Map
                </Button>
              </div>

              {/* Body */}
              <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="bg-neutral-950 p-3">
                  {offline ? (
                    <div className="flex aspect-video flex-col items-center justify-center gap-2 text-neutral-400">
                      <VideoOff className="size-6" />
                      <p className="text-sm">{camera.name} is offline — it calibrates when it reconnects.</p>
                    </div>
                  ) : (
                    <CameraFrame
                      camera={camera}
                      markers={markers}
                      placement={placement}
                      placing={placingId === camera.id || placingId === ALL}
                      placingLabel={placingId === ALL ? `Calibrating all ${calibratable.length} cameras…` : undefined}
                    />
                  )}
                </div>

                <div className="space-y-3 px-5 py-4">
                  {offline ? null : !placement ? (
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ScanLine className="size-4" />
                      {markers.length} markers in view. Press Auto-Place Markers to fit them to the floor and draw the zone.
                    </p>
                  ) : (
                    <>
                      <div className={cn("rounded-lg border px-3 py-2.5 text-sm", v?.box)}>
                        <span className={cn("font-bold", v?.text)}>{v?.label}</span>
                        <span className="text-foreground">
                          {" "}— RMSE {placement.rmse.toFixed(1)} cm, worst marker {placement.worst.toFixed(1)} cm,{" "}
                          {placement.used.length} markers
                          {placement.dropped.length > 0
                            ? `, dropped ${placement.dropped.join(", ")} (outliers, excluded)`
                            : ", none dropped"}
                          .
                        </span>
                        <span className="ml-1 text-xs text-muted-foreground">
                          Run {placement.run}
                          {placement.edited?.length ? ` · ${placement.edited.length} edited by hand` : ""}
                          {placement.verdict === "poor"
                            ? " · re-run or edit to get a usable zone"
                            : currentSaved
                              ? " · saved"
                              : saved[camera.id]
                                ? " · a saved calibration exists — confirm to replace it"
                                : ""}
                        </span>
                      </div>

                      <MarkerTable
                        key={`${camera.id}:${placement.run}`}
                        markers={markers}
                        placement={placement}
                        disabled={!!placingId}
                        onSave={saveEdits}
                      />
                    </>
                  )}
                  {cameras.length > calibratable.length && (
                    <p className="text-xs text-muted-foreground">
                      {cameras.length - calibratable.length} offline camera
                      {cameras.length - calibratable.length === 1 ? "" : "s"} will calibrate on reconnect and aren't needed
                      to deploy.
                    </p>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex flex-wrap items-center gap-2 border-t border-border bg-card px-5 py-3.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={runAutoPlace}
                  disabled={offline || !!placingId}
                  className="gap-1.5 border-primary/50 bg-primary/10 text-primary hover:border-primary hover:bg-primary/20 hover:text-primary"
                >
                  {placingId === camera.id ? <LoaderCircle className="size-3.5 animate-spin" /> : <Wand2 className="size-3.5" />}
                  Auto-Place Markers
                </Button>
                <Button variant="outline" size="sm" onClick={confirmCalibration} disabled={!canConfirm} className="gap-1.5">
                  <Check className="size-3.5" /> {currentSaved ? "Calibration saved" : "Confirm Calibration"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={calibrateAll}
                  disabled={!!placingId || calibratable.length === 0}
                  title="Auto-place every camera that isn't calibrated yet and merge them into one zone map"
                  className="ml-auto gap-1.5"
                >
                  {placingId === ALL ? <LoaderCircle className="size-3.5 animate-spin" /> : <Layers className="size-3.5" />}
                  Calibrate All Cameras
                </Button>
                <Button size="sm" onClick={() => setMapOpen(true)} disabled={!canDeploy} className="gap-1.5">
                  <Rocket className="size-3.5" /> Save &amp; Deploy
                </Button>
              </div>
            </>
          ) : (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">No cameras selected.</p>
          )}
        </SheetContent>
      </Sheet>

      <ReidSiteMapModal
        open={mapMode !== null}
        mode={mapMode ?? "review"}
        siteName={siteName}
        cameras={savedCameras}
        usedByCamera={usedByCamera}
        positionsByCamera={positionsByCamera}
        onClose={() => setMapOpen(false)}
        onConfirm={deploy}
      />
    </>
  );
}
