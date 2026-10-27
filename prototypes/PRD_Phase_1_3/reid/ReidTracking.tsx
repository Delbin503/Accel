import { Crosshair, Maximize2, MapPinned, Pin, PinOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@/components/shared/Modal";
import { cn } from "@/lib/utils";
import { cameraPose } from "./calibrationGeometry";
import { mapLabel, type ReidMap } from "./reidMaps";
import { TRAIL_SEC, trackWhere, zonesFor, type TrackState } from "./weaponTracks";

/* Re-ID tracking — the Live Monitoring pieces.

   · TrackingPanel   the rail tab: active tracks, a map picker, the mini map
   · MapExpandModal  the enlarged map — every weapon on it, with trails
   · WeaponBadges    the W-xx chips on camera tiles

   The mini map only draws the weapon in focus (the pinned one, or whatever's
   in the main camera); the enlarged view is where every weapon shows. */

/* ── Map drawing ──────────────────────────────────────────────────────── */

/* Every weapon is drawn in the critical red and named by a label chip, so the
   map reads the same with one weapon or ten. Picking one sets it apart: its
   trail goes solid, a target ring frames it, its chip fills, its camera's zone
   lights up, and every other weapon fades back. */

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

const overlaps = (a: Box, b: Box) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/**
 * Places each label chip beside its dot where it covers no other chip, dot,
 * camera label or headcount — trying the corners and sides close in first,
 * then further out (drawn with a leader line). Falls back to the spot with the
 * least overlap when the map is too crowded for a clean one.
 */
function placeLabels(
  dots: { id: string; x: number; y: number; w: number; h: number; r: number }[],
  obstacles: Box[],
  W: number,
  H: number
): Record<string, Box & { far: boolean }> {
  const placed: Box[] = [];
  const out: Record<string, Box & { far: boolean }> = {};
  const dotBoxes = dots.map((d) => ({ x: d.x - d.r - 2, y: d.y - d.r - 2, w: d.r * 2 + 4, h: d.r * 2 + 4 }));
  for (const d of dots) {
    let best: (Box & { far: boolean }) | null = null;
    let bestHits = Infinity;
    for (const reach of [1, 2.6]) {
      const g = (d.r + 3) * reach;
      const spots: [number, number][] = [
        [d.x + g, d.y - g - d.h], [d.x - g - d.w, d.y - g - d.h], [d.x + g, d.y + g], [d.x - g - d.w, d.y + g],
        [d.x + g + 2, d.y - d.h / 2], [d.x - g - 2 - d.w, d.y - d.h / 2], [d.x - d.w / 2, d.y - g - d.h - 2], [d.x - d.w / 2, d.y + g + 2],
      ];
      for (const [x, y] of spots) {
        const box = { x, y, w: d.w, h: d.h };
        if (x < 2 || y < 2 || x + d.w > W - 2 || y + d.h > H - 2) continue;
        const hits = [...placed, ...obstacles, ...dotBoxes].filter((o) => overlaps(box, o)).length;
        if (hits < bestHits) {
          best = { ...box, far: reach > 1 };
          bestHits = hits;
        }
        if (hits === 0) break;
      }
      if (bestHits === 0) break;
    }
    const chosen = best ?? { x: d.x + d.r + 3, y: d.y - d.r - 3 - d.h, w: d.w, h: d.h, far: false };
    placed.push(chosen);
    out[d.id] = chosen;
  }
  return out;
}

export function TrackMap({
  map,
  states,
  focusId,
  highlightCameraId,
  size,
  persons,
  onPick,
}: {
  map: ReidMap;
  /** The weapons to draw. */
  states: TrackState[];
  /** The selected weapon; null draws every weapon alike. */
  focusId: string | null;
  /** The zone to light up; defaults to the selected weapon's camera. */
  highlightCameraId?: string | null;
  size: "mini" | "full";
  /** People in each camera's zone; drawn under the camera label when given. */
  persons?: Record<string, number>;
  onPick?: (trackId: string) => void;
}) {
  const full = size === "full";
  const W = full ? 1000 : 320;
  const H = full ? 620 : 210;
  const PAD = full ? 60 : 18;
  const zones = zonesFor(map);
  const poses = full ? map.cameraIds.map((c) => ({ id: c, pose: cameraPose(c) })) : [];

  const pts = [
    ...Object.values(zones).flat(),
    ...poses.map((p) => ({ x: p.pose.x, y: p.pose.y })),
  ];
  if (pts.length === 0) return null;
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const scale = Math.min((W - PAD * 2) / Math.max(1, maxX - minX), (H - PAD * 2) / Math.max(1, maxY - minY));
  const offX = (W - (maxX - minX) * scale) / 2;
  const offY = (H - (maxY - minY) * scale) / 2;
  const px = (x: number) => offX + (x - minX) * scale;
  const mapMid = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
  const py = (y: number) => H - (offY + (y - minY) * scale);

  const focused = states.find((s) => s.track.id === focusId) ?? null;
  const litCamera = highlightCameraId ?? focused?.cameraId ?? null;

  // Camera labels and headcounts, in screen space — drawn, and kept clear of weapon labels.
  const camFs = full ? 22 : 11;
  const zoneMarks = map.cameraIds.flatMap((c) => {
    const z = zones[c];
    if (!z || z.length < 3) return [];
    const cx = z.reduce((s, m) => s + m.x, 0) / z.length;
    const cy = z.reduce((s, m) => s + m.y, 0) / z.length;
    /* Zones overlap in the middle of a map, so the headcount sits out toward
       the zone's far corner — the vertex farthest from the map's centre. */
    const far = z.reduce((best, m) => (Math.hypot(m.x - mapMid.x, m.y - mapMid.y) > Math.hypot(best.x - mapMid.x, best.y - mapMid.y) ? m : best), z[0]);
    return [{ id: c, zone: z, lx: px(cx), ly: py(cy), hx: px(cx + (far.x - cx) * 0.6), hy: py(cy + (far.y - cy) * 0.6) }];
  });
  const obstacles: Box[] = zoneMarks.flatMap((m) => {
    const lw = camFs * 0.62 * m.id.replace("Cam-", "C").length;
    const label = { x: m.lx - lw / 2, y: m.ly - camFs / 2, w: lw, h: camFs };
    return persons ? [label, full ? { x: m.hx - 22, y: m.hy - 10, w: 40, h: 16 } : { x: m.hx - 12, y: m.hy - 6, w: 20, h: 10 }] : [label];
  });

  // Weapon labels: the selected one first, so it gets the best spot.
  const fs = full ? 14 : 9;
  const chipText = (st: TrackState) => (full || st === focused) && st.cameraId ? `${st.track.id} · ${st.cameraId}` : st.track.id;
  const dotR = (st: TrackState) => (st === focused ? (full ? 8 : 5) : full ? 6 : 4);
  const order = [...states].sort((a, b) => Number(b === focused) - Number(a === focused));
  const labels = placeLabels(
    order.map((st) => ({
      id: st.track.id,
      x: px(st.pos.x),
      y: py(st.pos.y),
      w: chipText(st).length * fs * 0.62 + (full ? 14 : 8),
      h: fs + (full ? 8 : 5),
      r: dotR(st),
    })),
    obstacles,
    W,
    H
  );
  const faded = (st: TrackState) => focused !== null && st !== focused;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${mapLabel(map)} with ${states.length} weapon${states.length === 1 ? "" : "s"}${focused ? `, ${focused.track.id} selected` : ""}`} className="block h-auto w-full">
      <rect width={W} height={H} className="fill-neutral-900" />

      {zoneMarks.map((m) => {
        const on = m.id === litCamera;
        return (
          <polygon
            key={m.id}
            points={m.zone.map((p) => `${px(p.x)},${py(p.y)}`).join(" ")}
            strokeWidth={on ? (full ? 3 : 2) : 1}
            strokeLinejoin="round"
            className={on ? "fill-neutral-700 stroke-neutral-100" : "fill-neutral-800 stroke-neutral-600"}
          />
        );
      })}
      {zoneMarks.map((m) => (
        <g key={m.id}>
          <text x={m.lx} y={m.ly} textAnchor="middle" dominantBaseline="middle" fontSize={camFs} fontWeight={700}
            className={cn("font-mono", m.id === litCamera ? "fill-neutral-100" : "fill-neutral-500")}>
            {m.id.replace("Cam-", "C")}
          </text>
          {persons && (
            // A small person glyph and the headcount in this camera's zone.
            <g transform={`translate(${m.hx} ${m.hy})`} className="fill-info">
              <circle cx={full ? -14 : -8} cy={full ? -4 : -2.5} r={full ? 3.5 : 2} />
              <path d={full ? "M -20 4 a 6 5 0 0 1 12 0 z" : "M -11.5 2.5 a 3.5 3 0 0 1 7 0 z"} />
              <text x={full ? -4 : -2.5} y={full ? 4 : 2.5} fontSize={full ? 16 : 9} fontWeight={700} className="fill-info font-mono">{persons[m.id] ?? 0}</text>
            </g>
          )}
        </g>
      ))}

      {poses.map(({ id, pose }) => (
        <g key={id}>
          <path d="M -9 -7 L 11 0 L -9 7 Z" transform={`translate(${px(pose.x)} ${py(pose.y)}) rotate(${(Math.atan2(-pose.dy, pose.dx) * 180) / Math.PI})`} className="fill-neutral-400" />
          <text x={px(pose.x)} y={py(pose.y) + 22} textAnchor="middle" fontSize={12} className="fill-neutral-400 font-mono">{id}</text>
        </g>
      ))}

      {/* Trails, the selected one on top. */}
      {[...order].reverse().map((st) => (
        <polyline
          key={`t-${st.track.id}`}
          points={st.trail.map((p) => `${px(p.x)},${py(p.y)}`).join(" ")}
          fill="none"
          strokeWidth={st === focused ? (full ? 4 : 2.5) : full ? 2 : 1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={faded(st) ? (full ? "6 6" : "3 3") : undefined}
          className="fill-none stroke-sev-critical"
          opacity={faded(st) ? 0.3 : 0.85}
        />
      ))}

      {/* Dots, then labels over everything so no label is hidden under a dot. */}
      {[...order].reverse().map((st) => {
        const r = dotR(st);
        const t = r * 2.4;
        return (
          <g
            key={`d-${st.track.id}`}
            // Positions update every half second — the transform eases between them.
            style={{ transform: `translate(${px(st.pos.x)}px, ${py(st.pos.y)}px)`, transition: "transform 500ms linear" }}
            className={cn(onPick && "cursor-pointer")}
            opacity={faded(st) ? 0.4 : 1}
            onClick={() => onPick?.(st.track.id)}
          >
            {st === focused && (
              <>
                <circle r={t} className="animate-pulse fill-sev-critical/20 stroke-none" />
                {/* Target brackets, so the selection reads even where trails cross. */}
                <path
                  d={`M ${-t} ${-t / 2} V ${-t} H ${-t / 2} M ${t / 2} ${-t} H ${t} V ${-t / 2} M ${t} ${t / 2} V ${t} H ${t / 2} M ${-t / 2} ${t} H ${-t} V ${t / 2}`}
                  fill="none"
                  strokeWidth={full ? 2.5 : 1.5}
                  className="stroke-neutral-100"
                />
              </>
            )}
            <circle r={r} strokeWidth={st === focused ? (full ? 2.5 : 1.5) : 1.5}
              className={cn("fill-sev-critical", st === focused ? "stroke-neutral-100" : "stroke-neutral-950")} />
          </g>
        );
      })}
      {[...order].reverse().map((st) => {
        const box = labels[st.track.id];
        const x = px(st.pos.x);
        const y = py(st.pos.y);
        const sel = st === focused;
        // The leader runs to the chip's nearest point.
        const lx = Math.max(box.x, Math.min(x, box.x + box.w));
        const ly = Math.max(box.y, Math.min(y, box.y + box.h));
        return (
          <g key={`l-${st.track.id}`} opacity={faded(st) ? 0.45 : 1} className={cn(onPick && "cursor-pointer")} onClick={() => onPick?.(st.track.id)}>
            {box.far && <line x1={x} y1={y} x2={lx} y2={ly} strokeWidth={1} className="stroke-sev-critical" />}
            <rect x={box.x} y={box.y} width={box.w} height={box.h} rx={full ? 5 : 3} strokeWidth={1}
              className={sel ? "fill-sev-critical stroke-neutral-100" : "fill-neutral-950 stroke-sev-critical"} />
            <text x={box.x + box.w / 2} y={box.y + box.h / 2} textAnchor="middle" dominantBaseline="central" fontSize={fs} fontWeight={700}
              className={cn("font-mono", sel ? "fill-neutral-50" : "fill-sev-critical")}>
              {chipText(st)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ── Weapon badges on camera tiles ────────────────────────────────────── */

export function WeaponBadges({
  states,
  pinnedId,
  onPin,
  size = "sm",
}: {
  states: TrackState[];
  pinnedId: string | null;
  onPin: (trackId: string) => void;
  size?: "sm" | "md";
}) {
  if (states.length === 0) return null;
  return (
    <>
      {states.map((st) => {
        const pinned = st.track.id === pinnedId;
        return (
          <button
            key={st.track.id}
            type="button"
            title={pinned ? `Clear the highlight on ${st.track.id}` : `Show ${st.track.id} on its Re-ID map`}
            onClick={(e) => {
              e.stopPropagation();
              onPin(st.track.id);
            }}
            className={cn(
              "inline-flex items-center gap-1 rounded-md border font-mono font-bold backdrop-blur-sm transition-colors",
              size === "md" ? "px-2 py-0.5 text-2xs" : "px-1.5 py-px text-3xs",
              pinned
                ? "border-sev-critical bg-sev-critical text-white"
                : "border-sev-critical/60 bg-black/70 text-sev-critical hover:bg-sev-critical hover:text-white"
            )}
          >
            <Crosshair className={size === "md" ? "size-3" : "size-2.5"} />
            {st.track.id}
            {size === "md" && " in view"}
          </button>
        );
      })}
    </>
  );
}

/* ── Rail panel ───────────────────────────────────────────────────────── */

export function TrackRow({ st, map, pinned, onPin }: { st: TrackState; map: ReidMap | undefined; pinned: boolean; onPin: () => void }) {
  return (
    <button
      type="button"
      onClick={onPin}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left transition-colors",
        pinned ? "border-sev-critical/50 bg-sev-critical/10" : "border-border bg-background hover:border-primary/40"
      )}
    >
      <Crosshair className={cn("size-4 flex-shrink-0", pinned ? "text-sev-critical" : st.cameraId ? "text-warning" : "text-muted-foreground")} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">
          <span className="font-mono">{st.track.id}</span>
          <span className="font-normal text-muted-foreground"> · {st.track.weapon ?? "Unregistered"}</span>
        </p>
        <p className="truncate text-2xs text-muted-foreground">
          {trackWhere(st)}
          {map ? ` · ${map.name}` : ""}
        </p>
      </div>
      <span className={cn("flex size-6 flex-shrink-0 items-center justify-center rounded", pinned ? "text-sev-critical" : "text-muted-foreground")} aria-hidden>
        {pinned ? <PinOff className="size-3.5" /> : <Pin className="size-3.5" />}
      </span>
    </button>
  );
}

export function TrackingPanel({
  maps,
  states,
  shownMap,
  reason,
  heroCameraId,
  pinnedId,
  onPin,
  onPickMap,
  onExpand,
}: {
  maps: ReidMap[];
  states: TrackState[];
  shownMap: ReidMap | null;
  reason: string;
  heroCameraId: string;
  pinnedId: string | null;
  onPin: (trackId: string) => void;
  onPickMap: (mapId: string) => void;
  onExpand: () => void;
}) {
  const byMap = (id: string) => states.filter((s) => s.mapId === id);
  const onShown = shownMap ? byMap(shownMap.id) : [];
  // The mini map draws only the weapon in focus: the pinned one, else what's in the main camera.
  const matched = onShown.filter((s) => (pinnedId ? s.track.id === pinnedId : s.cameraId === heroCameraId));
  const focus = matched.length || pinnedId ? matched : onShown.slice(0, 1);
  const hiddenCount = onShown.length - focus.length;
  const ordered = [...states].sort(
    (a, b) =>
      Number(b.track.id === pinnedId) - Number(a.track.id === pinnedId) ||
      Number(b.mapId === shownMap?.id) - Number(a.mapId === shownMap?.id) ||
      a.track.id.localeCompare(b.track.id)
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-shrink-0 space-y-1.5 px-3 pb-2">
        <p className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground">
          Active weapon tracks · {states.length}
        </p>
        {ordered.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
            No weapons are being tracked on any Re-ID map.
          </p>
        ) : (
          ordered.map((st) => (
            <TrackRow
              key={st.track.id}
              st={st}
              map={maps.find((m) => m.id === st.mapId)}
              pinned={st.track.id === pinnedId}
              onPin={() => onPin(st.track.id)}
            />
          ))
        )}
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto border-t border-border px-3 py-3">
        <div className="flex items-center gap-1.5">
          <Select value={shownMap?.id ?? ""} onValueChange={onPickMap}>
            <SelectTrigger className="h-8 min-w-0 flex-1 text-xs" aria-label="Re-ID map">
              <SelectValue placeholder="Pick a map" />
            </SelectTrigger>
            <SelectContent>
              {maps.map((m) => {
                const n = byMap(m.id).length;
                return (
                  <SelectItem key={m.id} value={m.id}>
                    <span className="flex items-center gap-2">
                      {mapLabel(m)}
                      <span className={cn("text-2xs", n ? "text-warning" : "text-muted-foreground")}>
                        · {n ? `${n} track${n === 1 ? "" : "s"}` : "idle"}
                      </span>
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" className="size-8" onClick={onExpand} disabled={!shownMap} aria-label="Enlarge map">
            <Maximize2 className="size-3.5" />
          </Button>
        </div>
        <p className="text-2xs text-muted-foreground">{reason}</p>

        {shownMap ? (
          <>
            <button
              type="button"
              onClick={onExpand}
              aria-label="Enlarge map"
              className="block w-full overflow-hidden rounded-lg border border-border transition-colors hover:border-primary/50"
            >
              <TrackMap map={shownMap} states={focus} focusId={pinnedId ?? focus[0]?.track.id ?? null} highlightCameraId={heroCameraId} size="mini" />
            </button>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-2xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="h-0.5 w-3 bg-sev-critical" /> last {TRAIL_SEC} s</span>
              <span className="flex items-center gap-1"><span className="size-2.5 rounded-sm border border-neutral-100 bg-neutral-700" /> camera in view</span>
              {hiddenCount > 0 && (
                <button type="button" onClick={onExpand} className="ml-auto font-semibold text-primary hover:underline">
                  +{hiddenCount} more on this map
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
            <MapPinned className="size-4" />
            {heroCameraId ? `${heroCameraId} isn't on a Re-ID map.` : "No Re-ID map yet."} Pick a map above to view one.
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Enlarged map ─────────────────────────────────────────────────────── */

export function MapExpandModal({
  open,
  map,
  states,
  heroCameraId,
  pinnedId,
  onPin,
  hint = "Click a weapon on the map or in the list to follow it — the main camera switches to wherever it is.",
  persons,
  onClose,
}: {
  open: boolean;
  map: ReidMap | null;
  states: TrackState[];
  heroCameraId: string;
  pinnedId: string | null;
  onPin: (trackId: string) => void;
  /** What clicking a weapon does on the host page. */
  hint?: string;
  /** People in each camera's zone, drawn on the map when given. */
  persons?: Record<string, number>;
  onClose: () => void;
}) {
  if (!map) return null;
  const onMap = states.filter((s) => s.mapId === map.id);
  return (
    <Modal open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent size="full">
        <ModalHeader
          icon={MapPinned}
          title={mapLabel(map)}
          description={`${map.modelName} · ${map.cameraIds.length} cameras · ${onMap.length} weapon${onMap.length === 1 ? "" : "s"} on this map, trails for the last ${TRAIL_SEC} s`}
        />
        <ModalBody>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
            <div className="overflow-hidden rounded-lg border border-border">
              <TrackMap map={map} states={onMap} focusId={pinnedId} highlightCameraId={heroCameraId} size="full" persons={persons} onPick={onPin} />
            </div>
            <div className="space-y-2">
              <p className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground">Weapons on this map</p>
              {onMap.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
                  No weapons on this map right now.
                </p>
              ) : (
                onMap.map((st) => (
                  <TrackRow key={st.track.id} st={st} map={map} pinned={st.track.id === pinnedId} onPin={() => onPin(st.track.id)} />
                ))
              )}
              <p className="pt-1 text-2xs text-muted-foreground">{hint}</p>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
