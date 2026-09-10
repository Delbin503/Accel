import * as React from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { AppSidebar, SidebarProvider, SidebarTrigger } from "@/components/layout/AppSidebar";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { NotificationsBell } from "@/components/shared/NotificationsBell";
import { SystemStatusMenu } from "@/components/shared/SystemStatusMenu";
import { UserMenu } from "@/components/shared/UserMenu";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import RealDashboard from "./RealDashboard";
import { StateTester } from "./StateTester";
import type { ForcedState, HealthMode, ScaleMode } from "./states";
import "./proto.css";
import { TesterShell } from "../_shared/TesterShell";

/* PROTOTYPE-ONLY: floating state tester — bottom-right, low opacity, reveals on hover. */
function FloatingTester(props: {
  value: ForcedState;
  onChange: (s: ForcedState) => void;
  health: HealthMode;
  onHealthChange: (h: HealthMode) => void;
  scale: ScaleMode;
  onScaleChange: (s: ScaleMode) => void;
}) {
  return (
    <TesterShell>
      <StateTester {...props} />
    </TesterShell>
  );
}

function App() {
  const [forced, setForced] = React.useState<ForcedState>("normal");
  const [health, setHealth] = React.useState<HealthMode>("degraded");
  const [scale, setScale] = React.useState<ScaleMode>("normal");
  const resolve = () => setForced("normal");

  return (
    <ThemeProvider defaultTheme="dark">
    <MemoryRouter initialEntries={["/"]}>
      <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={200}>
        <SidebarProvider defaultOpen={true}>
          <div className="flex min-h-screen w-full bg-background">
            <AppSidebar />
            <div className="flex min-w-0 flex-1 flex-col">
              <header className="sticky top-0 z-[var(--z-sticky)] flex h-12 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur-sm">
                <SidebarTrigger className="text-muted-foreground hover:text-foreground" aria-label="Toggle sidebar" />
                <div className="flex-1" />
                <ThemeToggle />
                <SystemStatusMenu forcedHealth={health} />
                <NotificationsBell />
                <div className="mx-1 h-5 w-px shrink-0 bg-border" />
                <UserMenu />
              </header>
              <main id="main-content" className="flex-1 overflow-auto p-6 focus:outline-none">
                <Routes>
                  <Route path="*" element={<RealDashboard forced={forced} onResolveForced={resolve} forcedHealth={health} scale={scale} />} />
                </Routes>
              </main>
            </div>
          </div>
          <FloatingTester value={forced} onChange={setForced} health={health} onHealthChange={setHealth} scale={scale} onScaleChange={setScale} />
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
