import * as React from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { QueryClientProvider } from "@tanstack/react-query";

import { AppSidebar, SidebarProvider } from "@/components/layout/AppSidebar";
import { ProtoBreadcrumb } from "../_shared/ProtoBreadcrumb";
import { NotificationsBell } from "@/components/shared/NotificationsBell";
import { SystemStatusMenu } from "@/components/shared/SystemStatusMenu";
import { UserMenu } from "@/components/shared/UserMenu";
import { CommandPalette } from "@/components/shared/CommandPalette";
import {
  GlobalSearchTrigger,
  QuickActionsTrigger,
} from "@/components/shared/GlobalSearchTrigger";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient } from "@/lib/queryClient";

/* Real pages — the palette's navigation actions are only worth testing if they
   actually land somewhere. */
import DashboardPage from "@/pages/dashboard";
import LiveMonitoringPage from "@/pages/live-monitoring";
import RecordingsPage from "@/pages/recordings";
import DetectionFeedPage from "@/pages/detection-feed";
import DismissedEventsPage from "@/pages/detection-feed/dismissed";
import SiteOverviewPage from "@/pages/site/overview";
import SiteCamerasPage from "@/pages/site/cameras";
import SiteNvrPage from "@/pages/site/nvr";
import SiteZonesPage from "@/pages/site/zones";
import ModelManagementPage from "@/pages/model-management";
import RulesLibraryPage from "@/pages/rules-library";
import IncidentCasesPage from "@/pages/incident-cases";
import IncidentCaseDetailPage from "@/pages/incident-cases/detail";
import RunAnalysisPage from "@/pages/run-analysis";
import ModelDeploymentPage from "@/pages/model-deployment";
import UserManagementPage from "@/pages/user-management";
import DeviceHealthPage from "@/pages/device-health";
import ActivityLogsPage from "@/pages/activity-logs";
import ProfilePage from "@/pages/profile";
import SettingsPage from "@/pages/settings";
import BillingPage from "@/pages/billing";
import SystemInfoPage from "@/pages/system-info";

import QuickActionsConfigPage from "./QuickActionsConfigPage";
import { QuickActionsTips } from "./QuickActionsTips";
import { TesterShell } from "../_shared/TesterShell";
import "./proto.css";

function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <MemoryRouter initialEntries={["/config"]}>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider delayDuration={200}>
            <SidebarProvider defaultOpen={true}>
              <div className="flex min-h-screen w-full bg-background">
                <AppSidebar collapseTrigger />

                <div className="flex min-w-0 flex-1 flex-col">
                  <header className="sticky top-0 z-[var(--z-sticky)] flex h-12 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur-sm">
                    <ProtoBreadcrumb className="shrink-0" />
                    <div className="flex-1" />
                    <div className="flex w-64 justify-end">
                      <GlobalSearchTrigger />
                    </div>
                    <QuickActionsTrigger />
                    <SystemStatusMenu />
                    <NotificationsBell />
                    <div className="mx-1 h-5 w-px shrink-0 bg-border" />
                    <UserMenu />
                  </header>

                  <main id="main-content" className="flex-1 overflow-auto p-6 focus:outline-none">
                    <Routes>
                      {/* The prototype's own surface. */}
                      <Route path="/config" element={<QuickActionsConfigPage />} />

                      {/* Everything a quick action or a search result can reach. */}
                      <Route path="/" element={<DashboardPage />} />
                      <Route path="/live" element={<LiveMonitoringPage />} />
                      <Route path="/recordings" element={<RecordingsPage />} />
                      <Route path="/detection-feed" element={<DetectionFeedPage />} />
                      <Route path="/detection-feed/dismissed" element={<DismissedEventsPage />} />
                      <Route path="/site" element={<Navigate to="/site/overview" replace />} />
                      <Route path="/site/overview" element={<SiteOverviewPage />} />
                      <Route path="/site/cameras" element={<SiteCamerasPage />} />
                      <Route path="/site/nvr" element={<SiteNvrPage />} />
                      <Route path="/site/zones" element={<SiteZonesPage />} />
                      <Route path="/site/:siteId" element={<SiteOverviewPage />} />
                      <Route path="/models" element={<ModelManagementPage />} />
                      <Route path="/rules" element={<RulesLibraryPage />} />
                      <Route path="/incidents" element={<IncidentCasesPage />} />
                      <Route path="/incidents/:caseId" element={<IncidentCaseDetailPage />} />
                      <Route path="/analysis" element={<RunAnalysisPage />} />
                      <Route path="/deployment" element={<ModelDeploymentPage />} />
                      <Route path="/users/*" element={<UserManagementPage />} />
                      <Route path="/device-health" element={<DeviceHealthPage />} />
                      <Route path="/activity-logs" element={<ActivityLogsPage />} />
                      <Route path="/profile" element={<ProfilePage />} />
                      <Route path="/settings" element={<SettingsPage />} />
                      <Route path="/billing" element={<BillingPage />} />
                      <Route path="/system-info" element={<SystemInfoPage />} />
                      <Route path="*" element={<Navigate to="/config" replace />} />
                    </Routes>
                  </main>
                </div>
              </div>

              <CommandPalette />
              {/* Bottom-left, clear of the header and the palette. */}
              <TesterShell position="bottom-14 right-3">
                <QuickActionsTips />
              </TesterShell>
              <Toaster position="top-right" theme="dark" />
            </SidebarProvider>
          </TooltipProvider>
        </QueryClientProvider>
      </MemoryRouter>
    </ThemeProvider>
  );
}

const el = document.getElementById("root");
if (el) createRoot(el).render(<App />);
