import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell, AlertTriangle, FolderOpen, Server, Users as UsersIcon, CreditCard, CheckCheck, Calendar, ArrowUpRight,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNotificationsStore, type NotificationItem, type NotificationKind } from "@/stores/useNotificationsStore";

const KIND_STYLES: Record<NotificationKind, { bg: string; text: string; icon: React.ElementType; label: string }> = {
  incident: { bg: "bg-sev-critical/15", text: "text-sev-critical", icon: AlertTriangle, label: "Incident" },
  case:     { bg: "bg-primary/15",      text: "text-primary",      icon: FolderOpen,    label: "Case" },
  system:   { bg: "bg-info/15",         text: "text-info",         icon: Server,        label: "System" },
  user:     { bg: "bg-success/15",      text: "text-success",      icon: UsersIcon,     label: "Team" },
  billing:  { bg: "bg-warning/15",      text: "text-warning",      icon: CreditCard,    label: "Billing" },
};

type DateRange = "all" | "today" | "yesterday" | "week" | "month" | "custom";

/* Fixed reference "today" so the prototype's seed data lines up with the filters. */
const REFERENCE_TODAY = "2026-05-25";

function shiftDate(iso: string, days: number) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

function relTime(iso: string) {
  // Compare against REFERENCE_TODAY so labels stay stable for the prototype.
  const nowMs = new Date(`${REFERENCE_TODAY}T10:00:00`).getTime();
  const t = new Date(iso).getTime();
  const diff = Math.max(0, nowMs - t);
  const mins = Math.floor(diff / 60000);
  if (mins < 1)   return "just now";
  if (mins < 60)  return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs} hr${hrs === 1 ? "" : "s"} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)   return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

export function NotificationsDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const items = useNotificationsStore((s) => s.items);
  const markRead = useNotificationsStore((s) => s.markRead);
  const markAllRead = useNotificationsStore((s) => s.markAllRead);

  const [range, setRange] = React.useState<DateRange>("all");
  const [showUnreadOnly, setShowUnreadOnly] = React.useState(false);
  const [customFrom, setCustomFrom] = React.useState(shiftDate(REFERENCE_TODAY, -7));
  const [customTo, setCustomTo] = React.useState(REFERENCE_TODAY);

  const bounds = React.useMemo<{ from: string; to: string } | null>(() => {
    if (range === "all")       return null;
    if (range === "today")     return { from: REFERENCE_TODAY, to: REFERENCE_TODAY };
    if (range === "yesterday") return { from: shiftDate(REFERENCE_TODAY, -1), to: shiftDate(REFERENCE_TODAY, -1) };
    if (range === "week")      return { from: shiftDate(REFERENCE_TODAY, -6), to: REFERENCE_TODAY };
    if (range === "month")     return { from: shiftDate(REFERENCE_TODAY, -29), to: REFERENCE_TODAY };
    if (range === "custom") {
      // Tolerate from > to by swapping.
      const from = customFrom <= customTo ? customFrom : customTo;
      const to   = customFrom <= customTo ? customTo   : customFrom;
      return { from, to };
    }
    return null;
  }, [range, customFrom, customTo]);

  const filtered = React.useMemo(() => {
    return items.filter((n) => {
      if (showUnreadOnly && n.read) return false;
      if (bounds) {
        const d = n.createdAt.slice(0, 10);
        if (d < bounds.from || d > bounds.to) return false;
      }
      return true;
    });
  }, [items, bounds, showUnreadOnly]);

  // Group by day for nicer readability.
  const grouped = React.useMemo(() => {
    const map = new Map<string, NotificationItem[]>();
    for (const n of filtered) {
      const day = n.createdAt.slice(0, 10);
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(n);
    }
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [filtered]);

  function fmtGroupHeading(iso: string) {
    if (iso === REFERENCE_TODAY)                  return "Today";
    if (iso === shiftDate(REFERENCE_TODAY, -1))   return "Yesterday";
    return new Date(iso).toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "short" });
  }

  const unreadCount = items.filter((n) => !n.read).length;

  function handleClick(n: NotificationItem) {
    if (!n.read) markRead(n.id);
    if (n.href) {
      onClose();
      navigate(n.href);
    }
  }

  const DATE_PILLS: { key: DateRange; label: string }[] = [
    { key: "all",       label: "All time" },
    { key: "today",     label: "Today" },
    { key: "yesterday", label: "Yesterday" },
    { key: "week",      label: "This Week" },
    { key: "month",     label: "This Month" },
    { key: "custom",    label: "Custom" },
  ];

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="flex w-[min(440px,92vw)] max-w-[95vw] flex-col gap-0 p-0"
      >
        <SheetHeader className="flex-shrink-0 border-b border-border px-5 py-4">
          <SheetTitle className="inline-flex items-center gap-2 pr-8 text-base font-bold">
            <Bell className="size-4 text-primary" />
            Notifications
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center rounded-full bg-sev-critical px-1.5 py-0.5 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </SheetTitle>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            {filtered.length} of {items.length} shown
          </p>
        </SheetHeader>

        {/* Filter bar */}
        <div className="flex flex-shrink-0 flex-col gap-2 border-b border-border px-5 py-3">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="inline-flex flex-shrink-0 items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Calendar className="size-3" />
              Date
            </span>
            {DATE_PILLS.map((p) => {
              const active = range === p.key;
              return (
                <button
                  key={p.key}
                  onClick={() => setRange(p.key)}
                  className={cn(
                    "flex-shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors",
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                  )}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Custom date range — collapsible. Two date inputs side by side. */}
          {range === "custom" && (
            <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-card/40 px-2.5 py-2">
              <label className="flex flex-1 items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="font-semibold uppercase tracking-wider text-[10px]">From</span>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  max={customTo}
                  className="h-7 flex-1 rounded border border-input bg-background px-2 text-[11px] text-foreground"
                />
              </label>
              <label className="flex flex-1 items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="font-semibold uppercase tracking-wider text-[10px]">To</span>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  min={customFrom}
                  className="h-7 flex-1 rounded border border-input bg-background px-2 text-[11px] text-foreground"
                />
              </label>
            </div>
          )}
          <div className="flex items-center justify-between gap-2">
            <label className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <input
                type="checkbox"
                checked={showUnreadOnly}
                onChange={(e) => setShowUnreadOnly(e.target.checked)}
                className="size-3 accent-primary"
              />
              Unread only
            </label>
            <button
              onClick={markAllRead}
              disabled={unreadCount === 0}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:text-muted-foreground/50 disabled:hover:bg-transparent"
            >
              <CheckCheck className="size-3" />
              Mark all as read
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {grouped.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 px-4 py-16 text-center text-muted-foreground">
              <Bell className="size-8 opacity-30" />
              <p className="text-[13px] font-medium">No notifications match the current filters.</p>
              <p className="text-[11px]">Try widening the date range or unchecking "Unread only".</p>
            </div>
          ) : (
            grouped.map(([day, group]) => (
              <div key={day}>
                <div className="sticky top-0 z-10 border-b border-border bg-card/95 px-5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground backdrop-blur">
                  {fmtGroupHeading(day)}
                </div>
                <ul className="divide-y divide-border/60">
                  {group.map((n) => {
                    const k = KIND_STYLES[n.kind];
                    const Icon = k.icon;
                    return (
                      <li key={n.id}>
                        <button
                          onClick={() => handleClick(n)}
                          className={cn(
                            "group flex w-full items-start gap-3 px-5 py-3 text-left transition-colors hover:bg-muted/40",
                            !n.read && "bg-primary/[0.03]"
                          )}
                        >
                          <div className={cn(
                            "flex size-8 flex-shrink-0 items-center justify-center rounded-lg",
                            k.bg, k.text
                          )}>
                            <Icon className="size-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "inline-flex items-center gap-1 rounded-full border px-1.5 py-px text-[9px] font-bold uppercase tracking-wider",
                                k.bg, k.text, "border-current/30"
                              )}>
                                {k.label}
                              </span>
                              <span className="font-mono text-[10px] text-muted-foreground">{relTime(n.createdAt)}</span>
                              {!n.read && (
                                <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-semibold text-primary">
                                  <span className="size-1.5 rounded-full bg-primary" />
                                  New
                                </span>
                              )}
                            </div>
                            <p className={cn(
                              "mt-1 text-[13px] font-semibold",
                              n.read ? "text-foreground" : "text-foreground"
                            )}>
                              {n.title}
                            </p>
                            <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
                              {n.description}
                            </p>
                            {n.href && (
                              <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                                Open <ArrowUpRight className="size-3" />
                              </span>
                            )}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </div>

        <div className="flex flex-shrink-0 items-center justify-between gap-2 border-t border-border bg-card px-5 py-3">
          <p className="text-[11px] text-muted-foreground">
            <strong className="text-foreground">{unreadCount}</strong> unread
          </p>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
