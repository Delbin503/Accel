import * as React from "react";
import { toast } from "sonner";
import {
  MapPin,
  Edit3,
  Trash2,
  Plus,
  UploadCloud,
  Image as ImageIcon,
  Shapes,
  Video,
  Check,
  X,
  Pencil,
  RotateCw,
  MousePointer2,
  Eye,
  EyeOff,
  Save,
  Wifi,
  WifiOff,
  Clock,
  Building2,
  Calendar,
  CircleDot,
  HardDrive,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useSitesStore } from "@/stores/useSitesStore";
import { useCamerasStore } from "@/stores/useCamerasStore";
import { AREA_PALETTE, generatedFloorPlan } from "@/mocks/sites";
import type { AreaShape, SiteData } from "@/types/sites";
import type { CameraData, CameraStatus } from "@/types/cameras";

type Tool = "select" | "draw-area";
type Tab = "overview" | "floor-plan";

const STATUS_STYLES = {
  active:   { bg: "bg-success/15 border-success/30",        text: "text-success",          dot: "bg-success",          label: "Active"   },
  setup:    { bg: "bg-warning/15 border-warning/30",        text: "text-warning",          dot: "bg-warning",          label: "Setup"    },
  inactive: { bg: "bg-muted border-border",                 text: "text-muted-foreground", dot: "bg-muted-foreground", label: "Inactive" },
};

const CAMERA_STATUS_STYLES: Record<CameraStatus, { bg: string; text: string; dot: string; label: string; icon: React.ElementType; markerFill: string }> = {
  online:              { bg: "bg-success/15 border-success/30",            text: "text-success",          dot: "bg-success",          label: "Online",  icon: Wifi,    markerFill: "#22C55E" },
  offline:             { bg: "bg-muted border-border",                     text: "text-muted-foreground", dot: "bg-muted-foreground", label: "Offline", icon: WifiOff, markerFill: "#9CA3AF" },
  "connection-failed": { bg: "bg-sev-critical/15 border-sev-critical/30",  text: "text-sev-critical",     dot: "bg-sev-critical",     label: "Failed",  icon: WifiOff, markerFill: "#E15554" },
  pending:             { bg: "bg-warning/15 border-warning/30",            text: "text-warning",          dot: "bg-warning",          label: "Pending", icon: Clock,   markerFill: "#FEAA01" },
};

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

/* ── Camera marker ───────────────────────────────────────────────────── */

/**
 * Lucide Video icon — pre-extracted from lucide-react's source so we can inline
 * it inside an SVG without nesting React component trees. The viewBox is 0 0 24 24.
 */
function CameraMarker({
  cx, cy, rotation, color, isSelected, scale = 1,
}: {
  cx: number; cy: number; rotation: number; color: string; isSelected: boolean; scale?: number;
}) {
  // Render at native 24x24 then scale & translate.
  const size = 4.6 * scale; // SVG units (relative to viewBox 100)
  return (
    <g transform={`translate(${cx} ${cy})`}>
      {/* Pulsing ring for selected/online */}
      {isSelected && (
        <circle cx={0} cy={0} r={size * 0.9} fill="none" stroke="#DD7224" strokeWidth={0.4} strokeDasharray="0.8 0.6">
          <animate attributeName="r" values={`${size * 0.85};${size * 1.05};${size * 0.85}`} dur="2s" repeatCount="indefinite" />
        </circle>
      )}
      {/* Camera body — rotates with the camera's facing direction */}
      <g transform={`rotate(${rotation})`}>
        {/* Field of view cone */}
        <path
          d={`M ${-size * 1.1} ${-size * 0.4} L 0 ${-size * 2.4} L ${size * 1.1} ${-size * 0.4} Z`}
          fill={color}
          fillOpacity={0.18}
          stroke={color}
          strokeOpacity={0.55}
          strokeWidth={0.2}
        />
        {/* Background plate */}
        <circle r={size * 0.78} fill="#0f1115" stroke={color} strokeWidth={0.45} />
        {/* Lucide-style Video icon paths, centered on origin. Scaled to fit. */}
        <g transform={`scale(${size / 16}) translate(-8 -8)`}>
          {/* M 16 10 a 1 1 0 0 1 1 1 v 2 a 1 1 0 0 1 -1 1 H 2 V 10 z plus camera lens */}
          <rect x={1.2} y={4.8} width={9.4} height={6.4} rx={1.2} fill={color} stroke="#fff" strokeWidth={0.4} />
          <path d={`M ${10.6} ${6.6} L ${14.8} ${4.6} L ${14.8} ${11.4} L ${10.6} ${9.4} Z`} fill={color} stroke="#fff" strokeWidth={0.4} />
          <circle cx={5.9} cy={8} r={1.1} fill="#0f1115" stroke="#fff" strokeWidth={0.3} />
        </g>
      </g>
    </g>
  );
}

/* ── Rotation handle overlay ─────────────────────────────────────────── */

function RotationHandle({ cx, cy, rotation, onChange }: { cx: number; cy: number; rotation: number; onChange: (deg: number) => void }) {
  const handleRef = React.useRef<SVGCircleElement | null>(null);
  const radius = 8;
  const rad = (rotation - 90) * Math.PI / 180;
  const hx = cx + Math.cos(rad) * radius;
  const hy = cy + Math.sin(rad) * radius;

  function onMouseDown(e: React.MouseEvent) {
    e.stopPropagation();
    const svg = (handleRef.current?.ownerSVGElement) as SVGSVGElement | null;
    if (!svg) return;
    function onMove(ev: MouseEvent) {
      const rect = svg!.getBoundingClientRect();
      const x = ((ev.clientX - rect.left) / rect.width) * 100;
      const y = ((ev.clientY - rect.top) / rect.height) * 100;
      const dx = x - cx;
      const dy = y - cy;
      const deg = Math.round((Math.atan2(dy, dx) * 180 / Math.PI + 90 + 360)) % 360;
      // Snap to 5° increments for a precise feel.
      onChange(Math.round(deg / 5) * 5);
    }
    function onUp() {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  return (
    <g pointerEvents="all">
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#DD7224" strokeOpacity={0.35} strokeWidth={0.3} strokeDasharray="0.6 0.6" />
      <line x1={cx} y1={cy} x2={hx} y2={hy} stroke="#DD7224" strokeWidth={0.3} strokeOpacity={0.8} />
      <circle
        ref={handleRef}
        cx={hx} cy={hy} r={1.6}
        fill="#DD7224" stroke="#fff" strokeWidth={0.35}
        onMouseDown={onMouseDown}
        style={{ cursor: "grab" }}
      />
    </g>
  );
}

/* ── Floor Plan Canvas ───────────────────────────────────────────────── */

function FloorPlanCanvas({
  site, siteCameras, tool, drafting, onSetDrafting, selected, onSelect, onCommitArea,
  onMovePlacement, onRotatePlacement, showAreas, showCameras,
  onAreaEdit, onAreaDelete,
}: {
  site: SiteData;
  siteCameras: CameraData[];
  tool: Tool;
  drafting: { points: [number, number][]; color: string } | null;
  onSetDrafting: (d: { points: [number, number][]; color: string } | null) => void;
  selected: { type: "area" | "camera"; id: string } | null;
  onSelect: (sel: { type: "area" | "camera"; id: string } | null) => void;
  onCommitArea: (points: [number, number][], color: string) => void;
  onMovePlacement: (cameraId: string, x: number, y: number) => void;
  onRotatePlacement: (cameraId: string, deg: number) => void;
  showAreas: boolean;
  showCameras: boolean;
  onAreaEdit: (id: string) => void;
  onAreaDelete: (id: string) => void;
}) {
  const svgRef = React.useRef<SVGSVGElement | null>(null);
  const [hover, setHover] = React.useState<{ x: number; y: number } | null>(null);
  const [draggingCam, setDraggingCam] = React.useState<string | null>(null);
  const [areaMenu, setAreaMenu] = React.useState<{ id: string; x: number; y: number } | null>(null);

  function getNormalizedPoint(e: React.MouseEvent<SVGElement>): [number, number] {
    const svg = svgRef.current;
    if (!svg) return [0, 0];
    const rect = svg.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    return [Math.max(0, Math.min(1, x)), Math.max(0, Math.min(1, y))];
  }

  function handleSvgClick(e: React.MouseEvent<SVGElement>) {
    const [x, y] = getNormalizedPoint(e);
    if (tool === "draw-area") {
      const points = drafting?.points ?? [];
      const color = drafting?.color ?? AREA_PALETTE[site.areas.length % AREA_PALETTE.length];
      onSetDrafting({ points: [...points, [x, y]], color });
    } else {
      onSelect(null);
      setAreaMenu(null);
    }
  }

  function handleSvgDoubleClick() {
    if (tool === "draw-area" && drafting && drafting.points.length >= 3) {
      onCommitArea(drafting.points, drafting.color);
      onSetDrafting(null);
    }
  }

  function handleMouseMove(e: React.MouseEvent<SVGElement>) {
    if (tool === "draw-area") {
      const [x, y] = getNormalizedPoint(e);
      setHover({ x, y });
    } else {
      setHover(null);
    }
    if (draggingCam) {
      const [x, y] = getNormalizedPoint(e);
      onMovePlacement(draggingCam, x, y);
    }
  }

  const aspect = site.floorPlan ? site.floorPlan.width / site.floorPlan.height : 1.5;
  const selCam = selected?.type === "camera" ? siteCameras.find((c) => c.id === selected.id) : undefined;
  const selPlacement = selCam ? site.cameraPlacements[selCam.id] : undefined;

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-xl border-2 bg-neutral-950 select-none",
        tool === "draw-area" ? "border-primary cursor-crosshair" : "border-border cursor-default"
      )}
      style={{ aspectRatio: aspect }}
    >
      {site.floorPlan && (
        <img src={site.floorPlan.imageUrl ?? undefined} alt="" className="absolute inset-0 size-full object-contain opacity-80" draggable={false} />
      )}

      <svg
        ref={svgRef}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 size-full"
        onClick={handleSvgClick}
        onDoubleClick={handleSvgDoubleClick}
        onMouseMove={handleMouseMove}
        onMouseUp={() => setDraggingCam(null)}
        onMouseLeave={() => { setHover(null); setDraggingCam(null); }}
      >
        {/* Areas */}
        {showAreas && site.areas.filter((a) => a.points.length >= 3).map((a) => {
          const isSel = selected?.type === "area" && selected.id === a.id;
          const cx = a.points.reduce((s, p) => s + p[0], 0) / a.points.length * 100;
          const cy = a.points.reduce((s, p) => s + p[1], 0) / a.points.length * 100;
          return (
            <g key={a.id} style={{ cursor: tool === "select" ? "pointer" : "inherit" }}
              onClick={(e) => {
                if (tool === "select") {
                  e.stopPropagation();
                  onSelect({ type: "area", id: a.id });
                  setAreaMenu({ id: a.id, x: cx, y: cy });
                }
              }}>
              <polygon
                points={a.points.map(([x, y]) => `${x * 100},${y * 100}`).join(" ")}
                fill={a.color} fillOpacity={isSel ? 0.32 : 0.18}
                stroke={a.color} strokeOpacity={isSel ? 1 : 0.7} strokeWidth={isSel ? 0.6 : 0.35}
              />
              <text x={cx} y={cy}
                textAnchor="middle" dominantBaseline="middle"
                fill="rgba(255,255,255,0.95)" fontSize="2" fontWeight="700"
                pointerEvents="none"
              >
                {a.name}
              </text>
            </g>
          );
        })}

        {/* Inline area Edit / Delete bubble */}
        {areaMenu && (() => {
          const a = site.areas.find((x) => x.id === areaMenu.id);
          if (!a) return null;
          return (
            <g transform={`translate(${areaMenu.x},${areaMenu.y - 7})`} pointerEvents="all">
              <rect x={-8.5} y={-2.6} width={17} height={5} rx={1.2} fill="#0f1115" stroke={a.color} strokeOpacity={0.7} strokeWidth={0.3} />
              <g onClick={(e) => { e.stopPropagation(); onAreaEdit(a.id); setAreaMenu(null); }} style={{ cursor: "pointer" }}>
                <rect x={-8} y={-2.2} width={8} height={4.2} fill="transparent" />
                <text x={-4} y={0.7} fontSize="2.2" fill="#fff" textAnchor="middle" pointerEvents="none">Edit</text>
              </g>
              <line x1={0} y1={-2.2} x2={0} y2={2} stroke="#444" strokeWidth={0.2} pointerEvents="none" />
              <g onClick={(e) => { e.stopPropagation(); onAreaDelete(a.id); setAreaMenu(null); }} style={{ cursor: "pointer" }}>
                <rect x={0} y={-2.2} width={8} height={4.2} fill="transparent" />
                <text x={4} y={0.7} fontSize="2.2" fill="#E15554" textAnchor="middle" pointerEvents="none">Delete</text>
              </g>
            </g>
          );
        })()}

        {/* Drafting polygon */}
        {drafting && drafting.points.length > 0 && (
          <g>
            {drafting.points.length >= 2 && (
              <polyline
                points={drafting.points.map(([x, y]) => `${x * 100},${y * 100}`).join(" ")}
                fill="none" stroke={drafting.color} strokeOpacity={0.9} strokeWidth={0.45}
              />
            )}
            {drafting.points.length >= 3 && (
              <polygon
                points={drafting.points.map(([x, y]) => `${x * 100},${y * 100}`).join(" ")}
                fill={drafting.color} fillOpacity={0.16}
                stroke={drafting.color} strokeOpacity={0.9} strokeWidth={0.45}
                strokeDasharray="1.5 1.5"
              />
            )}
            {hover && (
              <line
                x1={drafting.points[drafting.points.length - 1][0] * 100}
                y1={drafting.points[drafting.points.length - 1][1] * 100}
                x2={hover.x * 100} y2={hover.y * 100}
                stroke={drafting.color} strokeOpacity={0.6} strokeWidth={0.35} strokeDasharray="1 1"
              />
            )}
            {drafting.points.map(([x, y], i) => (
              <circle key={i} cx={x * 100} cy={y * 100} r={0.7} fill={drafting.color} stroke="#fff" strokeWidth={0.2} />
            ))}
          </g>
        )}

        {/* Cameras */}
        {showCameras && siteCameras.map((c) => {
          const p = site.cameraPlacements[c.id];
          if (!p) return null;
          const isSel = selected?.type === "camera" && selected.id === c.id;
          const cs = CAMERA_STATUS_STYLES[c.status];
          return (
            <g key={c.id}
              style={{ cursor: tool === "select" ? "grab" : "inherit" }}
              onClick={(e) => { if (tool === "select") { e.stopPropagation(); onSelect({ type: "camera", id: c.id }); setAreaMenu(null); } }}
              onMouseDown={(e) => { if (tool === "select") { e.stopPropagation(); setDraggingCam(c.id); onSelect({ type: "camera", id: c.id }); } }}
            >
              <CameraMarker
                cx={p.x * 100} cy={p.y * 100}
                rotation={p.rotation}
                color={cs.markerFill}
                isSelected={isSel}
                scale={isSel ? 1.25 : 1}
              />
            </g>
          );
        })}

        {/* Rotation handle for selected camera */}
        {selCam && selPlacement && (
          <RotationHandle
            cx={selPlacement.x * 100}
            cy={selPlacement.y * 100}
            rotation={selPlacement.rotation}
            onChange={(deg) => onRotatePlacement(selCam.id, deg)}
          />
        )}
      </svg>

      <div className="pointer-events-none absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-md bg-black/65 px-2 py-1 text-[10px] font-semibold text-white/90 backdrop-blur-sm">
        {tool === "draw-area" && <><Shapes className="size-3" /> Click to add points · Double-click to close shape</>}
        {tool === "select"    && <><MousePointer2 className="size-3" /> Click an area for Edit/Delete · Drag cameras · Rotate via the orange handle</>}
      </div>
    </div>
  );
}

/* ── Empty floor plan ────────────────────────────────────────────────── */

function FloorPlanEmpty({ onUpload, onUseSample }: { onUpload: (url: string, name: string) => void; onUseSample: () => void }) {
  const fileRef = React.useRef<HTMLInputElement | null>(null);
  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { if (typeof reader.result === "string") onUpload(reader.result, file.name); };
    reader.readAsDataURL(file);
    e.target.value = "";
  }
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-card py-16">
      <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
        <UploadCloud className="size-6 text-primary" />
      </div>
      <h3 className="text-[15px] font-bold text-foreground">Upload a Floor Plan</h3>
      <p className="max-w-md text-center text-[12px] text-muted-foreground">
        Upload a plan to draw area polygons and place cameras directly on it.
      </p>
      <div className="mt-2 flex items-center gap-2">
        <Button onClick={() => fileRef.current?.click()} className="gap-1.5">
          <UploadCloud className="size-3.5" />
          Upload
        </Button>
        <Button variant="outline" onClick={onUseSample} className="gap-1.5">
          <ImageIcon className="size-3.5" />
          Use Sample
        </Button>
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/svg+xml" className="hidden" onChange={handleFile} />
      </div>
    </div>
  );
}

/* ── Edit / Delete modals ────────────────────────────────────────────── */

function EditAreaModal({ area, open, onClose, onSave }: { area: AreaShape | null; open: boolean; onClose: () => void; onSave: (patch: Partial<AreaShape>) => void }) {
  const [name, setName] = React.useState("");
  const [color, setColor] = React.useState(AREA_PALETTE[0]);
  React.useEffect(() => { if (open && area) { setName(area.name); setColor(area.color); } }, [open, area]);
  if (!area) return null;
  const dirty = name !== area.name || color !== area.color;
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[85vh] w-[560px] max-w-[95vw] p-0">
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle className="text-base font-bold">Edit Area</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 px-5 py-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Area Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9 text-[13px]" />
          </div>
          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Color</p>
            <div className="flex flex-wrap gap-1.5">
              {AREA_PALETTE.map((c) => (
                <button key={c} onClick={() => setColor(c)}
                  className={cn("relative size-7 rounded-md border-2 transition-colors",
                    color === c ? "border-foreground" : "border-transparent hover:border-foreground/30")}
                  style={{ background: c }}>
                  {color === c && <Check className="absolute inset-0 m-auto size-3.5 text-white drop-shadow" strokeWidth={3} />}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-3.5">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button disabled={!dirty || !name.trim()} onClick={() => onSave({ name: name.trim(), color })} className="gap-1.5">
            <Save className="size-3.5" />
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditSiteModal({ site, open, onClose, onSave }: { site: SiteData | null; open: boolean; onClose: () => void; onSave: (patch: Partial<SiteData>) => void }) {
  const [name, setName] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [timezone, setTimezone] = React.useState("Asia/Singapore");
  React.useEffect(() => {
    if (open && site) { setName(site.name); setAddress(site.address); setDescription(site.description ?? ""); setTimezone(site.timezone); }
  }, [open, site]);
  if (!site) return null;
  const dirty = name !== site.name || address !== site.address || description !== (site.description ?? "") || timezone !== site.timezone;
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[85vh] w-[560px] max-w-[95vw] p-0">
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle className="text-base font-bold">Edit Site</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 px-5 py-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Site Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9 text-[13px]" />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Address</label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} className="h-9 text-[13px]" />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Timezone</label>
            <Input value={timezone} onChange={(e) => setTimezone(e.target.value)} className="h-9 text-[13px]" />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-[13px] text-foreground focus:border-primary focus:outline-none" />
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-3.5">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button disabled={!dirty || !name.trim()}
            onClick={() => onSave({ name: name.trim(), address: address.trim(), description: description.trim() || undefined, timezone })}
            className="gap-1.5">
            <Save className="size-3.5" />
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DeleteSiteModal({ site, open, onClose, onConfirm }: { site: SiteData | null; open: boolean; onClose: () => void; onConfirm: () => void }) {
  const [confirm, setConfirm] = React.useState("");
  React.useEffect(() => { if (open) setConfirm(""); }, [open]);
  if (!site) return null;
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[85vh] w-[560px] max-w-[95vw] p-0">
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle className="text-base font-bold text-sev-critical">Delete {site.name}?</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 px-5 py-4">
          <p className="text-[12px] text-muted-foreground">
            This will permanently remove the site, its <strong className="text-foreground">{site.areas.length}</strong> area{site.areas.length === 1 ? "" : "s"} and floor plan.
            Cameras assigned to this site will remain in the Cameras module but will be unassigned.
          </p>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Type <span className="font-mono text-foreground">{site.name}</span> to confirm
            </label>
            <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} className="h-9 text-[13px]" />
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-3.5">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button disabled={confirm !== site.name}
            onClick={onConfirm}
            className="gap-1.5 border-sev-critical/40 bg-sev-critical/15 text-sev-critical hover:bg-sev-critical/25">
            <Trash2 className="size-3.5" />
            Delete Site
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Drawer ──────────────────────────────────────────────────────────── */

export function SiteDetailDrawer({ siteId, open, onClose }: { siteId: string | null; open: boolean; onClose: () => void }) {
  const {
    sites, setFloorPlan, addArea, updateArea, deleteArea,
    placeCamera, updatePlacement, removePlacement, updateSite, deleteSite,
  } = useSitesStore();
  const cameras = useCamerasStore((s) => s.cameras);
  const site = siteId ? sites.find((s) => s.id === siteId) ?? null : null;

  const [tab, setTab] = React.useState<Tab>("overview");
  const [tool, setTool] = React.useState<Tool>("select");
  const [drafting, setDrafting] = React.useState<{ points: [number, number][]; color: string } | null>(null);
  const [selected, setSelected] = React.useState<{ type: "area" | "camera"; id: string } | null>(null);
  const [showAreas, setShowAreas] = React.useState(true);
  const [showCameras, setShowCameras] = React.useState(true);
  const [editAreaTarget, setEditAreaTarget] = React.useState<AreaShape | null>(null);
  const [editSiteOpen, setEditSiteOpen] = React.useState(false);
  const [deleteSiteOpen, setDeleteSiteOpen] = React.useState(false);
  const [pendingCameraId, setPendingCameraId] = React.useState<string | null>(null);
  const [renamingId, setRenamingId] = React.useState<string | null>(null);
  const [renameValue, setRenameValue] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setTab("overview");
      setTool("select");
      setDrafting(null);
      setSelected(null);
      setPendingCameraId(null);
    }
  }, [open, siteId]);

  React.useEffect(() => {
    if (tool !== "draw-area") setDrafting(null);
  }, [tool]);

  React.useEffect(() => {
    // When a pending camera is set, auto-drop near the centre of the canvas.
    if (!pendingCameraId || !site || !site.floorPlan) return;
    const camId = pendingCameraId;
    const sid = site.id;
    const t = setTimeout(() => {
      placeCamera(sid, camId, { x: 0.5, y: 0.5, rotation: 0 });
      setSelected({ type: "camera", id: camId });
      setPendingCameraId(null);
      toast.success("Camera placed", { description: "Drag the icon to position · rotate via the orange handle." });
    }, 50);
    return () => clearTimeout(t);
  }, [pendingCameraId, site, placeCamera]);

  if (!site) return null;
  const s = STATUS_STYLES[site.status];
  const siteCameras = cameras.filter((c) => c.siteId === site.id);
  const onlineCount = siteCameras.filter((c) => c.status === "online").length;
  const placedCount = Object.keys(site.cameraPlacements).filter((cid) => siteCameras.some((c) => c.id === cid)).length;

  function commitArea(points: [number, number][], color: string) {
    if (selected?.type === "area" && site!.areas.find((a) => a.id === selected.id && a.points.length === 0)) {
      updateArea(site!.id, selected.id, { points, color });
      toast.success("Area shape saved");
      setSelected(null);
    } else {
      const id = uid("area");
      addArea(site!.id, { id, name: `Area ${site!.areas.length + 1}`, color, points });
      setSelected({ type: "area", id });
      setRenamingId(id);
      setRenameValue(`Area ${site!.areas.length + 1}`);
    }
    setTool("select");
  }

  function handleFloorPlanUpload(url: string, name: string) {
    setFloorPlan(site!.id, { imageUrl: url, label: name.replace(/\.[^.]+$/, ""), width: 1200, height: 800 });
    if (site!.status === "setup") updateSite(site!.id, { status: "active" });
    toast.success("Floor plan uploaded");
  }
  function handleSampleFloorPlan() {
    setFloorPlan(site!.id, { imageUrl: generatedFloorPlan(), label: "Sample Blueprint", width: 1200, height: 800 });
    if (site!.status === "setup") updateSite(site!.id, { status: "active" });
    toast.success("Sample floor plan applied");
  }

  function startNewArea() {
    setTab("floor-plan");
    setTool("draw-area");
    setDrafting({ points: [], color: AREA_PALETTE[site!.areas.length % AREA_PALETTE.length] });
    toast.message("Drawing mode", { description: "Click points on the floor plan · double-click to close." });
  }

  function startPlaceCamera(cameraId: string) {
    if (!site!.floorPlan) { toast.error("Upload a floor plan first"); return; }
    setPendingCameraId(cameraId);
    setTab("floor-plan");
  }

  function selectArea(id: string) {
    setSelected({ type: "area", id });
    const a = site!.areas.find((x) => x.id === id);
    if (a && a.points.length === 0 && site!.floorPlan) {
      setTab("floor-plan");
      setTool("draw-area");
      setDrafting({ points: [], color: a.color });
      toast.message(`Draw the shape for "${a.name}"`, { description: "Click to add points · double-click to close." });
    }
  }

  function startRename(area: AreaShape) {
    setRenamingId(area.id);
    setRenameValue(area.name);
  }
  function commitRename() {
    if (renamingId && renameValue.trim()) {
      updateArea(site!.id, renamingId, { name: renameValue.trim() });
    }
    setRenamingId(null);
    setRenameValue("");
  }

  function confirmDeleteSite() {
    setDeleteSiteOpen(false);
    deleteSite(site!.id);
    onClose();
    toast.success(`${site!.name} deleted`);
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview",   label: "Overview" },
    { key: "floor-plan", label: "Floor Plan" },
  ];

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" showCloseButton={false} className="flex w-[min(1100px,80vw)] max-w-[95vw] flex-col gap-0 p-0">
        <SheetHeader className="border-b border-border bg-card px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <SheetTitle className="truncate text-[17px] font-bold">{site.name}</SheetTitle>
                <span className={cn("inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider", s.bg, s.text)}>
                  <span className={cn("size-1.5 rounded-full", s.dot, site.status === "active" && "animate-pulse")} />
                  {s.label}
                </span>
              </div>
              <p className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground">
                <MapPin className="size-3" />
                {site.address || "No address yet"}
              </p>
            </div>
            <button onClick={onClose} className="flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground">
              <X className="size-4" />
            </button>
          </div>
          <div className="mt-3 flex items-center gap-1 border-t border-border">
            {tabs.map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={cn("relative inline-flex items-center gap-2 px-3 py-2.5 text-[13px] font-semibold transition-colors",
                  tab === t.key ? "text-foreground" : "text-muted-foreground hover:text-foreground")}>
                {t.label}
                {tab === t.key && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary" />}
              </button>
            ))}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-5">
          {tab === "overview" ? (
            <OverviewTab site={site} siteCameras={siteCameras} onlineCount={onlineCount} placedCount={placedCount}
              onGoFloorPlan={() => setTab("floor-plan")} />
          ) : (
            <FloorPlanTab
              site={site}
              siteCameras={siteCameras}
              unplacedCameras={siteCameras.filter((c) => !site.cameraPlacements[c.id])}
              tool={tool}
              setTool={setTool}
              drafting={drafting}
              setDrafting={setDrafting}
              pendingCameraId={pendingCameraId}
              setPendingCameraId={setPendingCameraId}
              selected={selected}
              setSelected={setSelected}
              showAreas={showAreas}
              setShowAreas={setShowAreas}
              showCameras={showCameras}
              setShowCameras={setShowCameras}
              renamingId={renamingId}
              renameValue={renameValue}
              setRenameValue={setRenameValue}
              onCommitRename={commitRename}
              onCancelRename={() => { setRenamingId(null); setRenameValue(""); }}
              onStartRename={startRename}
              onStartNewArea={startNewArea}
              onPlaceCamera={startPlaceCamera}
              onCommitArea={commitArea}
              onMovePlacement={(id, x, y) => updatePlacement(site.id, id, { x, y })}
              onRotatePlacement={(id, deg) => updatePlacement(site.id, id, { rotation: deg })}
              onSelectArea={selectArea}
              onEditArea={(a) => setEditAreaTarget(a)}
              onDeleteArea={(id) => {
                deleteArea(site.id, id);
                toast.success("Area deleted");
                if (selected?.type === "area" && selected.id === id) setSelected(null);
              }}
              onRemovePlacement={(id) => {
                removePlacement(site.id, id);
                toast.success("Camera removed from plan");
                if (selected?.type === "camera" && selected.id === id) setSelected(null);
              }}
              onFloorPlanUpload={handleFloorPlanUpload}
              onSampleFloorPlan={handleSampleFloorPlan}
            />
          )}
        </div>

        <EditAreaModal area={editAreaTarget} open={!!editAreaTarget} onClose={() => setEditAreaTarget(null)}
          onSave={(patch) => { if (editAreaTarget) updateArea(site.id, editAreaTarget.id, patch); setEditAreaTarget(null); toast.success("Area updated"); }} />
        <EditSiteModal site={editSiteOpen ? site : null} open={editSiteOpen} onClose={() => setEditSiteOpen(false)}
          onSave={(patch) => { updateSite(site.id, patch); setEditSiteOpen(false); toast.success("Site updated"); }} />
        <DeleteSiteModal site={deleteSiteOpen ? site : null} open={deleteSiteOpen} onClose={() => setDeleteSiteOpen(false)}
          onConfirm={confirmDeleteSite} />

        {/* Footer */}
        <div className="flex items-center gap-2 border-t border-border bg-card px-5 py-3.5">
          <Button className="gap-1.5" onClick={() => setEditSiteOpen(true)}>
            <Edit3 className="size-3.5" />
            Edit Site
          </Button>
          <Button variant="outline" className="ml-auto gap-1.5 border-sev-critical/40 text-sev-critical hover:bg-sev-critical/10"
            onClick={() => setDeleteSiteOpen(true)}>
            <Trash2 className="size-3.5" />
            Delete Site
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ── Overview Tab (only counts — no lists) ───────────────────────────── */

function OverviewTab({
  site, siteCameras, onlineCount, placedCount, onGoFloorPlan,
}: {
  site: SiteData; siteCameras: CameraData[]; onlineCount: number; placedCount: number; onGoFloorPlan: () => void;
}) {
  const offline = siteCameras.length - onlineCount;
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-4">
        {/* Site details */}
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="border-b border-border px-5 py-3.5">
            <h2 className="text-[14px] font-bold text-foreground">Site Details</h2>
          </div>
          <div className="grid grid-cols-1 gap-x-6 gap-y-3 px-5 py-4 sm:grid-cols-2">
            {([
              ["Name", site.name, Building2],
              ["Status", <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", STATUS_STYLES[site.status].bg, STATUS_STYLES[site.status].text)}>
                <span className={cn("size-1.5 rounded-full", STATUS_STYLES[site.status].dot)} />
                {STATUS_STYLES[site.status].label}
              </span>, CircleDot],
              ["Address", site.address || "—", MapPin],
              ["Timezone", site.timezone, Clock],
              ["Created", site.createdAtDisplay, Calendar],
              ["Floor Plan", site.floorPlan ? (site.floorPlan.label ?? "Uploaded") : "Not uploaded", ImageIcon],
            ] as [string, React.ReactNode, React.ElementType][]).map(([label, value, Icon]) => (
              <div key={label as string} className="flex items-start gap-2">
                <Icon className="mt-0.5 size-3 flex-shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
                  <p className="mt-0.5 text-[13px] font-medium text-foreground">{value}</p>
                </div>
              </div>
            ))}
          </div>
          {site.description && (
            <div className="border-t border-border px-5 py-3.5">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Description</p>
              <p className="text-[12px] leading-relaxed text-foreground">{site.description}</p>
            </div>
          )}
        </div>

        {/* Quick counts cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="mb-1.5 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Shapes className="size-3" />
              Areas
            </p>
            <p className="text-[26px] font-bold leading-none text-foreground">{site.areas.length}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {site.areas.filter((a) => a.points.length >= 3).length} drawn · {site.areas.filter((a) => a.points.length === 0).length} pending
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="mb-1.5 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Video className="size-3" />
              Cameras
            </p>
            <p className="text-[26px] font-bold leading-none text-foreground">{siteCameras.length}</p>
            <p className="mt-1 text-[11px]">
              <span className="text-success font-semibold">{onlineCount} online</span>
              {offline > 0 && <span className="text-muted-foreground"> · <span className="text-sev-critical">{offline} offline</span></span>}
            </p>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="flex flex-col gap-4">
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {site.floorPlan?.imageUrl ? (
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-950">
              <img src={site.floorPlan.imageUrl} alt="" className="absolute inset-0 size-full object-contain opacity-80" />
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full">
                {site.areas.filter((a) => a.points.length >= 3).map((a) => (
                  <polygon key={a.id}
                    points={a.points.map(([x, y]) => `${x * 100},${y * 100}`).join(" ")}
                    fill={a.color} fillOpacity={0.22} stroke={a.color} strokeOpacity={0.85} strokeWidth={0.5} />
                ))}
                {siteCameras.map((c) => {
                  const p = site.cameraPlacements[c.id];
                  if (!p) return null;
                  const col = c.status === "online" ? "#22C55E" : "#9CA3AF";
                  return <CameraMarker key={c.id} cx={p.x * 100} cy={p.y * 100} rotation={p.rotation} color={col} isSelected={false} scale={0.7} />;
                })}
              </svg>
              <button onClick={onGoFloorPlan}
                className="absolute inset-x-0 bottom-0 inline-flex items-center justify-center gap-1.5 bg-black/55 py-2 text-[11px] font-semibold text-white backdrop-blur-sm transition-colors hover:bg-black/75">
                Open Floor Plan Editor
              </button>
            </div>
          ) : (
            <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 bg-card text-muted-foreground">
              <ImageIcon className="size-7 opacity-30" />
              <p className="text-[12px] font-semibold">No floor plan</p>
              <Button variant="outline" onClick={onGoFloorPlan} className="gap-1.5">
                <UploadCloud className="size-3" />
                Upload
              </Button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border bg-card p-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Placed</p>
            <p className="mt-1 text-[18px] font-bold text-foreground">{placedCount}<span className="text-[12px] text-muted-foreground"> / {siteCameras.length}</span></p>
            <p className="text-[10px] text-muted-foreground">On the floor plan</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Floor Plan</p>
            <p className={cn("mt-1 text-[12px] font-bold", site.floorPlan ? "text-success" : "text-warning")}>
              {site.floorPlan ? "Ready" : "Missing"}
            </p>
            <p className="text-[10px] text-muted-foreground">{site.floorPlan?.label ?? "Upload to enable editing"}</p>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-2 flex items-center gap-1.5">
            <HardDrive className="size-3.5 text-muted-foreground" />
            <p className="text-[12px] font-semibold text-foreground">Camera Health</p>
          </div>
          <div className="space-y-1.5 text-[11px]">
            {(["online", "offline", "connection-failed", "pending"] as CameraStatus[]).map((st) => {
              const count = siteCameras.filter((c) => c.status === st).length;
              const cs = CAMERA_STATUS_STYLES[st];
              return (
                <div key={st} className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <span className={cn("size-1.5 rounded-full", cs.dot)} />
                    {cs.label}
                  </span>
                  <span className={cn("font-mono font-semibold", count > 0 ? cs.text : "text-muted-foreground/50")}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Floor Plan Tab ──────────────────────────────────────────────────── */

function FloorPlanTab({
  site, siteCameras, unplacedCameras, tool, setTool, drafting, setDrafting,
  pendingCameraId, setPendingCameraId, selected, setSelected,
  showAreas, setShowAreas, showCameras, setShowCameras,
  renamingId, renameValue, setRenameValue, onCommitRename, onCancelRename,
  onStartRename, onStartNewArea, onPlaceCamera, onCommitArea,
  onMovePlacement, onRotatePlacement, onSelectArea, onEditArea, onDeleteArea, onRemovePlacement,
  onFloorPlanUpload, onSampleFloorPlan,
}: {
  site: SiteData;
  siteCameras: CameraData[];
  unplacedCameras: CameraData[];
  tool: Tool;
  setTool: (t: Tool) => void;
  drafting: { points: [number, number][]; color: string } | null;
  setDrafting: (d: { points: [number, number][]; color: string } | null) => void;
  pendingCameraId: string | null;
  setPendingCameraId: (id: string | null) => void;
  selected: { type: "area" | "camera"; id: string } | null;
  setSelected: (sel: { type: "area" | "camera"; id: string } | null) => void;
  showAreas: boolean; setShowAreas: (v: boolean) => void;
  showCameras: boolean; setShowCameras: (v: boolean) => void;
  renamingId: string | null; renameValue: string; setRenameValue: (v: string) => void;
  onCommitRename: () => void; onCancelRename: () => void;
  onStartRename: (a: AreaShape) => void;
  onStartNewArea: () => void;
  onPlaceCamera: (cameraId: string) => void;
  onCommitArea: (points: [number, number][], color: string) => void;
  onMovePlacement: (id: string, x: number, y: number) => void;
  onRotatePlacement: (id: string, deg: number) => void;
  onSelectArea: (id: string) => void;
  onEditArea: (a: AreaShape) => void;
  onDeleteArea: (id: string) => void;
  onRemovePlacement: (id: string) => void;
  onFloorPlanUpload: (url: string, name: string) => void;
  onSampleFloorPlan: () => void;
}) {
  const placedCameras = siteCameras.filter((c) => !!site.cameraPlacements[c.id]);
  const selCam = selected?.type === "camera" ? siteCameras.find((c) => c.id === selected.id) : undefined;
  const selPlacement = selCam ? site.cameraPlacements[selCam.id] : undefined;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-3">
        {site.floorPlan && (
          <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2">
            <div className="flex items-center gap-1 rounded-md border border-border bg-background p-0.5">
              {([
                { key: "select",    label: "Select",  icon: MousePointer2 },
                { key: "draw-area", label: "Area",    icon: Shapes },
              ] as { key: Tool; label: string; icon: React.ElementType }[]).map((t) => {
                const Icon = t.icon;
                const active = tool === t.key;
                return (
                  <button key={t.key} onClick={() => { setTool(t.key); if (t.key === "draw-area") setDrafting({ points: [], color: AREA_PALETTE[site.areas.length % AREA_PALETTE.length] }); }}
                    className={cn("inline-flex items-center gap-1.5 rounded px-2 py-1 text-[11px] font-semibold transition-colors",
                      active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
                    <Icon className="size-3.5" />
                    {t.label}
                  </button>
                );
              })}
            </div>
            <div className="mx-1 h-5 w-px bg-border" />
            <button onClick={() => setShowAreas(!showAreas)}
              className={cn("inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold transition-colors",
                showAreas ? "text-foreground" : "text-muted-foreground/60")}>
              {showAreas ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
              Areas
            </button>
            <button onClick={() => setShowCameras(!showCameras)}
              className={cn("inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold transition-colors",
                showCameras ? "text-foreground" : "text-muted-foreground/60")}>
              {showCameras ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
              Cameras
            </button>
            {tool === "draw-area" && drafting && drafting.points.length > 0 && (
              <div className="ml-auto flex items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground">{drafting.points.length} point{drafting.points.length === 1 ? "" : "s"}</span>
                <Button variant="outline" onClick={() => setDrafting({ points: drafting.points.slice(0, -1), color: drafting.color })}>Undo</Button>
                <Button onClick={() => { if (drafting.points.length >= 3) onCommitArea(drafting.points, drafting.color); }}
                  disabled={drafting.points.length < 3} className="gap-1.5">
                  <Check className="size-3.5" />
                  Finish ({drafting.points.length})
                </Button>
                <Button variant="ghost" onClick={() => { setDrafting(null); setTool("select"); }} className="gap-1.5">
                  <X className="size-3.5" />
                  Cancel
                </Button>
              </div>
            )}
          </div>
        )}

        {site.floorPlan ? (
          <>
            <FloorPlanCanvas
              site={site}
              siteCameras={siteCameras}
              tool={tool}
              drafting={drafting}
              onSetDrafting={setDrafting}
              selected={selected}
              onSelect={setSelected}
              onCommitArea={onCommitArea}
              onMovePlacement={onMovePlacement}
              onRotatePlacement={onRotatePlacement}
              showAreas={showAreas}
              showCameras={showCameras}
              onAreaEdit={(id) => { const a = site.areas.find((x) => x.id === id); if (a) onEditArea(a); }}
              onAreaDelete={onDeleteArea}
            />
            {/* Rotation control panel when a camera is selected */}
            {selCam && selPlacement && (
              <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5">
                <div className="flex size-7 items-center justify-center rounded-full bg-secondary/15 text-secondary">
                  <Video className="size-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-semibold text-foreground">{selCam.name}</p>
                  <p className="truncate text-[10px] text-muted-foreground"><span className="font-mono">{selCam.id}</span> · {CAMERA_STATUS_STYLES[selCam.status].label}</p>
                </div>
                <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                  <RotateCw className="size-3" />
                  Angle
                  <input
                    type="number" min={0} max={360} step={5}
                    value={selPlacement.rotation}
                    onChange={(e) => onRotatePlacement(selCam.id, Math.max(0, Math.min(360, Number(e.target.value))))}
                    className="h-7 w-14 rounded border border-input bg-background px-1.5 text-center font-mono text-[12px] text-foreground"
                  />
                  <span className="font-mono text-foreground">°</span>
                </label>
                <input type="range" min={0} max={360} step={5}
                  value={selPlacement.rotation}
                  onChange={(e) => onRotatePlacement(selCam.id, Number(e.target.value))}
                  className="w-32 accent-primary" />
                <Button variant="outline" className="gap-1.5 border-sev-critical/40 text-sev-critical hover:bg-sev-critical/10"
                  onClick={() => onRemovePlacement(selCam.id)}>
                  <Trash2 className="size-3" />
                  Remove
                </Button>
              </div>
            )}
            {pendingCameraId && (
              <div className="rounded-md border border-info/30 bg-info/[0.06] px-3 py-2 text-[11px] text-muted-foreground">
                Placing camera at the centre of the plan… drag it to the right spot, then rotate using the orange handle.
                <button onClick={() => setPendingCameraId(null)} className="ml-2 underline">Cancel</button>
              </div>
            )}
          </>
        ) : (
          <FloorPlanEmpty onUpload={onFloorPlanUpload} onUseSample={onSampleFloorPlan} />
        )}
      </div>

      {/* Sidebar */}
      <div className="flex flex-col gap-3">
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between gap-2 border-b border-border px-3.5 py-2.5">
            <div className="flex items-center gap-2">
              <Shapes className="size-3.5 text-primary" />
              <p className="text-[12px] font-bold text-foreground">Areas</p>
              <span className="rounded-full bg-muted px-1.5 py-px text-[10px] font-bold text-muted-foreground">{site.areas.length}</span>
            </div>
            <Button onClick={onStartNewArea} className="gap-1.5">
              <Plus className="size-3.5" />
              Add Area
            </Button>
          </div>
          <div className="max-h-[260px] overflow-y-auto">
            {site.areas.length === 0 ? (
              <p className="px-4 py-6 text-center text-[12px] italic text-muted-foreground">No areas yet.</p>
            ) : (
              site.areas.map((a) => {
                const isSel = selected?.type === "area" && selected.id === a.id;
                const camCount = siteCameras.filter((c) => c.areaId === a.id).length;
                return (
                  <div key={a.id}
                    className={cn("group flex items-center gap-2.5 border-b border-border/60 px-3.5 py-2 last:border-b-0 transition-colors",
                      isSel ? "bg-primary/5" : "hover:bg-muted/40")}>
                    <button onClick={() => onSelectArea(a.id)} className="flex flex-1 items-center gap-2.5 text-left">
                      <span className="size-3 flex-shrink-0 rounded" style={{ background: a.color }} />
                      {renamingId === a.id ? (
                        <input
                          autoFocus
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onBlur={onCommitRename}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") onCommitRename();
                            if (e.key === "Escape") onCancelRename();
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="h-7 flex-1 rounded border border-primary bg-background px-2 text-[12px] focus:outline-none"
                        />
                      ) : (
                        <span className="truncate text-[12px] font-semibold text-foreground">{a.name}</span>
                      )}
                      <span className="ml-auto inline-flex items-center gap-2 text-[10px] text-muted-foreground">
                        {a.points.length === 0
                          ? <span className="inline-flex items-center gap-0.5 rounded bg-warning/15 px-1.5 py-0.5 font-semibold text-warning">Not drawn</span>
                          : <><CircleDot className="size-2.5 text-success" /> {camCount} cam{camCount === 1 ? "" : "s"}</>}
                      </span>
                    </button>
                    <div className="flex flex-shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <button onClick={() => onStartRename(a)}
                        className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                        title="Rename">
                        <Pencil className="size-3" />
                      </button>
                      <button onClick={() => onEditArea(a)}
                        className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                        title="Edit color">
                        <Edit3 className="size-3" />
                      </button>
                      <button onClick={() => onDeleteArea(a.id)}
                        className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-sev-critical/10 hover:text-sev-critical"
                        title="Delete area">
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between gap-2 border-b border-border px-3.5 py-2.5">
            <div className="flex items-center gap-2">
              <Video className="size-3.5 text-primary" />
              <p className="text-[12px] font-bold text-foreground">Cameras on Plan</p>
              <span className="rounded-full bg-muted px-1.5 py-px text-[10px] font-bold text-muted-foreground">{placedCameras.length}</span>
            </div>
          </div>
          <div className="max-h-[180px] overflow-y-auto">
            {placedCameras.length === 0 ? (
              <p className="px-4 py-4 text-center text-[12px] italic text-muted-foreground">
                {site.floorPlan ? "No cameras placed yet." : "Upload a floor plan first."}
              </p>
            ) : (
              placedCameras.map((c) => {
                const isSel = selected?.type === "camera" && selected.id === c.id;
                const area = site.areas.find((a) => a.id === c.areaId);
                const cs = CAMERA_STATUS_STYLES[c.status];
                return (
                  <div key={c.id}
                    className={cn("group flex items-center gap-2.5 border-b border-border/60 px-3.5 py-2 last:border-b-0 transition-colors",
                      isSel ? "bg-primary/5" : "hover:bg-muted/40")}>
                    <button onClick={() => setSelected({ type: "camera", id: c.id })} className="flex flex-1 items-center gap-2.5 text-left">
                      <span className={cn("flex size-6 flex-shrink-0 items-center justify-center rounded-full", cs.bg)}>
                        <Video className={cn("size-3", cs.text)} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12px] font-semibold text-foreground">{c.name}</p>
                        <p className="truncate text-[10px] text-muted-foreground">
                          {area ? area.name : "Unassigned"} · <span className="font-mono">{c.id}</span>
                        </p>
                      </div>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {unplacedCameras.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-warning/30 bg-warning/[0.06]">
            <div className="flex items-center justify-between gap-2 border-b border-warning/20 px-3.5 py-2.5">
              <div className="flex items-center gap-2">
                <Video className="size-3.5 text-warning" />
                <p className="text-[12px] font-bold text-foreground">Unplaced</p>
                <span className="rounded-full bg-warning/15 px-1.5 py-px text-[10px] font-bold text-warning">{unplacedCameras.length}</span>
              </div>
            </div>
            <div className="max-h-[160px] overflow-y-auto">
              {unplacedCameras.map((c) => {
                const cs = CAMERA_STATUS_STYLES[c.status];
                return (
                  <div key={c.id} className="flex items-center gap-2.5 border-b border-warning/10 px-3.5 py-2 last:border-b-0">
                    <span className={cn("size-1.5 flex-shrink-0 rounded-full", cs.dot)} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-semibold text-foreground">{c.name}</p>
                      <p className="truncate text-[10px] text-muted-foreground"><span className="font-mono">{c.id}</span> · {cs.label}</p>
                    </div>
                    <Button onClick={() => onPlaceCamera(c.id)} disabled={!site.floorPlan} className="gap-1.5">
                      <Plus className="size-3" />
                      Place
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
