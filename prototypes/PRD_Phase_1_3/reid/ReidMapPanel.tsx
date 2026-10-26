import * as React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Crosshair, Maximize2, MapPinned, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { mapLabel, useReidMapsStore } from "./reidMaps";
import { MapExpandModal, TrackMap } from "./ReidTracking";
import { TRAIL_SEC, allTrackStates, personCounts, trackWhere, type TrackState } from "./weaponTracks";

/* Re-ID map for the customizable dashboard — the same mini map Live
   Monitoring's Tracking tab draws, with how many people and weapons are inside
   it right now. Every weapon on the map is drawn (Live Monitoring's mini map
   only draws the one in focus), each zone carries its headcount, and the
   enlarged view is the same modal. */
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

  const onMap: TrackState[] = map ? states.filter((s) => s.mapId === map.id) : [];
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
        <div className="grid grid-cols-1 gap-4 p-4 @3xl:grid-cols-[minmax(0,400px)_minmax(0,1fr)]">
          {/* Kept near the size Live Monitoring's rail draws it, so the labels read the same. */}
          <div className="mx-auto flex w-full max-w-[400px] flex-col gap-2">
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Enlarge map"
              className="block w-full overflow-hidden rounded-lg border border-border transition-colors hover:border-primary/50"
            >
              <TrackMap map={map} states={onMap} focusId={pinnedId ?? onMap[0]?.track.id ?? null} size="mini" persons={persons} />
            </button>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-2xs text-muted-foreground">
              <span className="flex items-center gap-1"><Users className="size-3 text-info" />people in each camera's zone</span>
              <span className="flex items-center gap-1"><span className="h-0.5 w-3 bg-sev-critical" />weapon, last {TRAIL_SEC} s</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="relative overflow-hidden rounded-xl border border-border bg-background p-3">
                <div className="absolute inset-x-0 top-0 h-0.5 bg-info" />
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Persons</p>
                <p className="mt-1 text-3xl font-bold leading-none text-info">{personTotal}</p>
                <p className="mt-1.5 text-2xs text-muted-foreground">inside the map now</p>
              </div>
              <div className="relative overflow-hidden rounded-xl border border-border bg-background p-3">
                <div className="absolute inset-x-0 top-0 h-0.5 bg-sev-critical" />
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Weapons</p>
                <p className={cn("mt-1 text-3xl font-bold leading-none", onMap.length ? "text-sev-critical" : "text-foreground")}>{onMap.length}</p>
                <p className="mt-1.5 text-2xs text-muted-foreground">tracked on this map</p>
              </div>
            </div>

            <div className="min-w-0">
              <p className="mb-1.5 text-2xs font-semibold uppercase tracking-widest text-muted-foreground">By camera</p>
              <ul className="grid grid-cols-1 gap-1 @md:grid-cols-2 @3xl:grid-cols-1">
                {map.cameraIds.map((c) => {
                  const armed = onMap.filter((s) => s.cameraId === c);
                  return (
                    <li key={c} className={cn("flex items-center gap-2 rounded-md border px-2.5 py-1.5", armed.length ? "border-sev-critical/40 bg-sev-critical/5" : "border-border bg-background")}>
                      <span className="font-mono text-xs font-semibold text-foreground">{c}</span>
                      <span className="ml-auto flex items-center gap-1 font-mono text-xs text-info"><Users className="size-3" />{persons[c] ?? 0}</span>
                      <span className={cn("flex items-center gap-1 font-mono text-xs", armed.length ? "text-sev-critical" : "text-muted-foreground")}>
                        <Crosshair className="size-3" />{armed.length}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>

            {onMap.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {onMap.map((st) => (
                  <button
                    key={st.track.id}
                    type="button"
                    title={trackWhere(st)}
                    onClick={() => setPinnedId(st.track.id === pinnedId ? null : st.track.id)}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 font-mono text-2xs font-bold transition-colors",
                      st.track.id === (pinnedId ?? onMap[0]?.track.id) ? "border-sev-critical bg-sev-critical text-white" : "border-sev-critical/50 text-sev-critical hover:bg-sev-critical/10"
                    )}
                  >
                    <Crosshair className="size-2.5" />{st.track.id} · {st.cameraId ?? "between cameras"}
                  </button>
                ))}
              </div>
            )}
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
