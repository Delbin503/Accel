import { createRoot } from "react-dom/client";
import { MemoryRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { QueryClientProvider } from "@tanstack/react-query";
import { SidebarProvider, SidebarTrigger } from "@/components/layout/AppSidebar";
import { NotificationsBell } from "@/components/shared/NotificationsBell";
import { DownloadsIndicator } from "@/components/shared/DownloadsIndicator";
import { SystemStatusMenu } from "@/components/shared/SystemStatusMenu";
import { UserMenu } from "@/components/shared/UserMenu";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { queryClient } from "@/lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PAGES } from "./pages";
import { Breadcrumb, Phase13Index, ReidNotInModule, ShellSidebar, TaNotInModule } from "./Phase13Home";
import { REID_OTHER_PATH, REID_PAGES } from "./reid/reidNav";
import { TA_PAGES } from "./assessment/taPages";
import { TA_GOLF_ANALYSIS_PATH, TA_GYM_ANALYSIS_PATH, TA_OTHER_PATH, TA_PATH, TA_PHYSIO_ANALYSIS_PATH, TA_RESULT_PATH, TA_ROUTES } from "./assessment/taNav";
import { TaSessionResult } from "./assessment/TaSessions";
import { GolfDashboard } from "./golf/GolfDashboard";
import { GymDashboard } from "./gym/GymDashboard";
import { PhysioDashboard } from "./physio/PhysioDashboard";
import "./proto.css";

/* Phase 1.3 prototype shell — routes the phase index to each proposal page. */

/* `?p=/live` opens straight on that page — the prototypes index links each card this way. */
const START = (() => {
  const p = new URLSearchParams(window.location.search).get("p");
  return p && p.startsWith("/") ? p : "/";
})();

function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <MemoryRouter initialEntries={[START]}>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider delayDuration={200}>
            <SidebarProvider defaultOpen={true}>
              <div className="flex min-h-screen w-full bg-background">
                <ShellSidebar />
                <div className="flex min-w-0 flex-1 flex-col">
                  <header className="sticky top-0 z-[var(--z-sticky)] flex h-12 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur-sm">
                    <SidebarTrigger className="text-muted-foreground hover:text-foreground md:hidden" aria-label="Toggle sidebar" />
                    <Breadcrumb className="md:ml-2" />
                    <div className="flex-1" />
                    <SystemStatusMenu />
                    <DownloadsIndicator />
                    <NotificationsBell />
                    <div className="mx-1 h-5 w-px shrink-0 bg-border" />
                    <UserMenu />
                  </header>

                  {/* The routes get the remaining height, so full-height pages
                      (the Re-ID wall) still fit without scrolling. */}
                  <main id="main-content" className="flex flex-1 flex-col overflow-auto p-6 focus:outline-none">
                    <div className="min-h-0 flex-1">
                    <Routes>
                      <Route path="/" element={<Phase13Index />} />
                      {PAGES.map((p) => (
                        <Route key={p.path} path={p.path} element={<p.Component />} />
                      ))}
                      {/* Model (Re-ID) Module — separate from the proposals above. */}
                      <Route path="/reid" element={<Navigate to={REID_PAGES[0].path} replace />} />
                      {REID_PAGES.map((p) => (
                        <Route key={p.path} path={p.path} element={<p.Component />} />
                      ))}
                      {/* The rest of the app's sidebar — shown, but not built in this module. */}
                      <Route path={`${REID_OTHER_PATH}/*`} element={<ReidNotInModule />} />
                      {/* Links inside Model Management / Deployment use the app's own
                          routes; keep them in the module. */}
                      <Route path="/models" element={<Navigate to="/reid/models" replace />} />
                      {/* Training Assessment Module — separate from the proposals and from Re-ID. */}
                      <Route path={TA_PATH} element={<Navigate to={TA_ROUTES.dashboard} replace />} />
                      {TA_PAGES.map((p) => (
                        <Route key={p.path} path={p.path} element={<p.Component />} />
                      ))}
                      <Route path={TA_RESULT_PATH} element={<TaSessionResult />} />
                      <Route path={TA_GOLF_ANALYSIS_PATH} element={<GolfDashboard />} />
                      <Route path={TA_GYM_ANALYSIS_PATH} element={<GymDashboard />} />
                      <Route path={TA_PHYSIO_ANALYSIS_PATH} element={<PhysioDashboard />} />
                      <Route path={`${TA_OTHER_PATH}/*`} element={<TaNotInModule />} />
                      <Route path="/deployment" element={<Navigate to="/reid/deployment" replace />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                    </div>
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
