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

/* Seed entries — deterministic so the prototype always shows the bell badge. */
const SEED: NotificationItem[] = [
  {
    id: "n-001",
    kind: "incident",
    title: "Critical incident raised — Armoury-B",
    description: "Asset movement detected without matching access record at Sembawang Naval · Cam-12.",
    createdAt: "2026-05-25T09:42:00",
    href: "/detection-feed",
    read: false,
  },
  {
    id: "n-002",
    kind: "case",
    title: "Case CASE-2026-0142 was escalated",
    description: "Restricted zone entry at Armoury-B — assigned to Sze Hui (SLA: 4 hours).",
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
    kind: "user",
    title: "New team member invited",
    description: "ai5@bluesilo.studio accepted the Admin invitation.",
    createdAt: "2026-05-24T16:32:00",
    href: "/users",
    read: false,
  },
  {
    id: "n-005",
    kind: "billing",
    title: "Subscription renewed",
    description: "Astra HQ · Enterprise plan renewed for another year.",
    createdAt: "2026-05-23T10:00:00",
    href: "/billing",
    read: true,
  },
  {
    id: "n-006",
    kind: "incident",
    title: "PPE non-compliance detected",
    description: "Helmet missing — Loading Bay 3 · Cam-04 · medium severity.",
    createdAt: "2026-05-22T14:20:00",
    href: "/detection-feed",
    read: true,
  },
  {
    id: "n-007",
    kind: "system",
    title: "Model deployment completed",
    description: "Helmet Detection V1 deployed to 3 cameras at FedEx Changi.",
    createdAt: "2026-05-21T11:05:00",
    href: "/deployment",
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
