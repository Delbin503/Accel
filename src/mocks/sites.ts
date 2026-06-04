import type { SiteData } from "@/types/sites";

export const SITE_ACCENT_COLORS = [
  "linear-gradient(135deg, rgba(221,114,36,0.25) 0%, rgba(255,139,55,0.12) 100%)",
  "linear-gradient(135deg, rgba(80,140,180,0.25) 0%, rgba(120,170,210,0.12) 100%)",
  "linear-gradient(135deg, rgba(140,80,180,0.22) 0%, rgba(170,120,210,0.10) 100%)",
  "linear-gradient(135deg, rgba(80,180,140,0.20) 0%, rgba(120,210,170,0.10) 100%)",
];

export const AREA_PALETTE = [
  "#DD7224", "#508CB4", "#8C50B4", "#50B48C", "#FEAA01", "#E15554", "#3FB8AF", "#6B7280",
];

function floorPlanSvgDataUrl(): string {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid meet">
  <defs>
    <pattern id="g" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M40 0 L0 0 0 40" fill="none" stroke="rgba(150,150,170,0.12)" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="1200" height="800" fill="#0f1115"/>
  <rect width="1200" height="800" fill="url(#g)"/>
  <g stroke="rgba(220,220,240,0.45)" stroke-width="3" fill="none">
    <rect x="60" y="60" width="1080" height="680" rx="6"/>
    <line x1="60" y1="280" x2="540" y2="280"/>
    <line x1="540" y1="60" x2="540" y2="500"/>
    <line x1="540" y1="500" x2="1140" y2="500"/>
    <line x1="820" y1="60" x2="820" y2="500"/>
    <line x1="820" y1="280" x2="1140" y2="280"/>
    <line x1="300" y1="280" x2="300" y2="500"/>
    <line x1="60" y1="500" x2="540" y2="500"/>
    <line x1="300" y1="640" x2="820" y2="640"/>
  </g>
  <g fill="rgba(200,200,220,0.55)" font-family="Manrope,sans-serif" font-size="22" font-weight="600">
    <text x="270" y="180">Lobby</text>
    <text x="660" y="180">Reception</text>
    <text x="940" y="180">Meeting A</text>
    <text x="160" y="400">Office Floor</text>
    <text x="400" y="400">Lab</text>
    <text x="660" y="400">Server Room</text>
    <text x="940" y="400">Storage</text>
    <text x="160" y="620">Mech Yard</text>
    <text x="560" y="620">Loading Bay</text>
    <text x="940" y="620">Parking</text>
  </g>
  <g stroke="rgba(220,220,240,0.25)" stroke-width="2" fill="none" stroke-dasharray="6 6">
    <path d="M280 280 L280 220 M820 280 L820 220 M540 380 L600 380"/>
  </g>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const FLOOR_PLAN = floorPlanSvgDataUrl();

export const MOCK_SITES_FULL: SiteData[] = [
  {
    id: "astra",
    name: "Astra HQ",
    address: "8 Marina Boulevard, Singapore 018984",
    timezone: "Asia/Singapore",
    operatingHours: { from: "08:00", to: "20:00" },
    description: "Corporate headquarters with mixed-use lobby, labs and office floors.",
    status: "active",
    floorPlan: { imageUrl: FLOOR_PLAN, label: "Level 1 — Main Floor", width: 1200, height: 800 },
    areas: [
      { id: "astra-hq-lobby",   name: "HQ Lobby",    color: "#DD7224", points: [[0.04, 0.07], [0.45, 0.07], [0.45, 0.36], [0.04, 0.36]] },
      { id: "astra-meeting",    name: "Meeting A",   color: "#508CB4", points: [[0.69, 0.07], [0.95, 0.07], [0.95, 0.36], [0.69, 0.36]] },
      { id: "astra-lab-3",      name: "Lab 3",       color: "#8C50B4", points: [[0.25, 0.36], [0.45, 0.36], [0.45, 0.63], [0.25, 0.63]] },
      { id: "astra-server",     name: "Server Room", color: "#50B48C", points: [[0.45, 0.36], [0.68, 0.36], [0.68, 0.63], [0.45, 0.63]] },
      { id: "astra-parking-p1", name: "Parking P1",  color: "#FEAA01", points: [[0.68, 0.63], [0.95, 0.63], [0.95, 0.92], [0.68, 0.92]] },
    ],
    cameraPlacements: {
      "Cam-01": { x: 0.22, y: 0.20, rotation: 180 },
      "Cam-08": { x: 0.36, y: 0.30, rotation: 225 },
      "Cam-13": { x: 0.32, y: 0.50, rotation: 0 },
      "Cam-16": { x: 0.56, y: 0.50, rotation: 90 },
    },
    createdAt: "2025-09-12T10:00:00",
    createdAtDisplay: "12 Sep 2025",
    accent: SITE_ACCENT_COLORS[0],
  },
  {
    id: "fedex",
    name: "FedEx Changi",
    address: "12 Changi North Way, Singapore 498748",
    timezone: "Asia/Singapore",
    operatingHours: { from: "00:00", to: "23:59" },
    description: "Logistics hub with loading bays and outdoor yard surveillance.",
    status: "active",
    floorPlan: { imageUrl: FLOOR_PLAN, label: "Bay 3 — Ground Level", width: 1200, height: 800 },
    areas: [
      { id: "fedex-loading-bay-3", name: "Loading Bay 3", color: "#508CB4", points: [[0.05, 0.20], [0.60, 0.20], [0.60, 0.70], [0.05, 0.70]] },
      { id: "fedex-checkpoint-c",  name: "Checkpoint C1", color: "#DD7224", points: [[0.62, 0.20], [0.95, 0.20], [0.95, 0.50], [0.62, 0.50]] },
    ],
    cameraPlacements: {
      "Cam-04": { x: 0.20, y: 0.45, rotation: 270 },
      "Cam-07": { x: 0.42, y: 0.50, rotation: 0 },
    },
    createdAt: "2025-11-04T08:30:00",
    createdAtDisplay: "04 Nov 2025",
    accent: SITE_ACCENT_COLORS[1],
  },
  {
    id: "sembawang",
    name: "Sembawang Naval",
    address: "Deptford Road, Sembawang, Singapore",
    timezone: "Asia/Singapore",
    operatingHours: { from: "06:00", to: "22:00" },
    description: "Restricted naval compound — armouries, medical bay and perimeter checkpoints.",
    status: "active",
    floorPlan: null,
    areas: [
      { id: "sembawang-armoury-a", name: "Armoury A",     color: "#E15554", points: [] },
      { id: "sembawang-medical",   name: "Medical Bay 2", color: "#3FB8AF", points: [] },
    ],
    cameraPlacements: {},
    createdAt: "2025-12-20T14:15:00",
    createdAtDisplay: "20 Dec 2025",
    accent: SITE_ACCENT_COLORS[2],
  },
];

export function findSiteById(id: string): SiteData | null {
  return MOCK_SITES_FULL.find((s) => s.id === id) ?? null;
}

export function makeBlankSite(name: string, accent: string): SiteData {
  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `site-${Date.now()}`;
  const today = new Date();
  return {
    id,
    name,
    address: "",
    timezone: "Asia/Singapore",
    status: "setup",
    floorPlan: null,
    areas: [],
    cameraPlacements: {},
    createdAt: today.toISOString(),
    createdAtDisplay: today.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    accent,
  };
}

export function generatedFloorPlan() {
  return FLOOR_PLAN;
}
