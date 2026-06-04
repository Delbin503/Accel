import { create } from "zustand";
import { persist } from "zustand/middleware";

export type NotificationKind = "incident" | "case" | "system" | "user" | "billing";

export interface NotificationItem {
  id: string;
  kind: NotificationKind;
  title: string;
  description: string;
  /** ISO timestamp — used for date filtering and relative-time labels. */
  createdAt: string;
  /** Optional deep link path within the app. */
  href?: string;
  read: boolean;
}

interface NotificationsState {
  items: NotificationItem[];
  unreadCount: () => number;
  markRead: (id: string) => void;
  markAllRead: () => void;
  add: (n: Omit<NotificationItem, "id" | "read" | "createdAt"> & { id?: string; read?: boolean; createdAt?: string }) => void;
  remove: (id: string) => void;
}

/* Seed entries — deterministic so the prototype always shows the bell badge.
 * Covers every module that can raise a notification in the dashboard so the
 * drawer demonstrates the full notification surface. */
const SEED: NotificationItem[] = [
  /* ── Today ────────────────────────────────────────────────────── */
  {
    id: "n-001",
    kind: "incident",
    title: "Critical incident raised — Armoury-B",
    description: "Asset movement without matching access record · Sembawang Naval · Cam-12.",
    createdAt: "2026-05-25T09:42:00",
    href: "/detection-feed",
    read: false,
  },
  {
    id: "n-002",
    kind: "case",
    title: "Case CASE-2026-0142 was escalated",
    description: "Restricted zone entry at Armoury-B — assigned to Sze Hui · SLA 4 hours.",
    createdAt: "2026-05-25T08:15:00",
    href: "/incidents",
    read: false,
  },
  {
    id: "n-003",
    kind: "system",
    title: "NVR Cluster reported degraded performance",
    description: "1 of 4 NVRs at FedEx Changi flagged for storage cleanup.",
    createdAt: "2026-05-25T07:01:00",
    href: "/site/nvr",
    read: false,
  },
  {
    id: "n-004",
    kind: "system",
    title: "Camera offline — Loading Bay 2",
    description: "Cam-09 lost RTSP stream at 06:42. Reconnect attempted 3 times.",
    createdAt: "2026-05-25T06:45:00",
    href: "/site/cameras",
    read: false,
  },
  {
    id: "n-005",
    kind: "system",
    title: "Rule 'Helmet missing > 5s' triggered 12 times",
    description: "Active threshold breached during morning shift at Loading Bay 3.",
    createdAt: "2026-05-25T06:10:00",
    href: "/rules",
    read: false,
  },

  /* ── Yesterday ────────────────────────────────────────────────── */
  {
    id: "n-006",
    kind: "user",
    title: "New team member accepted invite",
    description: "ai5@bluesilo.studio joined as Admin · 3 sites assigned.",
    createdAt: "2026-05-24T16:32:00",
    href: "/users",
    read: false,
  },
  {
    id: "n-007",
    kind: "system",
    title: "Model training completed",
    description: "Forklift Detection v2.3 finished — 94.2% accuracy on validation set.",
    createdAt: "2026-05-24T13:18:00",
    href: "/models",
    read: false,
  },
  {
    id: "n-008",
    kind: "system",
    title: "Live Monitoring layout saved",
    description: "\"Morning Patrol — 6 cams\" saved by KC Loke. Available to all admins.",
    createdAt: "2026-05-24T09:55:00",
    href: "/live",
    read: true,
  },
  {
    id: "n-009",
    kind: "incident",
    title: "PPE non-compliance detected",
    description: "Helmet missing — Loading Bay 3 · Cam-04 · medium severity.",
    createdAt: "2026-05-24T08:20:00",
    href: "/detection-feed",
    read: true,
  },

  /* ── Earlier this week ────────────────────────────────────────── */
  {
    id: "n-010",
    kind: "system",
    title: "Recording retention reached for Cam-03",
    description: "Oldest footage at FedEx Changi · Lobby will be auto-purged in 48 hours.",
    createdAt: "2026-05-23T14:10:00",
    href: "/recordings",
    read: true,
  },
  {
    id: "n-011",
    kind: "billing",
    title: "Subscription renewed — Astra HQ",
    description: "Enterprise plan · billed annually · next renewal 23 May 2027.",
    createdAt: "2026-05-23T10:00:00",
    href: "/billing",
    read: true,
  },
  {
    id: "n-012",
    kind: "user",
    title: "Suspended user reactivated",
    description: "olivia@bluesilo.studio reactivated by admin · Viewer role restored.",
    createdAt: "2026-05-22T17:25:00",
    href: "/users",
    read: true,
  },
  {
    id: "n-013",
    kind: "system",
    title: "Model deployment completed",
    description: "Helmet Detection v1.4 deployed to 3 cameras at FedEx Changi.",
    createdAt: "2026-05-22T11:05:00",
    href: "/deployment",
    read: true,
  },
  {
    id: "n-014",
    kind: "system",
    title: "Run analysis finished",
    description: "Quarterly model evaluation completed · 5 models compared · report ready.",
    createdAt: "2026-05-22T09:30:00",
    href: "/analysis",
    read: true,
  },

  /* ── Earlier this month ───────────────────────────────────────── */
  {
    id: "n-015",
    kind: "system",
    title: "New site added",
    description: "Sembawang Naval Base provisioned · 12 cameras · 2 NVRs registered.",
    createdAt: "2026-05-20T15:45:00",
    href: "/site/overview",
    read: true,
  },
  {
    id: "n-016",
    kind: "system",
    title: "Failed sign-in attempt blocked",
    description: "5 incorrect attempts from 203.0.113.45 — account temporarily locked.",
    createdAt: "2026-05-19T22:14:00",
    href: "/activity-logs",
    read: true,
  },
  {
    id: "n-017",
    kind: "billing",
    title: "Payment method expiring soon",
    description: "Visa ending 4242 expires in 21 days. Update before 15 Jun 2026.",
    createdAt: "2026-05-18T10:00:00",
    href: "/billing",
    read: true,
  },
  {
    id: "n-018",
    kind: "system",
    title: "System config updated",
    description: "Detection thresholds changed by admin · 3 cameras affected.",
    createdAt: "2026-05-17T14:28:00",
    href: "/config",
    read: true,
  },
];

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set, get) => ({
      items: SEED,
      unreadCount: () => get().items.filter((n) => !n.read).length,
      markRead: (id) =>
        set((s) => ({
          items: s.items.map((n) => (n.id === id ? { ...n, read: true } : n)),
        })),
      markAllRead: () =>
        set((s) => ({
          items: s.items.map((n) => ({ ...n, read: true })),
        })),
      add: (n) =>
        set((s) => ({
          items: [
            {
              id: n.id ?? `n-${Math.random().toString(36).slice(2, 7)}`,
              kind: n.kind,
              title: n.title,
              description: n.description,
              href: n.href,
              read: n.read ?? false,
              createdAt: n.createdAt ?? "2026-05-25T10:00:00",
            },
            ...s.items,
          ],
        })),
      remove: (id) =>
        set((s) => ({ items: s.items.filter((n) => n.id !== id) })),
    }),
    { name: "accel-notifications" }
  )
);
