import * as React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Crosshair, Maximize2, MapPinned, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { mapLabel, useReidMapsStore } from "./reidMaps";
import { MapExpandModal, TrackMap, TrackRow } from "./ReidTracking";
import { TRAIL_SEC, allTrackStates, personCounts, type TrackState } from "./weaponTracks";

/* Re-ID map for the customizable dashboard — the same mini map Live
   Monitoring's Tracking tab draws, with how many people and weapons are inside
   it right now. Every weapon on the map is drawn (Live Monitoring's mini map
   only draws the one in focus), each zone carries its headcount, and the
   enlarged view is the same modal. Nothing is selected until the viewer picks
   a weapon from the list; the map then sets that one apart. */
export function ReidMapPanel() {
  const navigate = useNavigate();
  const maps = useReidMapsStore((s) => s.maps);
  const [now, setNow] = React.useState(() => Date.now() / 1000);
  React.useEffect(() => {
    const tick = window.setInterval(() => setNow(Date.now() / 1000), 500);
    return () => window.clearInterval(tick);
  }, []);
  const states = React.useMemo(() => allTrackStates(maps, now), [maps, now]);

  const busiest = [...maps].sort((a, b) => states.filter((s) => s.mapId === b.id).length - states.filter((s) => s.mapId === a.id).length)[0];
  const [mapId, setMapId] = React.useState<string | null>(null);
  const map = maps.find((m) => m.id === mapId) ?? busiest ?? null;
  const [pinnedId, setPinnedId] = React.useState<string | null>(null);
  const [open, setOpen] = React.useState(false);

  const onMap: TrackState[] = map ? states.filter((s) => s.mapId === map.id).sort((a, b) => a.track.id.localeCompare(b.track.id)) : [];
  const pinned = onMap.find((s) => s.track.id === pinnedId) ?? null;
  const persons = map ? personCounts(map, states, now) : {};
  const personTotal = Object.values(persons).reduce((t, n) => t + n, 0);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
        <MapPinned className="size-4 shrink-0 text-primary" />
        <span className="text-base font-bold text-foreground">Re-ID Map</span>
        <span className="flex items-center gap-1 text-2xs font-semibold uppercase tracking-wider text-success">
          <span className="size-1.5 animate-pulse rounded-full bg-success" />Live
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <Select value={map?.id ?? ""} onValueChange={(v) => { setMapId(v); setPinnedId(null); }}>
            <SelectTrigger className="h-8 w-56 text-xs" aria-label="Re-ID map">
              <SelectValue placeholder="Pick a map" />
            </SelectTrigger>
            <SelectContent>
              {maps.map((m) => {
                const n = states.filter((s) => s.mapId === m.id).length;
                return (
                  <SelectItem key={m.id} value={m.id}>
                    {mapLabel(m)} <span className={cn("text-2xs", n ? "text-warning" : "text-muted-foreground")}>· {n ? `${n} weapon${n === 1 ? "" : "s"}` : "idle"}</span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" className="size-8" onClick={() => setOpen(true)} disabled={!map} aria-label="Enlarge map">
            <Maximize2 className="size-3.5" />
          </Button>
          <Button variant="ghost" className="gap-1 text-sm" onClick={() => navigate("/reid/live")}>
            Live Monitoring <ArrowUpRight className="size-3" />
          </Button>
        </div>
      </div>

      {!map ? (
        <div className="flex flex-col items-center gap-2 px-4 py-10 text-center text-sm text-muted-foreground">
          <MapPinned className="size-5" />
          No Re-ID map deployed yet. Deploy the Re-ID model with a calibrated site map to see it here.
        </div>
      ) : (
        /* Three columns when wide — counts, map, the weapons on it —
           stretched to one height; stacked when narrow. */
        <div className="grid grid-cols-1 gap-4 p-4 @3xl:grid-cols-[minmax(0,180px)_minmax(0,1fr)_minmax(0,320px)]">
          <div className="grid grid-cols-2 gap-3 @3xl:grid-cols-1 @3xl:grid-rows-2">
            <div className="relative flex flex-col overflow-hidden rounded-xl border border-border bg-background p-4">
              <div className="absolute inset-x-0 top-0 h-0.5 bg-info" />
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"><Users className="size-3.5 text-info" />Persons</p>
              <p className="mt-2 text-4xl font-bold leading-none text-info">{personTotal}</p>
              <p className="mt-auto pt-2 text-2xs text-muted-foreground">inside the map now</p>
            </div>
            <div className="relative flex flex-col overflow-hidden rounded-xl border border-border bg-background p-4">
              <div className="absolute inset-x-0 top-0 h-0.5 bg-sev-critical" />
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"><Crosshair className="size-3.5 text-sev-critical" />Weapons</p>
              <p className={cn("mt-2 text-4xl font-bold leading-none", onMap.length ? "text-sev-critical" : "text-foreground")}>{onMap.length}</p>
              <p className="mt-auto pt-2 text-2xs text-muted-foreground">tracked on this map</p>
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-2">
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Enlarge map"
              // Capped in height when wide, so the panel stays compact; the map keeps its shape, centred.
              className="block w-full overflow-hidden rounded-lg border border-border bg-neutral-900 transition-colors hover:border-primary/50 @3xl:h-72 @3xl:[&>svg]:h-full"
            >
              <TrackMap map={map} states={onMap} focusId={pinned?.track.id ?? null} size="mini" persons={persons} />
            </button>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-2xs text-muted-foreground">
              <span className="flex items-center gap-1"><Users className="size-3 text-info" />people in each camera's zone</span>
              <span className="flex items-center gap-1"><span className="h-0.5 w-3 bg-sev-critical" />weapon, last {TRAIL_SEC} s</span>
              {pinned && <span className="flex items-center gap-1"><span className="size-2 rounded-full border border-neutral-100 bg-sev-critical" />{pinned.track.id} selected</span>}
            </div>
          </div>

          {/* Out of flow when wide, so a long list scrolls instead of stretching the row. */}
          <div className="relative min-w-0">
            <div className="flex max-h-80 min-w-0 flex-col rounded-xl border border-border bg-background @3xl:absolute @3xl:inset-0 @3xl:max-h-none">
              <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
                <p className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground">Weapons on this map · {onMap.length}</p>
                {pinned && (
                  <button type="button" onClick={() => setPinnedId(null)} className="text-2xs font-semibold text-primary hover:underline">Clear selection</button>
                )}
              </div>
              {/* The same rows as the enlarged map's list; picking one highlights it on the map. */}
              {onMap.length === 0 ? (
                <p className="m-3 rounded-lg border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">No weapons on this map right now.</p>
              ) : (
                <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3">
                  {onMap.map((st) => (
                    <TrackRow key={st.track.id} st={st} map={map} pinned={st.track.id === pinnedId}
                      onPin={() => setPinnedId(st.track.id === pinnedId ? null : st.track.id)} />
                  ))}
                  <p className="pt-0.5 text-2xs text-muted-foreground">Click a weapon to highlight it on the map.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <MapExpandModal
        open={open && !!map}
        map={map}
        states={states}
        heroCameraId=""
        pinnedId={pinnedId}
        onPin={(id) => setPinnedId(id === pinnedId ? null : id)}
        persons={persons}
        hint="Click a weapon to highlight it. Open Live Monitoring to follow it on the cameras."
        onClose={() => setOpen(false)}
      />
    </div>
  );
}
