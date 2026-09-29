import { createRoot } from "react-dom/client";
import { MemoryRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { AppSidebar, SidebarProvider, SidebarTrigger } from "@/components/layout/AppSidebar";
import { NotificationsBell } from "@/components/shared/NotificationsBell";
import { SystemStatusMenu } from "@/components/shared/SystemStatusMenu";
import { UserMenu } from "@/components/shared/UserMenu";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AccelDashboard } from "./AccelDashboard";
import { TrmsLiveMonitoring } from "./TrmsLiveMonitoring";
import { TrmsAlertLog } from "./TrmsAlertLog";
import { TrmsDevices } from "./TrmsDevices";
import { TRMS_NAV } from "./trmsNav";
import { TrmsBreadcrumb } from "./TrmsBreadcrumb";
import "./proto.css";

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
                      <Route path="/live" element={<TrmsLiveMonitoring />} />
                      <Route path="/alerts" element={<TrmsAlertLog />} />
                      <Route path="/devices" element={<TrmsDevices />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
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
