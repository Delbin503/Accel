import * as React from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotificationsStore } from "@/stores/useNotificationsStore";
import { NotificationsDrawer } from "@/components/shared/NotificationsDrawer";
import { cn } from "@/lib/utils";

interface NotificationsBellProps {
  className?: string;
}

export function NotificationsBell({ className }: NotificationsBellProps) {
  const [open, setOpen] = React.useState(false);
  const unreadCount = useNotificationsStore((s) => s.items.filter((n) => !n.read).length);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className={cn("relative text-muted-foreground hover:text-foreground", className)}
        aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : "Open notifications"}
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-3xs font-bold text-destructive-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      <NotificationsDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}
