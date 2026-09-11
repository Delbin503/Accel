import * as React from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { AppSidebar, SidebarProvider } from "@/components/layout/AppSidebar";
import { ProtoBreadcrumb } from "../_shared/ProtoBreadcrumb";
import { NotificationsBell } from "@/components/shared/NotificationsBell";
import { SystemStatusMenu } from "@/components/shared/SystemStatusMenu";
import { UserMenu } from "@/components/shared/UserMenu";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import RealLiveMonitoring from "./RealLiveMonitoring";
import { StateTester } from "./StateTester";
import type { ForcedState } from "./states";
import "./proto.css";
import { TesterShell } from "../_shared/TesterShell";

/* PROTOTYPE-ONLY: floating state tester — bottom-right, low opacity, reveals on hover. */
function FloatingTester({ value, onChange }: { value: ForcedState; onChange: (s: ForcedState) => void }) {
  return (
    <TesterShell>
      <StateTester value={value} onChange={onChange} />
    </TesterShell>
  );
}

function App() {
  const [forced, setForced] = React.useState<ForcedState>("normal");
  const resolve = () => setForced("normal");

  return (
    <ThemeProvider defaultTheme="dark">
    <MemoryRouter initialEntries={["/live"]}>
      <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={200}>
        <SidebarProvider defaultOpen={true}>
          <div className="flex min-h-screen w-full bg-background">
            <AppSidebar collapseTrigger />
            <div className="flex min-w-0 flex-1 flex-col">
              <header className="sticky top-0 z-[var(--z-sticky)] flex h-12 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur-sm">
                <ProtoBreadcrumb />
                <div className="flex-1" />
                <SystemStatusMenu />
                <NotificationsBell />
                <div className="mx-1 h-5 w-px shrink-0 bg-border" />
                <UserMenu />
              </header>
              <main id="main-content" className="flex-1 overflow-auto p-6 focus:outline-none">
                <Routes>
                  <Route path="/live" element={<RealLiveMonitoring forced={forced} onResolveForced={resolve} />} />
                  <Route path="*" element={<RealLiveMonitoring forced={forced} onResolveForced={resolve} />} />
                </Routes>
              </main>
            </div>
          </div>
          <FloatingTester value={forced} onChange={setForced} />
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
