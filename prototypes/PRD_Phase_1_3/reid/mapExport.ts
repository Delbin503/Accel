import type { CameraData } from "@/types/cameras";
import { LINK_MARKERS, OUTLIER_CM, SITE_MARKERS, cameraPose, floorZone, mapGroups } from "./calibrationGeometry";
import { mapLabel, type ReidMap } from "./reidMaps";

/* Exports of a calibrated Re-ID map — the calibration as JSON, and the drawn
   map as a PNG. Both run in the browser; nothing is sent anywhere. */

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function mapFileName(map: ReidMap, ext: string): string {
  return `${slug(`${map.siteName} ${map.name}`)}-calibration.${ext}`;
}

/** The calibration a deployment runs on: every camera's pose, its markers and its floor zone. */
export function mapCalibration(map: ReidMap, cameras: CameraData[]) {
  const byId = new Map(SITE_MARKERS.map((m) => [m.id, m]));
  const used = new Set(Object.values(map.used).flat());
  return {
    format: "accel.reid-calibration/v1",
    exportedAt: new Date().toISOString(),
    map: { id: map.id, name: map.name, site: map.siteName, model: map.modelName, label: mapLabel(map) },
    units: "metres from the site origin; x east, y north",
    fit: { outlierCm: OUTLIER_CM, linkMarkers: LINK_MARKERS },
    groups: mapGroups(map.used),
    markers: [...used].sort().map((id) => {
      const m = byId.get(id);
      return { id, x: m?.x ?? null, y: m?.y ?? null };
    }),
    cameras: map.cameraIds.map((id) => {
      const cam = cameras.find((c) => c.id === id);
      const pose = cameraPose(id);
      const positions = map.positions?.[id] ?? {};
      return {
        id,
        name: cam?.name ?? id,
        area: cam?.areaName ?? null,
        pose: { x: pose.x, y: pose.y, heading: { dx: +pose.dx.toFixed(4), dy: +pose.dy.toFixed(4) } },
        markers: map.used[id] ?? [],
        corrected: positions,
        zone: floorZone(map.used[id] ?? [], positions).map((m) => ({ id: m.id, x: m.x, y: m.y })),
      };
    }),
  };
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportMapJson(map: ReidMap, cameras: CameraData[]) {
  const json = JSON.stringify(mapCalibration(map, cameras), null, 2);
  download(new Blob([json], { type: "application/json" }), mapFileName(map, "json"));
}

/* The map is styled by utility classes, which a standalone image doesn't have —
   copy each element's computed paint onto the clone before rasterising. */
const PAINT = ["fill", "fill-opacity", "stroke", "stroke-width", "stroke-opacity", "opacity", "font-family", "font-size", "font-weight"];

export async function exportMapPng(svg: SVGSVGElement, map: ReidMap, scale = 2) {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  const src = [svg, ...svg.querySelectorAll("*")];
  const dst = [clone, ...clone.querySelectorAll("*")];
  src.forEach((el, i) => {
    const cs = getComputedStyle(el);
    const target = dst[i] as SVGElement;
    target.removeAttribute("class");
    target.setAttribute("style", PAINT.map((p) => `${p}:${cs.getPropertyValue(p)}`).join(";"));
  });
  const vb = svg.viewBox.baseVal;
  clone.setAttribute("width", String(vb.width));
  clone.setAttribute("height", String(vb.height));
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");

  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], { type: "image/svg+xml" }));
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Couldn't render the map"));
      img.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = vb.width * scale;
    canvas.height = vb.height * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/png"));
    if (!blob) throw new Error("Couldn't encode the PNG");
    download(blob, mapFileName(map, "png"));
  } finally {
    URL.revokeObjectURL(url);
  }
}
