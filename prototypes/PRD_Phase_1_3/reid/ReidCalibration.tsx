import * as React from "react";
import { toast } from "sonner";
import { ArrowLeft, Check, CircleCheck, LoaderCircle, Rocket, ScanLine, VideoOff, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/layout/PageHeader";
import { cn } from "@/lib/utils";
import type { BoundaryZone, CameraData } from "@/types/cameras";
import type { ModelData } from "./reidModels";
import { autoPlace, sceneMarkers, zoneBox, type Placement, type SceneMarker, type Verdict } from "./calibrationGeometry";
import { ReidSiteMapModal } from "./ReidSiteMap";
import { useReidMapsStore } from "./reidMaps";

/* Re-ID deployment — calibration step.

   "Ready to Deploy" on a Re-ID model lands here instead of the zone modal.
   Per camera: Auto-Place All fits the markers in view and joins the ones left
   into the camera's zone — re-run until it looks right — then Confirm zone
   saves it and moves on to the next camera without one. Once every online
   camera has a saved zone, Deploy opens the site map review, and its Confirm
   finishes the deployment. */

const VB_W = 1600;
const VB_H = 900;
/** Long enough to read as work, short enough to re-run freely. */
const PLACE_MS = 700;

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
}: {
  camera: CameraData;
  markers: SceneMarker[];
  placement: Placement | undefined;
  placing: boolean;
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
            Placing markers…
          </text>
        </g>
      )}
    </svg>
  );
}

/* ── Marker list ──────────────────────────────────────────────────────── */

function MarkerTable({ markers, placement }: { markers: SceneMarker[]; placement: Placement }) {
  const rows = [...markers].sort((a, b) => {
    const rank = (id: string) => (placement.boundary.includes(id) ? 0 : placement.dropped.includes(id) ? 2 : 1);
    return rank(a.id) - rank(b.id) || a.id.localeCompare(b.id);
  });
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/40">
          <tr className="text-left text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
            <th className="px-3 py-2">Marker</th>
            <th className="px-3 py-2 text-right">Floor x (m)</th>
            <th className="px-3 py-2 text-right">Floor y (m)</th>
            <th className="px-3 py-2 text-right">Fit error</th>
            <th className="px-3 py-2">In this map</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((m) => {
            const onBoundary = placement.boundary.includes(m.id);
            const dropped = placement.dropped.includes(m.id);
            return (
              <tr key={m.id} className={cn(dropped && "text-muted-foreground")}>
                <td className="px-3 py-2 font-mono font-semibold text-foreground">{m.id}</td>
                <td className="px-3 py-2 text-right font-mono">{m.x.toFixed(3)}</td>
                <td className="px-3 py-2 text-right font-mono">{m.y.toFixed(3)}</td>
                <td className={cn("px-3 py-2 text-right font-mono", dropped && "text-sev-critical")}>
                  {placement.errors[m.id].toFixed(1)} cm
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
  );
}

/* ── Screen ───────────────────────────────────────────────────────────── */

type CameraState = "offline" | "saved" | "unsaved" | "empty";

const STATE_LABEL: Record<CameraState, { label: string; text: string }> = {
  offline: { label: "offline", text: "text-muted-foreground" },
  saved: { label: "zone saved", text: "text-success" },
  unsaved: { label: "placed · not saved", text: "text-warning" },
  empty: { label: "no zone yet", text: "text-muted-foreground" },
};

export function ReidCalibrationScreen({
  model,
  siteName,
  cameras,
  onBack,
  onConfirm,
}: {
  model: ModelData;
  siteName: string;
  cameras: CameraData[];
  onBack: () => void;
  onConfirm: (zones: Record<string, BoundaryZone[]>) => void;
}) {
  const [cameraId, setCameraId] = React.useState(
    () => cameras.find((c) => c.status === "online")?.id ?? cameras[0]?.id ?? ""
  );
  /** The latest auto-place run per camera — what the frame shows. */
  const [placements, setPlacements] = React.useState<Record<string, Placement>>({});
  /** Zones the operator has confirmed — what deploys. */
  const [saved, setSaved] = React.useState<Record<string, Placement>>({});
  const [placingId, setPlacingId] = React.useState<string | null>(null);
  const [mapOpen, setMapOpen] = React.useState(false);
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
  const canConfirmZone = !!placement && placement.verdict !== "poor" && !currentSaved && !placingId;

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

  function confirmZone() {
    if (!camera || !placement) return;
    const nextSaved = { ...saved, [camera.id]: placement };
    setSaved(nextSaved);

    // Move on to the next online camera — after this one, wrapping — that has no saved zone.
    const start = calibratable.findIndex((c) => c.id === camera.id);
    const ordered = [...calibratable.slice(start + 1), ...calibratable.slice(0, start)];
    const next = ordered.find((c) => !nextSaved[c.id]);
    if (next) setCameraId(next.id);

    const done = calibratable.filter((c) => nextSaved[c.id]).length;
    toast.success(`Zone saved for ${camera.name}`, {
      description: next
        ? `${placement.used.length} markers · RMSE ${placement.rmse.toFixed(1)} cm. Next: ${next.name} (${done} of ${calibratable.length} done).`
        : `${placement.used.length} markers · RMSE ${placement.rmse.toFixed(1)} cm. All ${calibratable.length} cameras have zones — Deploy is ready.`,
    });
  }

  function deploy() {
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
    });
    setMapOpen(false);
    onConfirm(zones);
  }

  if (!camera) return null;
  const v = placement ? VERDICT[placement.verdict] : null;
  const usedByCamera = Object.fromEntries(savedCameras.map((c) => [c.id, saved[c.id].used]));

  return (
    <div className="flex flex-col gap-4">
      {/* Title + Deploy */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Button variant="outline" size="icon" onClick={onBack} aria-label="Back to deployment selection" className="mt-0.5 size-8">
            <ArrowLeft className="size-4" />
          </Button>
          <PageHeader.Content>
            <PageHeader.Title>Calibrate cameras</PageHeader.Title>
            <PageHeader.Description>
              {model.name} · {siteName} — auto-place the markers on each camera and confirm its zone. Deploy once
              every camera has one.
            </PageHeader.Description>
          </PageHeader.Content>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {savedCameras.length} of {calibratable.length} zone{calibratable.length === 1 ? "" : "s"} saved
          </span>
          <Button onClick={() => setMapOpen(true)} disabled={!canDeploy} className="gap-1.5">
            <Rocket className="size-4" /> Deploy
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
          <span className="text-sm font-semibold text-foreground">Camera</span>
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
          <span className="font-mono text-2xs text-muted-foreground">
            {camera.id} · {markers.length} markers in view
          </span>

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={runAutoPlace}
              disabled={offline || !!placingId}
              className="gap-1.5 border-primary/50 bg-primary/10 text-primary hover:border-primary hover:bg-primary/20 hover:text-primary"
            >
              {placingId === camera.id ? <LoaderCircle className="size-3.5 animate-spin" /> : <Wand2 className="size-3.5" />}
              {placement ? "Re-run Auto-Place All" : "Auto-Place All"}
            </Button>
            <Button size="sm" onClick={confirmZone} disabled={!canConfirmZone} className="gap-1.5">
              <Check className="size-3.5" /> {currentSaved ? "Zone saved" : "Confirm zone"}
            </Button>
          </div>
        </div>

        {/* Viewport */}
        <div className="bg-neutral-950 p-3">
          {offline ? (
            <div className="flex aspect-video flex-col items-center justify-center gap-2 text-neutral-400">
              <VideoOff className="size-6" />
              <p className="text-sm">{camera.name} is offline — it calibrates when it reconnects.</p>
            </div>
          ) : (
            <CameraFrame camera={camera} markers={markers} placement={placement} placing={placingId === camera.id} />
          )}
        </div>

        {/* Result + intersected markers */}
        <div className="space-y-3 px-4 py-4">
          {offline ? null : !placement ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <ScanLine className="size-4" />
              {markers.length} markers in view. Press Auto-Place All to fit them to the floor and draw the zone.
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
                  {placement.verdict === "poor"
                    ? " · re-run to get a usable zone"
                    : currentSaved
                      ? " · saved"
                      : saved[camera.id]
                        ? " · a saved zone exists — confirm to replace it"
                        : ""}
                </span>
              </div>

              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <CircleCheck className="size-3.5" />
                  Markers intersected · {placement.boundary.length} on the boundary, {placement.used.length - placement.boundary.length} inside, {placement.dropped.length} dropped
                </p>
                <MarkerTable markers={markers} placement={placement} />
              </div>
            </>
          )}
          {cameras.length > calibratable.length && (
            <p className="text-xs text-muted-foreground">
              {cameras.length - calibratable.length} offline camera{cameras.length - calibratable.length === 1 ? "" : "s"} will
              calibrate on reconnect and aren't needed to deploy.
            </p>
          )}
        </div>
      </div>

      <ReidSiteMapModal
        open={mapOpen}
        siteName={siteName}
        cameras={savedCameras}
        usedByCamera={usedByCamera}
        onClose={() => setMapOpen(false)}
        onConfirm={deploy}
      />
    </div>
  );
}
