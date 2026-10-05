import { createRoot } from "react-dom/client";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { AppSidebar, SidebarProvider, SidebarTrigger } from "@/components/layout/AppSidebar";
import { ProtoBreadcrumb } from "../_shared/ProtoBreadcrumb";
import { NotificationsBell } from "@/components/shared/NotificationsBell";
import { SystemStatusMenu } from "@/components/shared/SystemStatusMenu";
import { UserMenu } from "@/components/shared/UserMenu";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import DetectionFeedPage from "@/pages/detection-feed";
import { ReidLiveMonitoring } from "../PRD_Phase_1_3/reid/ReidLiveMonitoring";
import "./proto.css";

/* Live Monitoring — the Phase 1.3 design (camera wall, side panel, synchronised
   playback, detection pop-ups), without the Re-ID weapon tracking that belongs
   to the Model (Re-ID) module. One component serves both, so the two cannot
   drift: this prototype just switches tracking off.

   A detection pop-up opens the event in the Detection Feed, which is routed
   here for that purpose. */

const detectionHref = (eventId: string) => `/detection-feed?event=${encodeURIComponent(eventId)}`;

function App() {
  return (
    <ThemeProvider defaultTheme="dark">
    <MemoryRouter initialEntries={["/live"]}>
      <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={200}>
        <SidebarProvider defaultOpen={true}>
          <div className="flex min-h-screen w-full bg-background">
            <AppSidebar />
            <div className="flex min-w-0 flex-1 flex-col">
              <header className="sticky top-0 z-[var(--z-sticky)] flex h-12 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur-sm">
                <SidebarTrigger className="text-muted-foreground hover:text-foreground" aria-label="Toggle sidebar" />
                <div className="flex-1" />
                <SystemStatusMenu />
                <NotificationsBell />
                <div className="mx-1 h-5 w-px shrink-0 bg-border" />
                <UserMenu />
              </header>
              {/* The routes get the height left under the breadcrumb, so the wall fills the page. */}
              <main id="main-content" className="flex flex-1 flex-col overflow-auto p-6 focus:outline-none">
                <ProtoBreadcrumb className="mb-4 shrink-0" />
                <div className="min-h-0 flex-1">
                  <Routes>
                    <Route path="/detection-feed" element={<DetectionFeedPage />} />
                    <Route path="*" element={<ReidLiveMonitoring tracking={false} detectionHref={detectionHref} />} />
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
