import { createRoot } from "react-dom/client";
import { MemoryRouter, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AppSidebar, SidebarProvider, SidebarTrigger } from "@/components/layout/AppSidebar";
import { NotificationsBell } from "@/components/shared/NotificationsBell";
import { SystemStatusMenu } from "@/components/shared/SystemStatusMenu";
import { UserMenu } from "@/components/shared/UserMenu";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Ban } from "lucide-react";
import DetectionFeedPage from "@/pages/detection-feed";
import DismissedEventsPage from "@/pages/detection-feed/dismissed";
import IncidentCasesPage from "@/pages/incident-cases";
import IncidentCaseDetailPage from "@/pages/incident-cases/detail";
import RulesLibraryPage from "@/pages/rules-library";
import SiteOverviewPage from "@/pages/site/overview";
import SiteNvrPage from "@/pages/site/nvr";
import ActivityLogsPage from "@/pages/activity-logs";
import { ReidLiveMonitoring } from "../PRD_Phase_1_3/reid/ReidLiveMonitoring";
import { AccelDashboard } from "./AccelDashboard";
import { TrmsDevices } from "./TrmsDevices";
import { TRMS_NAV } from "./trmsNav";
import { TrmsBreadcrumb } from "./TrmsBreadcrumb";
import "./proto.css";

/** Detections raised on the wall open in TRMS's own Detection Feed. */
const detectionHref = (eventId: string) => `/detection-feed?event=${encodeURIComponent(eventId)}`;

/* A link inside a real page can point at a screen TRMS doesn't have (models,
   deployments, recordings…). Saying so beats a silent jump to the dashboard. */
function NotInTrms() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  return (
    <EmptyState
      icon={Ban}
      title="Not part of Accel TRMS"
      description={`${pathname} belongs to a module this product doesn't include.`}
      action={<Button size="sm" onClick={() => navigate("/")}>Back to Dashboard</Button>}
    />
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <MemoryRouter initialEntries={["/"]}>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider delayDuration={200}>
            <SidebarProvider defaultOpen={true}>
              <div className="flex min-h-screen w-full bg-background">
                <AppSidebar groups={TRMS_NAV} />
                <div className="flex min-w-0 flex-1 flex-col">
                  <header className="sticky top-0 z-[var(--z-sticky)] flex h-12 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur-sm">
                    <SidebarTrigger className="text-muted-foreground hover:text-foreground" aria-label="Toggle sidebar" />
                    <div className="flex-1" />
                    <SystemStatusMenu />
                    <NotificationsBell />
                    <div className="mx-1 h-5 w-px shrink-0 bg-border" />
                    <UserMenu />
                  </header>
                  <main id="main-content" className="flex-1 overflow-auto p-6 focus:outline-none">
                    <TrmsBreadcrumb />
                    <Routes>
                      <Route path="/" element={<AccelDashboard />} />
                      {/* Live Monitoring without Re-ID tracking: site and area filters, detections panel only. */}
                      <Route path="/live" element={<ReidLiveMonitoring tracking={false} detectionHref={detectionHref} />} />
                      <Route path="/detection-feed" element={<DetectionFeedPage />} />
                      <Route path="/detection-feed/dismissed" element={<DismissedEventsPage />} />
                      <Route path="/incidents" element={<IncidentCasesPage />} />
                      <Route path="/incidents/:caseId" element={<IncidentCaseDetailPage />} />
                      <Route path="/rules" element={<RulesLibraryPage />} />
                      <Route path="/site" element={<Navigate to="/site/overview" replace />} />
                      <Route path="/site/overview" element={<SiteOverviewPage />} />
                      <Route path="/site/cameras" element={<TrmsDevices />} />
                      <Route path="/site/nvr" element={<SiteNvrPage />} />
                      <Route path="/site/:siteId" element={<SiteOverviewPage />} />
                      <Route path="/activity-logs" element={<ActivityLogsPage />} />
                      <Route path="*" element={<NotInTrms />} />
                    </Routes>
                  </main>
                </div>
              </div>
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
