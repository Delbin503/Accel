import { Link, useLocation } from "react-router-dom";
import { Cloud, HardDrive } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Segmented control shown at the top of the sign-in pages so users can
 * pick which deployment they're authenticating against:
 *
 *   Cloud         → /signin       (multi-site, subscription-billed)
 *   On-Premise    → /on-premise/signin  (single-site, offline appliance)
 *
 * The active segment is highlighted in orange. Clicking the inactive
 * segment routes to the other mode's sign-in page.
 */
export function DeploymentModeSwitcher() {
  const location = useLocation();
  const isOnPrem = location.pathname.startsWith("/on-premise");

  return (
    <div className="mb-6 flex items-center gap-1 rounded-lg border border-border bg-card/40 p-1 backdrop-blur-sm">
      <Segment
        to="/signin"
        active={!isOnPrem}
        icon={<Cloud className="size-3.5" />}
        label="Cloud"
        hint="Multi-site"
      />
      <Segment
        to="/on-premise/signin"
        active={isOnPrem}
        icon={<HardDrive className="size-3.5" />}
        label="On-Premise"
        hint="Offline · Single-site"
      />
    </div>
  );
}

function Segment({
  to,
  active,
  icon,
  label,
  hint,
}: {
  to: string;
  active: boolean;
  icon: React.ReactNode;
  label: string;
  hint: string;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-0.5 rounded-md px-3 py-2 text-center transition-all",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-card/70 hover:text-foreground"
      )}
      aria-current={active ? "page" : undefined}
    >
      <span className="flex items-center gap-1.5 text-[12px] font-bold">
        {icon}
        {label}
      </span>
      <span
        className={cn(
          "text-[9px] font-semibold uppercase tracking-wider",
          active ? "text-primary-foreground/85" : "text-muted-foreground/70"
        )}
      >
        {hint}
      </span>
    </Link>
  );
}
