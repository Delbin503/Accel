import { MousePointer2, Video } from "lucide-react";
import { cn } from "@/lib/utils";

/* ── "How to draw an area" demo — cycles through clicking each corner ──── */

const DRAW_AREA_POINTS: [number, number][] = [
  [30, 30],
  [170, 30],
  [170, 110],
  [30, 110],
];
export const DRAW_AREA_FRAME_COUNT = DRAW_AREA_POINTS.length + 1;

export function renderDrawAreaFrame(frame: number) {
  const closed = frame === DRAW_AREA_FRAME_COUNT - 1;
  const pointsShown = closed ? DRAW_AREA_POINTS.length : frame + 1;
  const cursor = DRAW_AREA_POINTS[closed ? 0 : pointsShown - 1];
  const path = DRAW_AREA_POINTS.slice(0, pointsShown).map((p) => p.join(",")).join(" ");

  return (
    <svg viewBox="0 0 200 140" className="size-full">
      <rect x="8" y="8" width="184" height="124" rx="8" className="fill-none stroke-border" strokeWidth={1.5} />
      {pointsShown >= 2 && (
        <polygon
          points={path}
          className={cn("transition-all duration-300", closed ? "fill-primary/20 stroke-primary" : "fill-none stroke-primary")}
          strokeWidth={2}
          strokeLinejoin="round"
        />
      )}
      {DRAW_AREA_POINTS.slice(0, pointsShown).map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={4} className="fill-primary" />
      ))}
      <g style={{ transform: `translate(${cursor[0] - 2}px, ${cursor[1] - 2}px)`, transition: "transform 300ms ease-out" }}>
        <foreignObject width={20} height={20} overflow="visible">
          <MousePointer2 className="size-4 text-foreground" />
        </foreignObject>
      </g>
    </svg>
  );
}

/* ── "How to place a camera" demo — drag to the plan, then rotate it ───── */

const CAM_START: [number, number] = [30, 30];
const CAM_TARGET: [number, number] = [100, 70];
const HANDLE_ANGLES_DEG = [0, 100, 220];
export const PLACE_CAMERA_FRAME_COUNT = HANDLE_ANGLES_DEG.length + 1;

export function renderPlaceCameraFrame(frame: number) {
  const atTarget = frame >= 1;
  const pos = atTarget ? CAM_TARGET : CAM_START;
  const angle = HANDLE_ANGLES_DEG[Math.max(0, frame - 1) % HANDLE_ANGLES_DEG.length];

  return (
    <svg viewBox="0 0 200 140" className="size-full">
      <rect x="8" y="8" width="184" height="124" rx="8" className="fill-none stroke-border" strokeWidth={1.5} />
      {!atTarget && (
        <circle cx={CAM_TARGET[0]} cy={CAM_TARGET[1]} r={10} className="fill-none stroke-primary/50" strokeDasharray="3 3" />
      )}
      {atTarget && (
        <line
          x1={pos[0]}
          y1={pos[1]}
          x2={pos[0] + 26 * Math.cos((angle * Math.PI) / 180)}
          y2={pos[1] + 26 * Math.sin((angle * Math.PI) / 180)}
          className="stroke-primary transition-all duration-500 ease-out"
          strokeWidth={3}
          strokeLinecap="round"
        />
      )}
      <g style={{ transform: `translate(${pos[0] - 10}px, ${pos[1] - 10}px)`, transition: "transform 400ms ease-out" }}>
        <foreignObject width={20} height={20} overflow="visible">
          <div className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Video className="size-3" />
          </div>
        </foreignObject>
      </g>
    </svg>
  );
}
