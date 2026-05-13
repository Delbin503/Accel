import { lazy } from "react";

// Pages
const ExamplePage = lazy(() => import("pages/home"));
const CameraDevices = lazy(() => import("pages/cameras"));
const NVRDevices = lazy(() => import("pages/nvr-devices"));
const RecordingsPage = lazy(() => import("pages/recordings"));
const SiteManagement = lazy(() => import("pages/site-management"));
const ActivityLog = lazy(() => import("pages/activityLog"));
const Dashboard = lazy(() => import("pages/dashboard"));
const LiveMonitoring = lazy(() => import("pages/live-monitoring"));
const UnderDevelopment = lazy(() => import("components/underDevelopmentPage"));

const coreRoutes = [
  {
    path: "/dashboard",
    title: "VMS Dashboard",
    component: Dashboard,
  },
  {
    path: "/cameras",
    title: "Cameras",
    component: CameraDevices,
  },
  {
    path: "/live-monitoring",
    title: "Live Monitoring",
    component: LiveMonitoring,
  },
  {
    path: "/recordings",
    title: "Recordings",
    component: RecordingsPage,
  },
  {
    path: "/nvr-devices",
    title: "NVR Devices",
    component: NVRDevices,
  },
  {
    path: "/site-management",
    title: "Site Management",
    component: SiteManagement,
  },
  {
    path: "/activity-logs",
    title: "Activity Logs",
    component: ActivityLog,
  },
  {
    path: "/vision-ai",
    title: "Vision AI",
    component: UnderDevelopment,
  },
  {
    path: "/model-management",
    title: "Model Management",
    component: UnderDevelopment,
  },
  {
    path: "/rule-library",
    title: "Rule Library",
    component: UnderDevelopment,
  },
  {
    path: "/fall-detection",
    title: "Fall Detection",
    component: UnderDevelopment,
  },
  {
    path: "/model-detection",
    title: "Model Detection",
    component: UnderDevelopment,
  },
  {
    path: "/events",
    title: "Events",
    component: ExamplePage,
  },
];

const routes = [...coreRoutes];
export default routes;
