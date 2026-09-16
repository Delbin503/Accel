import { createRoot } from "react-dom/client";
import { MemoryRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { QueryClientProvider } from "@tanstack/react-query";
import { AppSidebar, SidebarProvider, SidebarTrigger } from "@/components/layout/AppSidebar";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { NotificationsBell } from "@/components/shared/NotificationsBell";
import { SystemStatusMenu } from "@/components/shared/SystemStatusMenu";
import { UserMenu } from "@/components/shared/UserMenu";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { queryClient } from "@/lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PAGES } from "./pages";
import { Breadcrumb, Phase13Index } from "./Phase13Home";
import "./proto.css";

/* Phase 1.3 prototype shell — routes the phase index to each proposal page. */

function App() {
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
                    <Breadcrumb />
                    <div className="flex-1" />
                    <ThemeToggle />
                    <SystemStatusMenu />
                    <NotificationsBell />
                    <div className="mx-1 h-5 w-px shrink-0 bg-border" />
                    <UserMenu />
                  </header>

                  <main id="main-content" className="flex-1 overflow-auto p-6 focus:outline-none">
                    <Routes>
                      <Route path="/" element={<Phase13Index />} />
                      {PAGES.map((p) => (
                        <Route key={p.path} path={p.path} element={<p.Component />} />
                      ))}
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
