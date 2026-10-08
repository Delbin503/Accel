import { createRoot } from "react-dom/client";
import { MemoryRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { QueryClientProvider } from "@tanstack/react-query";
import { SidebarProvider, SidebarTrigger } from "@/components/layout/AppSidebar";
import { NotificationsBell } from "@/components/shared/NotificationsBell";
import { SystemStatusMenu } from "@/components/shared/SystemStatusMenu";
import { UserMenu } from "@/components/shared/UserMenu";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { queryClient } from "@/lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PAGES } from "./pages";
import { Breadcrumb, Phase13Index, ReidNotInModule, ShellSidebar } from "./Phase13Home";
import { REID_OTHER_PATH, REID_PAGES } from "./reid/reidNav";
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
                    <SidebarTrigger className="text-muted-foreground hover:text-foreground" aria-label="Toggle sidebar" />
                    <div className="flex-1" />
                    <SystemStatusMenu />
                    <NotificationsBell />
                    <div className="mx-1 h-5 w-px shrink-0 bg-border" />
                    <UserMenu />
                  </header>

                  {/* Breadcrumb sits above the page title, as on every other Accel
                      page. The routes get the remaining height, so full-height
                      pages (the Re-ID wall) still fit without scrolling. */}
                  <main id="main-content" className="flex flex-1 flex-col overflow-auto p-6 focus:outline-none">
                    <Breadcrumb className="mb-4 shrink-0" />
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
