import * as React from "react";
import { toast } from "sonner";
import { AlertTriangle, ChevronDown, Download, FileJson, ImageDown, LoaderCircle, Map as MapIcon, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@/components/shared/Modal";
import { cn } from "@/lib/utils";
import type { CameraData } from "@/types/cameras";
import { LINK_MARKERS, SITE_MARKERS, cameraPose, floorZone, mapGroups } from "./calibrationGeometry";
import { exportMapJson, exportMapPng, mapFileName } from "./mapExport";
import { mapLabel, type ReidMap } from "./reidMaps";

/* Re-ID deployment — site map review.

   Every camera's saved zone drawn on one floor plan, in metres from the site
   origin. Cameras that share at least LINK_MARKERS markers land in the same
   map frame and take the same colour; a camera in a group of its own is
   flagged, since Re-ID can't hand a person between frames that don't link. */

const GROUP_TONES = [
  { fill: "fill-primary/25", stroke: "stroke-primary", swatch: "bg-primary", text: "fill-primary" },
  { fill: "fill-info/25", stroke: "stroke-info", swatch: "bg-info", text: "fill-info" },
  { fill: "fill-purple/25", stroke: "stroke-purple", swatch: "bg-purple", text: "fill-purple" },
  { fill: "fill-success/25", stroke: "stroke-success", swatch: "bg-success", text: "fill-success" },
];

/** Map drawing size (viewBox px) and metres → px scale. */
const W = 1000;
const H = 720;
const PAD = 70;

type PositionsByCamera = Record<string, Record<string, { x: number; y: number }>>;

export function SiteMapCanvas({
  cameras,
  usedByCamera,
  positionsByCamera,
  className,
}: {
  cameras: CameraData[];
  usedByCamera: Record<string, string[]>;
  positionsByCamera?: PositionsByCamera;
  /** Caps the drawing's height where it shares the screen with other content. */
  className?: string;
}) {
  const groups = mapGroups(usedByCamera);
  const groupOf = (id: string) => groups.findIndex((g) => g.includes(id));

  // Fit every marker and camera into the drawing, y up.
  const poses = cameras.map((c) => ({ camera: c, pose: cameraPose(c.id) }));
  const xs = [...SITE_MARKERS.map((m) => m.x), ...poses.map((p) => p.pose.x), 0];
  const ys = [...SITE_MARKERS.map((m) => m.y), ...poses.map((p) => p.pose.y), 0];
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const scale = Math.min((W - PAD * 2) / (maxX - minX), (H - PAD * 2) / (maxY - minY));
  const offX = (W - (maxX - minX) * scale) / 2;
  const offY = (H - (maxY - minY) * scale) / 2;
  const px = (x: number) => offX + (x - minX) * scale;
  const py = (y: number) => H - (offY + (y - minY) * scale);

  const used = new Set(Object.values(usedByCamera).flat());
  const gridStart = Math.ceil(minX);
  const gridRows = Math.ceil(minY);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Site map with every camera's zone" className={cn("mx-auto block h-auto max-h-[58vh] w-full", className)}>
      <rect width={W} height={H} className="fill-neutral-900" />

      {/* 1 m grid */}
      <g className="stroke-neutral-800" strokeWidth={1}>
        {Array.from({ length: Math.floor(maxX) - gridStart + 1 }, (_, i) => gridStart + i).map((x) => (
          <line key={`gx${x}`} x1={px(x)} y1={0} x2={px(x)} y2={H} />
        ))}
        {Array.from({ length: Math.floor(maxY) - gridRows + 1 }, (_, i) => gridRows + i).map((y) => (
          <line key={`gy${y}`} x1={0} y1={py(y)} x2={W} y2={py(y)} />
        ))}
      </g>

      {/* Zones */}
      {cameras.map((c) => {
        const outline = floorZone(usedByCamera[c.id] ?? [], positionsByCamera?.[c.id]);
        if (outline.length < 3) return null;
        const tone = GROUP_TONES[groupOf(c.id) % GROUP_TONES.length];
        return (
          <polygon
            key={c.id}
            points={outline.map((m) => `${px(m.x)},${py(m.y)}`).join(" ")}
            strokeWidth={2.5}
            strokeLinejoin="round"
            className={cn(tone.fill, tone.stroke)}
          />
        );
      })}

      {/* Markers — used ones bright, the rest faint */}
      {SITE_MARKERS.map((m) => (
        <g key={m.id} className={used.has(m.id) ? "stroke-neutral-100" : "stroke-neutral-600"} strokeWidth={2}>
          <line x1={px(m.x) - 6} y1={py(m.y)} x2={px(m.x) + 6} y2={py(m.y)} />
          <line x1={px(m.x)} y1={py(m.y) - 6} x2={px(m.x)} y2={py(m.y) + 6} />
          <text
            x={px(m.x) + 8}
            y={py(m.y) - 8}
            fontSize={13}
            stroke="none"
            className={cn("font-mono", used.has(m.id) ? "fill-neutral-200" : "fill-neutral-600")}
          >
            {m.id}
          </text>
        </g>
      ))}

      {/* Zone labels on top of the markers */}
      {cameras.map((c) => {
        const outline = floorZone(usedByCamera[c.id] ?? [], positionsByCamera?.[c.id]);
        if (outline.length < 3) return null;
        const cx = outline.reduce((s, m) => s + m.x, 0) / outline.length;
        const cy = outline.reduce((s, m) => s + m.y, 0) / outline.length;
        return (
          <text key={c.id} x={px(cx)} y={py(cy)} textAnchor="middle" dominantBaseline="middle" fontSize={24} fontWeight={800} className="fill-neutral-50 font-mono">
            {c.id.replace("Cam-", "C")}
          </text>
        );
      })}

      {/* Camera positions, pointing the way they look */}
      {poses.map(({ camera, pose }) => {
        const x = px(pose.x);
        const y = py(pose.y);
        const ang = (Math.atan2(-pose.dy, pose.dx) * 180) / Math.PI;
        const tone = GROUP_TONES[Math.max(0, groupOf(camera.id)) % GROUP_TONES.length];
        return (
          <g key={camera.id}>
            <path d="M -9 -7 L 11 0 L -9 7 Z" transform={`translate(${x} ${y}) rotate(${ang})`} className={cn(tone.text)} />
            <text x={x} y={y + 22} textAnchor="middle" fontSize={12} className="fill-neutral-400 font-mono">
              {camera.id}
            </text>
          </g>
        );
      })}

      {/* Site origin — x east, y north */}
      <g strokeWidth={3} strokeLinecap="round">
        <line x1={px(0)} y1={py(0)} x2={px(0) + 46} y2={py(0)} className="stroke-primary" />
        <path d={`M ${px(0) + 46} ${py(0) - 6} L ${px(0) + 56} ${py(0)} L ${px(0) + 46} ${py(0) + 6}`} fill="none" className="stroke-primary" />
        <line x1={px(0)} y1={py(0)} x2={px(0)} y2={py(0) - 46} className="stroke-info" />
        <path d={`M ${px(0) - 6} ${py(0) - 46} L ${px(0)} ${py(0) - 56} L ${px(0) + 6} ${py(0) - 46}`} fill="none" className="stroke-info" />
        <circle cx={px(0)} cy={py(0)} r={4} className="fill-neutral-100" stroke="none" />
      </g>
    </svg>
  );
}

export function ReidSiteMapModal({
  open,
  siteName,
  cameras,
  usedByCamera,
  positionsByCamera,
  mode = "review",
  onClose,
  onConfirm,
}: {
  open: boolean;
  siteName: string;
  /** Cameras with a saved zone. */
  cameras: CameraData[];
  usedByCamera: Record<string, string[]>;
  /** Hand-corrected marker positions from calibration edits. */
  positionsByCamera?: PositionsByCamera;
  /** "review" is the last step before deploying; "view" is a look at the calibrations saved so far. */
  mode?: "review" | "view";
  onClose: () => void;
  onConfirm?: () => void;
}) {
  const groups = mapGroups(usedByCamera);
  const markerCount = new Set(Object.values(usedByCamera).flat()).size;
  const unlinked = groups.length > 1;

  return (
    <Modal open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent size="xl">
        <ModalHeader
          icon={MapIcon}
          title={mode === "review" ? "Review site map" : "Site map"}
          description={
            mode === "review"
              ? `${siteName} · every camera's zone on one floor plan, in metres from the site origin.`
              : `${siteName} · the ${cameras.length} calibrated camera${cameras.length === 1 ? "" : "s"} so far, in metres from the site origin.`
          }
        />
        <ModalBody className="space-y-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
            {groups.map((g, i) => (
              <span key={g.join()} className="flex items-center gap-1.5">
                <span className={cn("size-2.5 rounded-sm", GROUP_TONES[i % GROUP_TONES.length].swatch)} />
                <span className="font-semibold text-foreground">Group {i + 1}:</span>
                <span className="font-mono">{g.join(", ")}</span>
              </span>
            ))}
            <span className="ml-auto">
              {cameras.length} camera{cameras.length === 1 ? "" : "s"} · {markerCount} markers · one colour per linked
              frame (≥ {LINK_MARKERS} shared markers)
            </span>
          </div>

          <div className="overflow-hidden rounded-lg border border-border bg-neutral-900">
            <SiteMapCanvas
              cameras={cameras}
              usedByCamera={usedByCamera}
              positionsByCamera={positionsByCamera}
              className="max-h-[50vh]"
            />
          </div>

          {unlinked && (
            <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/[0.06] px-3 py-2 text-xs text-muted-foreground">
              <AlertTriangle className="mt-px size-3.5 flex-shrink-0 text-warning" />
              <span>
                The zones form {groups.length} separate frames — some cameras share fewer than {LINK_MARKERS} markers
                with the rest. Re-ID can't follow a person between frames that don't link; you can deploy anyway, or
                go back and re-calibrate those cameras.
              </span>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          {mode === "review" ? (
            <>
              <Button variant="ghost" size="sm" onClick={onClose}>
                Back to calibration
              </Button>
              <Button size="sm" onClick={onConfirm} className="gap-1.5">
                <Rocket className="size-3.5" />
                Confirm & deploy
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/* ── Calibrated map card — Model Deployment history ───────────────────── */

/** One deployed Re-ID map: the floor plan, its linked groups, and exports of the calibration. */
export function ReidZoneMapCard({ map, cameras }: { map: ReidMap; cameras: CameraData[] }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = React.useState(false);
  const mapCameras = map.cameraIds
    .map((id) => cameras.find((c) => c.id === id))
    .filter((c): c is CameraData => !!c);
  const groups = mapGroups(map.used);
  const markerCount = new Set(Object.values(map.used).flat()).size;

  async function exportPng() {
    const svg = ref.current?.querySelector("svg");
    if (!svg) return;
    setExporting(true);
    try {
      await exportMapPng(svg, map);
      toast.success("Map exported", { description: `${mapFileName(map, "png")} saved to your downloads.` });
    } catch (e) {
      toast.error("Couldn't export the map", { description: e instanceof Error ? e.message : undefined });
    } finally {
      setExporting(false);
    }
  }

  function exportJson() {
    exportMapJson(map, cameras);
    toast.success("Calibration exported", { description: `${mapFileName(map, "json")} saved to your downloads.` });
  }

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-md font-semibold text-foreground">
            <MapIcon className="size-4 text-primary" />
            {mapLabel(map)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {map.cameraIds.length} camera{map.cameraIds.length === 1 ? "" : "s"} · {markerCount} markers ·{" "}
            {groups.length === 1 ? "one linked frame" : `${groups.length} separate frames`}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5" disabled={exporting}>
              {exporting ? <LoaderCircle className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
              Export
              <ChevronDown className="size-3.5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onSelect={exportJson} className="gap-2">
              <FileJson className="size-4" />
              <span className="flex flex-col">
                <span>Calibration (.json)</span>
                <span className="text-2xs text-muted-foreground">Poses, markers and zones</span>
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => void exportPng()} className="gap-2">
              <ImageDown className="size-4" />
              <span className="flex flex-col">
                <span>Map image (.png)</span>
                <span className="text-2xs text-muted-foreground">The floor plan as drawn here</span>
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div ref={ref} className="bg-neutral-900">
        <SiteMapCanvas cameras={mapCameras} usedByCamera={map.used} positionsByCamera={map.positions} />
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
        {groups.map((g, i) => (
          <span key={g.join()} className="flex items-center gap-1.5">
            <span className={cn("size-2.5 rounded-sm", GROUP_TONES[i % GROUP_TONES.length].swatch)} />
            <span className="font-semibold text-foreground">Group {i + 1}:</span>
            <span className="font-mono">{g.join(", ")}</span>
          </span>
        ))}
        <span className="ml-auto">Each colour is one linked frame (≥ {LINK_MARKERS} shared markers)</span>
      </div>
    </section>
  );
}
