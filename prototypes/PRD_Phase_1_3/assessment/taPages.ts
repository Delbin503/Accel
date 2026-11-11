import { Brain, ClipboardCheck, Cpu, LayoutDashboard, Radio, Settings } from "lucide-react";
import { TaDashboard } from "./TaDashboard";
import { TaSessions } from "./TaSessions";
import { TaModelManagement } from "./TaModelManagement";
import { TaModelDeployment } from "./TaModelDeployment";
import { TaExternalDevices } from "./TaExternalDevices";
import { TaSystemConfig } from "./TaSystemConfig";
import { TA_ROUTES } from "./taNav";

/* The Training Assessment module's pages, in the order the index card lists them. */
export const TA_PAGES = [
  { path: TA_ROUTES.dashboard, title: "Dashboard", icon: LayoutDashboard, Component: TaDashboard },
  { path: TA_ROUTES.models, title: "Model Management", icon: Brain, Component: TaModelManagement },
  { path: TA_ROUTES.config, title: "System Configuration", icon: Settings, Component: TaSystemConfig },
  { path: TA_ROUTES.devices, title: "External Devices", icon: Radio, Component: TaExternalDevices },
  { path: TA_ROUTES.deployment, title: "Model Deployment", icon: Cpu, Component: TaModelDeployment },
  { path: TA_ROUTES.sessions, title: "Performance & Posture", icon: ClipboardCheck, Component: TaSessions },
] as const;
