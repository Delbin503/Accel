import * as React from "react";
import { Plus, Check, Pencil, Trash2, ChevronRight, CopyCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { BoundaryZone } from "@/types/cameras";

/**
 * Canvas for drawing / editing detection (boundary) zones over a camera frame.
 * Used by the deployment wizard, where zones are drawn as a step before the
 * deployment is confirmed.
 */
export function DrawZoneModal({
  open,
  cameraName,
  existingZones,
  initialEditingZoneId,
  onClose,
  onSave,
  onUpdateZone,
  onRemoveZone,
  onUpdateZoneBox,
  title,
  subtitle,
  primaryAction,
  skipAction,
  cameraPicker,
  applyToAll,
}: {
  open: boolean;
  cameraName: string;
  existingZones: BoundaryZone[];
  initialEditingZoneId?: string | null;
  onClose: () => void;
  onSave: (label: string, box: [number, number, number, number]) => void;
  onUpdateZone: (zoneId: string, label: string) => void;
  onRemoveZone: (zoneId: string) => void;
  onUpdateZoneBox: (zoneId: string, box: [number, number, number, number]) => void;
  /** Overrides the default "Add / Edit Detection Zone" heading. */
  title?: string;
  /** Overrides the default instructional blurb. */
  subtitle?: React.ReactNode;
  /** Renders a footer with a confirming action (e.g. "Next" in the deploy wizard). */
  primaryAction?: { label: string; onClick: () => void; disabled?: boolean };
  /** Optional bypass shown in the footer while no zones have been drawn. */
  skipAction?: { label: string; onClick: () => void };
  /** Switches which camera's zones are being edited. Hidden for a single camera. */
  cameraPicker?: {
    cameras: { id: string; name: string; zoneCount: number }[];
    activeId: string;
    onChange: (cameraId: string) => void;
  };
  /** Copies the active camera's zones onto every other selected camera. */
  applyToAll?: { onClick: () => void; disabled?: boolean };
}) {
  const [label, setLabel] = React.useState("");
  // null = no draft, else a draft new zone the user is drawing/positioning
  const [draft, setDraft] = React.useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [editingZoneId, setEditingZoneId] = React.useState<string | null>(null);
  const [editingLabel, setEditingLabel] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const drawRef = React.useRef<{ startX: number; startY: number; mode: "draw" | "move" | null }>({ startX: 0, startY: 0, mode: null });
  const isEditingInitialZone = Boolean(initialEditingZoneId);

  React.useEffect(() => {
    if (open) {
      const initialZone = initialEditingZoneId
        ? existingZones.find((z) => z.id === initialEditingZoneId)
        : null;
      setLabel("");
      setDraft(null);
      setEditingZoneId(initialZone?.id ?? null);
      setEditingLabel(initialZone?.label ?? "");
    }
  }, [open, initialEditingZoneId, existingZones]);

  // Live-edited box for the currently-edited existing zone
  const editingZone = editingZoneId ? existingZones.find((z) => z.id === editingZoneId) : null;

  if (!open) return null;

  function normalizedPoint(e: MouseEvent | React.MouseEvent): [number, number] {
    const el = containerRef.current;
    if (!el) return [0, 0];
    const r = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    const y = Math.max(0, Math.min(1, (e.clientY - r.top) / r.height));
    return [x, y];
  }

  function onMouseDownContainer(e: React.MouseEvent) {
    // If user clicks on an existing zone, that zone's handler runs instead.
    if ((e.target as HTMLElement).closest("[data-zone-box]")) return;
    if ((e.target as HTMLElement).closest("[data-existing-zone]")) return;
    // Empty canvas click → start a new draft box
    setEditingZoneId(null);
    const [x, y] = normalizedPoint(e);
    drawRef.current = { startX: x, startY: y, mode: "draw" };
    setDraft({ x, y, w: 0, h: 0 });
    const onMove = (ev: MouseEvent) => {
      const ctx = drawRef.current;
      if (!ctx || ctx.mode !== "draw") return;
      const [cx, cy] = normalizedPoint(ev);
      setDraft({
        x: Math.min(ctx.startX, cx),
        y: Math.min(ctx.startY, cy),
        w: Math.abs(cx - ctx.startX),
        h: Math.abs(cy - ctx.startY),
      });
    };
    const onUp = () => {
      drawRef.current.mode = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  // Generic drag-to-move for any rectangle. updateFn receives the new (x, y).
  function dragBox(e: React.MouseEvent, current: { x: number; y: number; w: number; h: number }, updateFn: (x: number, y: number) => void) {
    e.stopPropagation();
    const [px, py] = normalizedPoint(e);
    const offsetX = px - current.x;
    const offsetY = py - current.y;
    drawRef.current.mode = "move";
    const onMove = (ev: MouseEvent) => {
      if (drawRef.current.mode !== "move") return;
      const [cx, cy] = normalizedPoint(ev);
      const nx = Math.max(0, Math.min(1 - current.w, cx - offsetX));
      const ny = Math.max(0, Math.min(1 - current.h, cy - offsetY));
      updateFn(nx, ny);
    };
    const onUp = () => {
      drawRef.current.mode = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  // Generic corner-resize for any rectangle.
  function resizeBox(e: React.MouseEvent, current: { x: number; y: number }, updateFn: (w: number, h: number) => void) {
    e.stopPropagation();
    const onMove = (ev: MouseEvent) => {
      const [cx, cy] = normalizedPoint(ev);
      const w = Math.max(0.05, Math.min(1 - current.x, cx - current.x));
      const h = Math.max(0.05, Math.min(1 - current.y, cy - current.y));
      updateFn(w, h);
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  function commit() {
    if (!draft || !label.trim() || draft.w < 0.05 || draft.h < 0.05) return;
    onSave(label.trim(), [draft.x, draft.y, draft.x + draft.w, draft.y + draft.h]);
    setLabel("");
    setDraft(null);
  }

  function moveExistingZone(zoneId: string, nx: number, ny: number) {
    const z = existingZones.find((x) => x.id === zoneId);
    if (!z) return;
    const w = z.box[2] - z.box[0];
    const h = z.box[3] - z.box[1];
    onUpdateZoneBox(zoneId, [nx, ny, nx + w, ny + h]);
  }

  function resizeExistingZone(zoneId: string, nw: number, nh: number) {
    const z = existingZones.find((x) => x.id === zoneId);
    if (!z) return;
    onUpdateZoneBox(zoneId, [z.box[0], z.box[1], z.box[0] + nw, z.box[1] + nh]);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="flex max-h-[85vh] w-[840px] max-w-[95vw] flex-col overflow-hidden p-0">
        <DialogHeader className="flex-shrink-0 border-b border-border px-5 py-4">
          <DialogTitle className="text-base font-bold">
            {title ?? (isEditingInitialZone ? "Edit Detection Zones" : "Add Detection Zone")}
          </DialogTitle>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {subtitle ?? (
              <>
                {isEditingInitialZone ? "View, draw and edit" : "Draw and configure"} boundary zones on{" "}
                <strong className="text-foreground">{cameraName}</strong>.
              </>
            )}{" "}
            Drag on empty canvas to create a new zone · click any zone to edit it · drag corner handles to resize.
          </p>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto p-5">
          {/* Camera switcher — zones are stored per camera */}
          {cameraPicker && cameraPicker.cameras.length > 1 && (
            <div className="mb-3 flex items-center gap-2.5">
              <label
                htmlFor="zone-camera-picker"
                className="flex-shrink-0 font-mono text-2xs uppercase tracking-widest text-muted-foreground/60"
              >
                Camera
              </label>
              <select
                id="zone-camera-picker"
                value={cameraPicker.activeId}
                onChange={(e) => cameraPicker.onChange(e.target.value)}
                className="h-9 min-w-0 flex-1 rounded-md border border-border bg-background px-3 text-base text-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                {cameraPicker.cameras.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.zoneCount} zone{c.zoneCount === 1 ? "" : "s"}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Camera canvas — bigger so zones are easier to manipulate */}
          <div
            ref={containerRef}
            onMouseDown={onMouseDownContainer}
            className="relative aspect-video w-full cursor-crosshair select-none overflow-hidden rounded-lg border-2 border-border bg-neutral-950"
            style={{ background: "radial-gradient(120% 80% at 40% 60%, rgba(180,140,80,0.22) 0%, rgba(40,30,15,0.1) 45%, rgba(0,0,0,0.95) 100%)" }}
          >
            <div className="pointer-events-none absolute inset-0 opacity-[0.04]"
              style={{ backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.5) 0 1px, transparent 1px 3px)" }} />
            <span className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-md bg-sev-critical/95 px-2 py-0.5 text-2xs font-bold uppercase tracking-widest text-white">
              LIVE
            </span>
            <span className="pointer-events-none absolute right-3 top-3 rounded bg-black/60 px-2 py-0.5 font-mono text-2xs text-white/85 backdrop-blur-sm">{cameraName}</span>

            {/* Empty-state hint */}
            {existingZones.length === 0 && !draft && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="rounded-lg border border-dashed border-white/30 bg-black/40 px-4 py-2 text-center text-xs text-white/70 backdrop-blur-sm">
                  Click and drag anywhere on the canvas to draw a new zone
                </div>
              </div>
            )}

            {/* Existing zones */}
            {existingZones.map((z, i) => {
              const [x0, y0, x1, y1] = z.box;
              const w = x1 - x0;
              const h = y1 - y0;
              const isEditing = editingZoneId === z.id;
              return (
                <div
                  key={z.id}
                  data-existing-zone
                  onMouseDown={(e) => {
                    if (!isEditing) {
                      // First click: enter edit mode
                      e.stopPropagation();
                      setEditingZoneId(z.id);
                      setEditingLabel(z.label);
                      return;
                    }
                    // Already editing → drag to move
                    dragBox(e, { x: x0, y: y0, w, h }, (nx, ny) => moveExistingZone(z.id, nx, ny));
                  }}
                  className={cn(
                    "absolute border-2 transition-colors",
                    isEditing
                      ? "cursor-move border-warning bg-warning/20 ring-2 ring-warning/40"
                      : "cursor-pointer border-info bg-info/15 hover:border-info/80 hover:bg-info/25"
                  )}
                  style={{
                    left: `${x0 * 100}%`, top: `${y0 * 100}%`,
                    width: `${w * 100}%`, height: `${h * 100}%`,
                  }}
                >
                  <span className={cn(
                    "absolute -top-5 left-0 rounded px-1.5 py-px font-mono text-2xs font-bold",
                    isEditing ? "bg-warning text-neutral-900" : "bg-info text-white"
                  )}>
                    {i + 1}. {z.label}{isEditing && " · editing"}
                  </span>
                  {/* Corner resize handle (only when editing) */}
                  {isEditing && (
                    <div onMouseDown={(e) => resizeBox(e, { x: x0, y: y0 }, (nw, nh) => resizeExistingZone(z.id, nw, nh))}
                      className="absolute -bottom-1.5 -right-1.5 z-10 size-4 cursor-nwse-resize rounded-sm border-2 border-warning bg-warning"
                      title="Resize" />
                  )}
                </div>
              );
            })}

            {/* Draft (new) zone */}
            {draft && draft.w > 0 && draft.h > 0 && (
              <div
                data-zone-box
                onMouseDown={(e) => dragBox(e, draft, (nx, ny) => setDraft((d) => d && ({ ...d, x: nx, y: ny })))}
                className="absolute cursor-move border-2 border-primary bg-primary/20 ring-2 ring-primary/40"
                style={{
                  left: `${draft.x * 100}%`, top: `${draft.y * 100}%`,
                  width: `${draft.w * 100}%`, height: `${draft.h * 100}%`,
                }}
              >
                <span className="absolute -top-5 left-0 rounded bg-primary px-1.5 py-px text-2xs font-bold text-primary-foreground">
                  {label || "New zone"}
                </span>
                <div onMouseDown={(e) => resizeBox(e, draft, (nw, nh) => setDraft((d) => d && ({ ...d, w: nw, h: nh })))}
                  className="absolute -bottom-1.5 -right-1.5 z-10 size-4 cursor-nwse-resize rounded-sm border-2 border-primary bg-primary"
                  title="Resize" />
              </div>
            )}
          </div>

          {/* Copy this camera's zones to the rest of the selection */}
          {applyToAll && cameraPicker && cameraPicker.cameras.length > 1 && (
            <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 px-3 py-2.5">
              <p className="min-w-0 text-sm text-muted-foreground">
                Reuse this layout on the other{" "}
                <strong className="text-foreground">{cameraPicker.cameras.length - 1}</strong> camera
                {cameraPicker.cameras.length - 1 === 1 ? "" : "s"}.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={applyToAll.onClick}
                disabled={applyToAll.disabled}
                className="flex-shrink-0 gap-1.5 border-primary/50 bg-primary/10 text-primary hover:border-primary hover:bg-primary/20 hover:text-primary"
              >
                <CopyCheck className="size-3.5" />
                Apply to all cameras
              </Button>
            </div>
          )}

          {/* Both editor cards always render when applicable so user can draw AND edit names simultaneously */}
          <div className="mt-4 space-y-3">
            {/* New zone form — appears when user has dragged a draft */}
            {draft && (
              <div className="grid grid-cols-1 gap-3 rounded-lg border border-primary/40 bg-primary/[0.04] p-3 sm:grid-cols-[1fr_auto]">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-primary">
                    <Plus className="-mt-0.5 mr-1 inline size-3" /> Name your new zone
                  </label>
                  <Input value={label} onChange={(e) => setLabel(e.target.value)}
                    autoFocus placeholder="e.g. Entrance, Counter, Loading Dock…"
                    onKeyDown={(e) => { if (e.key === "Enter" && label.trim() && draft.w >= 0.05) commit(); }}
                    className="h-9 text-base" />
                  <p className="mt-1 text-2xs text-muted-foreground">
                    Box: [{draft.x.toFixed(2)}, {draft.y.toFixed(2)}, {(draft.x + draft.w).toFixed(2)}, {(draft.y + draft.h).toFixed(2)}]
                  </p>
                </div>
                <div className="flex items-end gap-1.5">
                  <Button variant="ghost" size="sm" onClick={() => { setDraft(null); setLabel(""); }}>Discard</Button>
                  <Button disabled={!label.trim() || draft.w < 0.05 || draft.h < 0.05} onClick={commit} className="gap-1.5">
                    <Check className="size-3.5" />
                    Add Zone
                  </Button>
                </div>
              </div>
            )}

            {/* Rename form — appears when user clicked an existing zone */}
            {editingZone && (
              <div className="rounded-lg border border-warning/40 bg-warning/[0.06] p-3">
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-warning">
                    <Pencil className="-mt-0.5 mr-1 inline size-3" />
                    Renaming zone {existingZones.findIndex((z) => z.id === editingZone.id) + 1}
                  </label>
                  <span className="font-mono text-2xs text-muted-foreground">
                    [{editingZone.box.map((n) => n.toFixed(2)).join(", ")}]
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Input value={editingLabel} onChange={(e) => setEditingLabel(e.target.value)}
                    autoFocus placeholder="Zone name"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && editingLabel.trim()) {
                        onUpdateZone(editingZone.id, editingLabel.trim());
                        setEditingZoneId(null);
                      }
                      if (e.key === "Escape") setEditingZoneId(null);
                    }}
                    className="h-9 flex-1 text-base" />
                  <Button size="sm" className="gap-1.5"
                    disabled={!editingLabel.trim() || editingLabel === editingZone.label}
                    onClick={() => { onUpdateZone(editingZone.id, editingLabel.trim()); setEditingZoneId(null); }}>
                    <Check className="size-3" />
                    Save Name
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setEditingZoneId(null)}>Cancel</Button>
                </div>
                <p className="mt-2 text-2xs text-muted-foreground">
                  You can also drag the highlighted zone on the canvas to reposition · drag its corner handle to resize.
                </p>
              </div>
            )}

            {/* Default hint when nothing is being drawn or edited */}
            {!draft && !editingZone && (
              <div className="rounded-lg border border-dashed border-border bg-muted/20 px-3 py-3 text-center text-xs text-muted-foreground">
                Drag on the canvas above to create a new zone · click any existing zone (or its row below) to rename it.
              </div>
            )}
          </div>

          {/* Existing zones list — click on row OR canvas to edit */}
          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Current zones ({existingZones.length})
            </p>
            {existingZones.length === 0 ? (
              <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-sm italic text-muted-foreground">
                No zones drawn yet. Draw one on the canvas above.
              </p>
            ) : (
              <div className="space-y-1.5">
                {existingZones.map((z, i) => {
                  const isEditing = editingZoneId === z.id;
                  return (
                    <div key={z.id}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border bg-background px-3 py-2 transition-colors",
                        isEditing ? "border-warning bg-warning/[0.04]" : "border-border"
                      )}>
                      <span className={cn("font-mono text-2xs font-bold", isEditing ? "text-warning" : "text-info")}>{i + 1}</span>
                      <span className="rounded bg-muted px-1.5 py-px font-mono text-2xs text-muted-foreground">{z.id}</span>
                      <span className="flex-1 text-base font-semibold text-foreground">{z.label}</span>
                      <span className="hidden font-mono text-2xs text-muted-foreground/70 sm:inline">
                        [{z.box.map((n) => n.toFixed(2)).join(", ")}]
                      </span>
                      {/* Explicit Edit + Delete buttons (always visible) */}
                      <button
                        onClick={() => { setEditingZoneId(z.id); setEditingLabel(z.label); }}
                        className={cn(
                          "flex size-7 items-center justify-center rounded border transition-colors",
                          isEditing ? "border-warning bg-warning/15 text-warning"
                                    : "border-border text-muted-foreground hover:border-warning/40 hover:text-warning"
                        )}
                        title="Rename zone">
                        <Pencil className="size-3" />
                      </button>
                      <button onClick={() => { onRemoveZone(z.id); if (isEditing) setEditingZoneId(null); }}
                        className="flex size-7 items-center justify-center rounded border border-border text-muted-foreground hover:border-sev-critical/40 hover:text-sev-critical"
                        title="Remove zone">
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {primaryAction && (
          <div className="flex flex-shrink-0 items-center justify-between gap-3 border-t border-border px-5 py-3.5">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">{existingZones.length}</strong> zone
              {existingZones.length === 1 ? "" : "s"} defined
            </p>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onClose}>
                Back
              </Button>
              {/* Only offered while nothing is drawn — once zones exist, skipping
                  would silently throw them away. */}
              {skipAction && existingZones.length === 0 && (
                <Button variant="outline" size="sm" onClick={skipAction.onClick}>
                  {skipAction.label}
                </Button>
              )}
              <Button
                size="sm"
                onClick={primaryAction.onClick}
                disabled={primaryAction.disabled}
                className="gap-1.5"
              >
                {primaryAction.label}
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
