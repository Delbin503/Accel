import * as React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ChevronDown, Cctv, HardDrive, Server } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  useSystemStatus,
  SYSTEM_HEALTH_PRESENTATION,
  type SystemHealth,
  type SystemStatusGroup,
} from "@/hooks/useSystemStatus";

/* ─── Health presentation ───────────────────────────────────────────────── */

const OVERALL_COPY: Record<SystemHealth, string> = {
  healthy: "All systems operational",
  degraded: "Some services degraded",
  critical: "Devices need attention",
};

function HealthDot({ health, className }: { health: SystemHealth; className?: string }) {
  return (
    <span
      className={cn(
        "size-2 shrink-0 rounded-full",
        SYSTEM_HEALTH_PRESENTATION[health].dot,
        health === "healthy" && "animate-pulse",
        className
      )}
    />
  );
}

/* ─── One device-class row ──────────────────────────────────────────────── */

interface StatusRowProps {
  icon: React.ElementType;
  label: string;
  group: SystemStatusGroup;
  onSelect: () => void;
}

function StatusRow({ icon: Icon, label, group, onSelect }: StatusRowProps) {
  const offline = group.total - group.online - group.degraded;

  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Icon className="size-4 shrink-0 text-muted-foreground" />

      <div className="min-w-0 flex-1">
        <p className="truncate text-base text-foreground">{label}</p>
        {(group.degraded > 0 || offline > 0) && (
          <p className="truncate text-2xs text-muted-foreground">
            {[
              offline > 0 ? `${offline} offline` : null,
              group.degraded > 0 ? `${group.degraded} degraded` : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}
      </div>

      <span className="shrink-0 text-sm font-medium tabular-nums text-muted-foreground">
        {group.online} / {group.total}
      </span>
      <HealthDot health={group.health} />
    </button>
  );
}

/* ─── Top-bar system status menu ────────────────────────────────────────── */

interface SystemStatusMenuProps {
  className?: string;
  /**
   * PROTOTYPE-ONLY escape hatch. The Dashboard prototype's dev Health control
   * forces a health state; passing it here keeps the top-bar roll-up in step
   * with the dashboard's own status pill. The app never sets this.
   */
  forcedHealth?: SystemHealth;
}

export function SystemStatusMenu({ className, forcedHealth }: SystemStatusMenuProps) {
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();
  const derived = useSystemStatus();
  const status = forcedHealth ? { ...derived, overall: forcedHealth } : derived;
  const overall = SYSTEM_HEALTH_PRESENTATION[status.overall];

  function go(path: string) {
    setOpen(false);
    navigate(path);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`System status — ${overall.label}`}
          className={cn(
            "flex h-8 items-center gap-2 rounded-full border border-border bg-card/60 px-3 transition-colors duration-[var(--duration-fast)] ease-standard hover:border-border hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            className
          )}
        >
          <HealthDot health={status.overall} />
          <span className="hidden text-sm font-medium text-foreground sm:inline">
            {overall.label}
          </span>
          <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-72 p-0">
        {/* Overall roll-up */}
        <div className="border-b border-border px-3 py-3">
          <p className="text-2xs font-bold uppercase tracking-widest text-muted-foreground">
            System Status
          </p>
          <div className="mt-2 flex items-center gap-2">
            <HealthDot health={status.overall} />
            <p className={cn("text-md font-medium", overall.text)}>{OVERALL_COPY[status.overall]}</p>
          </div>
        </div>

        {/* Per-class breakdown */}
        <div className="p-1">
          <StatusRow icon={Cctv} label="Cameras" group={status.cameras} onSelect={() => go("/device-health")} />
          <StatusRow icon={HardDrive} label="NVRs" group={status.nvrs} onSelect={() => go("/device-health")} />
          <StatusRow icon={Server} label="Servers" group={status.servers} onSelect={() => go("/system-info")} />
        </div>

        <div className="border-t border-border p-1">
          <button
            type="button"
            onClick={() => go("/device-health")}
            className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-base font-medium text-primary transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            View System Health
            <ArrowRight className="size-4" />
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
