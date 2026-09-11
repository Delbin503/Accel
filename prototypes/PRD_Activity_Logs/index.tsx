import * as React from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { ArrowUp } from "lucide-react";
import { AppSidebar, SidebarProvider } from "@/components/layout/AppSidebar";
import { ProtoBreadcrumb } from "../_shared/ProtoBreadcrumb";
import { NotificationsBell } from "@/components/shared/NotificationsBell";
import { SystemStatusMenu } from "@/components/shared/SystemStatusMenu";
import { UserMenu } from "@/components/shared/UserMenu";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import ActivityLogsPage from "@/pages/activity-logs";
import "./proto.css";

/* Back-to-top — the audit table runs long. Tracks both the inner <main>
   scroller and the window, since either can be the scroll container. */
function BackToTop({ scrollRef }: { scrollRef: React.RefObject<HTMLElement | null> }) {
  const [show, setShow] = React.useState(false);
  React.useEffect(() => {
    const el = scrollRef.current;
    const check = () => {
      const top = Math.max(el?.scrollTop ?? 0, window.scrollY, document.documentElement.scrollTop);
      setShow(top > 300);
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    el?.addEventListener("scroll", check, { passive: true });
    return () => {
      window.removeEventListener("scroll", check);
      el?.removeEventListener("scroll", check);
    };
  }, [scrollRef]);

  if (!show) return null;
  return (
    <button
      onClick={() => {
        scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
      aria-label="Back to top"
      title="Back to top"
      className="fixed bottom-6 right-6 z-[90] flex size-11 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-lg transition-colors hover:border-primary hover:text-primary"
    >
      <ArrowUp className="size-5" />
    </button>
  );
}

function NotInPrototype() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-24 text-center text-muted-foreground">
      <p className="text-sm font-medium text-foreground">Not part of this prototype</p>
      <p className="text-[12px]">
        This prototype only covers <strong className="text-foreground">Activity Logs</strong>.
      </p>
    </div>
  );
}

function App() {
  const mainRef = React.useRef<HTMLElement>(null);

  return (
    <ThemeProvider defaultTheme="dark">
      <MemoryRouter initialEntries={["/activity-logs"]}>
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
                  <main ref={mainRef} id="main-content" className="flex-1 overflow-auto p-6 focus:outline-none">
                    <Routes>
                      <Route path="/activity-logs" element={<ActivityLogsPage />} />
                      <Route path="/" element={<Navigate to="/activity-logs" replace />} />
                      <Route path="*" element={<NotInPrototype />} />
                    </Routes>
                  </main>
                </div>
              </div>
              <BackToTop scrollRef={mainRef} />
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
