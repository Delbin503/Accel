import * as React from "react";
import { useLocation, useNavigate } from "react-router-dom";

/* External-device state shared by the analysis dashboards: see deviceMode.tsx. */

export type DeviceMode = "connected" | "none" | "offline";

export const DEVICE_MODES: DeviceMode[] = ["connected", "none", "offline"];

/** The dashboard's device state, from ?device=, and a setter that keeps the other params. */
export function useDeviceMode(): [DeviceMode, (m: DeviceMode) => void] {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const raw = new URLSearchParams(search).get("device");
  const mode: DeviceMode = DEVICE_MODES.includes(raw as DeviceMode) ? (raw as DeviceMode) : "connected";
  const set = React.useCallback((m: DeviceMode) => {
    const q = new URLSearchParams(search);
    if (m === "connected") q.delete("device");
    else q.set("device", m);
    const s = q.toString();
    navigate(`${pathname}${s ? `?${s}` : ""}`, { replace: true });
  }, [navigate, pathname, search]);
  return [mode, set];
}

