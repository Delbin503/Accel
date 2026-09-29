import { MapPin } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import CamerasPage, { type CameraExtraColumn } from "@/pages/site/cameras";
import { cn } from "@/lib/utils";
import type { CameraData } from "@/types/cameras";
import { stationName, stationsForCamera, type StationStint } from "./trmsData";

/* Devices — the app's Cameras page, with one TRMS column added: how many base
   stations each camera has covered, and on hover, which ones and when. The
   drawer lists the same stations under Device Info. */

/** Every station a camera has been mounted at, current first. */
function StationList({ stints, className }: { stints: StationStint[]; className?: string }) {
  return (
    <ul className={cn("divide-y divide-border", className)}>
      {stints.map((s, i) => (
        <li key={s.stationId + s.from} className="flex items-start gap-2 px-3 py-2">
          <MapPin className={cn("mt-0.5 size-3 shrink-0", i === 0 ? "text-primary" : "text-muted-foreground")} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-foreground">{stationName(s.stationId)}</p>
            <p className="font-mono text-2xs text-muted-foreground">
              {s.from} – {s.to ?? "now"}
            </p>
          </div>
          {i === 0 && (
            <span className="shrink-0 rounded border border-primary/30 bg-primary/10 px-1.5 py-px text-3xs font-bold uppercase tracking-wider text-primary">
              Current
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

const stationCount = (n: number) => `${n} station${n === 1 ? "" : "s"}`;

/* Table cell — the count only; which stations, and when, on hover. */
function StationsCell({ camera }: { camera: CameraData }) {
  const stints = stationsForCamera(camera.id);
  if (stints.length === 0) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={`${camera.id} has covered ${stationCount(stints.length)}`}
          className="inline-flex items-center gap-1 whitespace-nowrap rounded-md border border-border bg-muted/40 px-2 py-1 text-xs transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="font-mono font-semibold text-foreground">{stints.length}</span>
          <span className="text-muted-foreground">station{stints.length === 1 ? "" : "s"}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="left" className="w-72 p-0">
        <div className="border-b border-border px-3 py-2">
          <p className="text-xs font-semibold text-foreground">Stations — {camera.id}</p>
          <p className="text-2xs text-muted-foreground">Every base station this camera has been mounted at.</p>
        </div>
        <StationList stints={stints} />
      </TooltipContent>
    </Tooltip>
  );
}

/* Drawer — the same list, always open, under Device Info. */
function StationsField({ camera }: { camera: CameraData }) {
  const stints = stationsForCamera(camera.id);
  if (stints.length === 0) {
    return <span className="text-sm text-muted-foreground">Not mounted at a station yet.</span>;
  }
  return (
    <div className="overflow-hidden rounded-md border border-border bg-muted/20">
      <p className="border-b border-border px-3 py-1.5 text-2xs text-muted-foreground">
        {stationCount(stints.length)} covered
      </p>
      <StationList stints={stints} />
    </div>
  );
}

const STATION_COLUMN: CameraExtraColumn = {
  header: "STATIONS",
  cell: (camera) => <StationsCell camera={camera} />,
  drawerLabel: "Stations",
  drawerCell: (camera) => <StationsField camera={camera} />,
};

export function TrmsDevices() {
  return (
    <CamerasPage
      title="Devices"
      description="Cameras across every base station — feeds, NVR linkage, and the stations each one has covered."
      extraColumns={[STATION_COLUMN]}
    />
  );
}
