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

/** Distinct tones for the weapons in the enlarged view; the focused one is always critical. */
const OTHER_TONES = ["stroke-warning fill-warning", "stroke-info fill-info", "stroke-purple fill-purple", "stroke-success fill-success"];

function TrackMap({
  map,
  states,
  focusId,
  highlightCameraId,
  size,
  onPick,
}: {
  map: ReidMap;
  /** The weapons to draw. */
  states: TrackState[];
  focusId: string | null;
  highlightCameraId?: string | null;
  size: "mini" | "full";
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
  const py = (y: number) => H - (offY + (y - minY) * scale);
  const tone = (st: TrackState, i: number) =>
    st.track.id === focusId ? "stroke-sev-critical fill-sev-critical" : OTHER_TONES[i % OTHER_TONES.length];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${mapLabel(map)} with ${states.length} weapon${states.length === 1 ? "" : "s"}`} className="block h-auto w-full">
      <rect width={W} height={H} className="fill-neutral-900" />

      {map.cameraIds.map((c) => {
        const z = zones[c];
        if (!z || z.length < 3) return null;
        const on = c === highlightCameraId;
        return (
          <polygon
            key={c}
            points={z.map((m) => `${px(m.x)},${py(m.y)}`).join(" ")}
            strokeWidth={on ? (full ? 3 : 2) : 1}
            strokeLinejoin="round"
            className={on ? "fill-neutral-700 stroke-neutral-100" : "fill-neutral-800 stroke-neutral-600"}
          />
        );
      })}
      {map.cameraIds.map((c) => {
        const z = zones[c];
        if (!z || z.length < 3) return null;
        const cx = z.reduce((s, m) => s + m.x, 0) / z.length;
        const cy = z.reduce((s, m) => s + m.y, 0) / z.length;
        return (
          <text key={c} x={px(cx)} y={py(cy)} textAnchor="middle" dominantBaseline="middle" fontSize={full ? 22 : 11} fontWeight={700}
            className={cn("font-mono", c === highlightCameraId ? "fill-neutral-100" : "fill-neutral-500")}>
            {c.replace("Cam-", "C")}
          </text>
        );
      })}

      {poses.map(({ id, pose }) => (
        <g key={id}>
          <path d="M -9 -7 L 11 0 L -9 7 Z" transform={`translate(${px(pose.x)} ${py(pose.y)}) rotate(${(Math.atan2(-pose.dy, pose.dx) * 180) / Math.PI})`} className="fill-neutral-400" />
          <text x={px(pose.x)} y={py(pose.y) + 22} textAnchor="middle" fontSize={12} className="fill-neutral-400 font-mono">{id}</text>
        </g>
      ))}

      {states.map((st, i) => (
        <polyline
          key={`t-${st.track.id}`}
          points={st.trail.map((p) => `${px(p.x)},${py(p.y)}`).join(" ")}
          fill="none"
          strokeWidth={st.track.id === focusId ? (full ? 3.5 : 2.5) : full ? 2 : 1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={st.track.id === focusId ? undefined : "6 5"}
          className={cn(tone(st, i), "fill-none")}
          opacity={0.85}
        />
      ))}
      {states.map((st, i) => (
        <g
          key={`d-${st.track.id}`}
          // Positions update every half second — the transform eases between them.
          style={{ transform: `translate(${px(st.pos.x)}px, ${py(st.pos.y)}px)`, transition: "transform 500ms linear" }}
          className={cn(onPick && "cursor-pointer")}
          onClick={() => onPick?.(st.track.id)}
        >
          {st.track.id === focusId && <circle r={full ? 14 : 9} className="animate-pulse fill-sev-critical/25 stroke-none" />}
          <circle r={full ? 7 : 4.5} className={cn(tone(st, i), "stroke-neutral-950")} strokeWidth={1.5} />
          <text x={full ? 12 : 8} y={full ? -10 : -6} fontSize={full ? 15 : 10} fontWeight={700} className="fill-neutral-100 font-mono">
            {st.track.id}
            {full && st.cameraId ? ` · ${st.cameraId}` : ""}
          </text>
        </g>
      ))}
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
            title={pinned ? `Following ${st.track.id}` : `Follow ${st.track.id}`}
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

function TrackRow({ st, map, pinned, onPin }: { st: TrackState; map: ReidMap | undefined; pinned: boolean; onPin: () => void }) {
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
  const focus = onShown.filter((s) => (pinnedId ? s.track.id === pinnedId : s.cameraId === heroCameraId));
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
            {heroCameraId} isn't on a Re-ID map. Pick a map above to view one.
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
  onClose,
}: {
  open: boolean;
  map: ReidMap | null;
  states: TrackState[];
  heroCameraId: string;
  pinnedId: string | null;
  onPin: (trackId: string) => void;
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
              <TrackMap map={map} states={onMap} focusId={pinnedId} highlightCameraId={heroCameraId} size="full" onPick={onPin} />
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
              <p className="pt-1 text-2xs text-muted-foreground">
                Click a weapon on the map or in the list to follow it — the main camera switches to wherever it is.
              </p>
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
