import * as React from "react";
import { Link } from "react-router-dom";
import { Plug, Unplug, WifiOff } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { TA_ROUTES } from "./taNav";
import { DEVICE_MODES, type DeviceMode } from "./deviceState";

/* External-device state for the Swing, Lift and Rehab Analysis dashboards.

   Each use case pairs one external device with a unit (launch monitor, bar
   speed sensor, force plate). A session can run with it connected, with no
   device at all, or with the device dropping out partway through. The state
   rides on the URL (?device=none | offline) so Results can open a session
   that ran without a device straight in that state, and the preview switch
   in the page header flips between the three to compare. */

/** Header control: preview the dashboard with the device connected, missing, or dropping out. */
export function DevicePreviewSwitch({ device, mode, onChange }: { device: string; mode: DeviceMode; onChange: (m: DeviceMode) => void }) {
  const label: Record<DeviceMode, string> = {
    connected: `${device} connected`,
    none: `No ${device.toLowerCase()}`,
    offline: `${device} went offline`,
  };
  return (
    <Select value={mode} onValueChange={(v) => onChange(v as DeviceMode)}>
      <SelectTrigger size="sm" className="h-8 gap-1.5 text-sm" aria-label="Preview external device state">
        {mode === "connected" ? <Plug className="size-4 text-success" /> : mode === "none" ? <Unplug className="size-4 text-muted-foreground" /> : <WifiOff className="size-4 text-warning" />}
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {DEVICE_MODES.map((m) => <SelectItem key={m} value={m}>{label[m]}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

/** The device entry on the session strip: green when connected, muted when missing, amber when it dropped out. */
export function DeviceStatusValue({ mode, connected, offlineFrom }: { mode: DeviceMode; connected: string; offlineFrom: string }) {
  if (mode === "connected") return <>{connected}</>;
  return (
    <span className={cn("inline-flex items-center gap-1", mode === "offline" ? "text-warning" : "text-muted-foreground")}>
      <span className={cn("size-1.5 rounded-full", mode === "offline" ? "bg-warning" : "bg-muted-foreground")} />
      {mode === "offline" ? `Offline from ${offlineFrom}` : "Not connected"}
    </span>
  );
}

/** Thin banner under the session strip when the device dropped out during the session. */
export function DeviceOfflineBanner({ children }: { children: React.ReactNode }) {
  return (
    <div role="status" className="flex shrink-0 items-center gap-2 rounded-lg border border-warning/30 bg-warning/[0.07] px-3 py-1.5 text-xs text-foreground">
      <WifiOff className="size-4 shrink-0 text-warning" />
      <span className="min-w-0">{children}</span>
    </div>
  );
}

/** Greyed inline note in place of a value the missing device would have given, e.g. "Needs launch monitor". */
export function NeedsDevice({ device, className }: { device: string; className?: string }) {
  return <span className={cn("text-muted-foreground", className)}>Needs {device.toLowerCase()}</span>;
}

/** Small "est." tag on a number estimated from video instead of measured by the device. */
export function EstTag({ className }: { className?: string }) {
  return (
    <span title="Estimated from the camera, not measured by the device" className={cn("rounded bg-muted px-1 py-px font-sans text-3xs font-semibold uppercase tracking-wider text-muted-foreground", className)}>
      est.
    </span>
  );
}

/** Panel body when a panel's data comes only from the missing device. */
export function DeviceMissing({ device, unit, what, className }: { device: string; unit: string; what: string; className?: string }) {
  return (
    <div className={cn("flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border px-4 py-6 text-center", className)}>
      <Unplug className="size-5 text-muted-foreground" />
      <p className="text-sm font-semibold text-foreground">No {device.toLowerCase()} on {unit}</p>
      <p className="max-w-64 text-xs text-muted-foreground">{what}</p>
      <Link to={TA_ROUTES.devices} className="text-xs font-semibold text-primary hover:underline">Pair a device →</Link>
    </div>
  );
}
