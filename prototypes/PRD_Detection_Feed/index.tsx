import * as React from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { AppSidebar, SidebarProvider, SidebarTrigger } from "@/components/layout/AppSidebar";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import RealDetectionFeed from "./RealDetectionFeed";
import RealDismissed from "./RealDismissed";
import { StateTester } from "./StateTester";
import type { ForcedState } from "./shared";
import "./proto.css";

/* PROTOTYPE-ONLY: floating state tester — bottom-right, low opacity, reveals on hover.
   Excluded when promoting to src. */
function FloatingTester({ value, onChange }: { value: ForcedState; onChange: (s: ForcedState) => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-[100] opacity-30 transition-opacity duration-200 hover:opacity-100">
      <StateTester value={value} onChange={onChange} />
    </div>
  );
}

function App() {
  const [forced, setForced] = React.useState<ForcedState>("normal");
  const resolve = () => setForced("normal");

  return (
    <ThemeProvider defaultTheme="dark">
    <MemoryRouter initialEntries={["/detection-feed"]}>
      <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={200}>
        <SidebarProvider defaultOpen={true}>
          <div className="flex min-h-screen w-full bg-background">
            <AppSidebar />
            <div className="flex min-w-0 flex-1 flex-col">
              <header className="sticky top-0 z-10 flex h-12 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur-sm">
                <SidebarTrigger className="text-muted-foreground hover:text-foreground" aria-label="Toggle sidebar" />
                <div className="flex-1" />
                <ThemeToggle />
              </header>
              <main id="main-content" className="flex-1 overflow-auto p-6 focus:outline-none">
                <Routes>
                  <Route path="/detection-feed" element={<RealDetectionFeed forced={forced} onResolveForced={resolve} />} />
                  <Route path="/detection-feed/dismissed" element={<RealDismissed forced={forced} onResolveForced={resolve} />} />
                  <Route path="*" element={<NotInPrototype />} />
                </Routes>
              </main>
            </div>
          </div>
          <FloatingTester value={forced} onChange={setForced} />
          <Toaster position="top-center" theme="dark" richColors />
        </SidebarProvider>
      </TooltipProvider>
      </QueryClientProvider>
    </MemoryRouter>
    </ThemeProvider>
  );
}

function NotInPrototype() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-24 text-center text-muted-foreground">
      <p className="text-sm font-medium text-foreground">Not part of this prototype</p>
      <p className="text-[12px]">This prototype only covers <strong className="text-foreground">Detection Feed</strong> and <strong className="text-foreground">Dismissed Events</strong>.</p>
    </div>
  );
}

const el = document.getElementById("root");
if (el) createRoot(el).render(<App />);
