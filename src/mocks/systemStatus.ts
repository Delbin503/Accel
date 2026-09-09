/* Server / backend node status — feeds the top-bar System Status menu.
   Cameras and NVRs are derived from their own mocks; servers have no
   device record of their own, so they are seeded here. */

export type ServerStatus = "online" | "degraded" | "offline";

export interface ServerNode {
  id: string;
  name: string;
  role: string;
  status: ServerStatus;
  /** CPU load percentage. */
  loadPct: number;
  uptimeDisplay: string;
}

export const MOCK_SERVERS: ServerNode[] = [
  {
    id: "srv-001",
    name: "Detection Engine",
    role: "Inference · 4× NVIDIA L40S",
    status: "online",
    loadPct: 61,
    uptimeDisplay: "99.971%",
  },
  {
    id: "srv-002",
    name: "API Gateway",
    role: "Application · ap-southeast-1",
    status: "online",
    loadPct: 34,
    uptimeDisplay: "99.998%",
  },
  {
    id: "srv-003",
    name: "Recording Pipeline",
    role: "Ingest · 3 workers",
    status: "online",
    loadPct: 72,
    uptimeDisplay: "99.992%",
  },
  {
    id: "srv-004",
    name: "WebSocket Streams",
    role: "Realtime · Multi-AZ",
    status: "degraded",
    loadPct: 88,
    uptimeDisplay: "99.994%",
  },
];
