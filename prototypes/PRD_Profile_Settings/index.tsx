import * as React from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { Toaster } from "sonner";
import { ArrowUp, LogOut } from "lucide-react";
import { AppSidebar, SidebarProvider, SidebarTrigger } from "@/components/layout/AppSidebar";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/useAuthStore";
import ProfilePage from "@/pages/profile";
import SettingsPage from "@/pages/settings";
import BillingPage from "@/pages/billing";
import SystemInfoPage from "@/pages/system-info";
import "./proto.css";

/* Back-to-top — these pages (Billing, System Info) run long. Tracks both the
   inner <main> scroller and the window, since either can be the scroll container. */
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

/* PROTOTYPE-ONLY. Sign Out in the profile dropdown clears the auth store and
   routes to /signin, which also hides the sidebar's profile section — leaving no
   way back in a prototype with no auth flow. This stands in for the real sign-in
   screen (covered by PRD_Onboarding_Cloud) and restores the seeded user. */
function SignedOut() {
  const signIn = useAuthStore((s) => s.signIn);
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-24 text-center text-muted-foreground">
      <LogOut className="size-8 opacity-30" />
      <p className="text-base font-semibold text-foreground">Signed out</p>
      <p className="text-sm">
        The real sign-in screen lives in <strong className="text-foreground">PRD · Onboarding</strong>.
      </p>
      <Button
        size="sm"
        className="mt-1"
        onClick={() => {
          signIn({
            id: "usr-001",
            name: "Delbin Arkar",
            initials: "DA",
            role: "owner",
            email: "delbin@accel.ai",
            notificationCount: 4,
            orgName: "Accel TRMS",
          });
          navigate("/profile", { replace: true });
        }}
      >
        Sign back in
      </Button>
    </div>
  );
}

function NotInPrototype() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-24 text-center text-muted-foreground">
      <p className="text-sm font-medium text-foreground">Not part of this prototype</p>
      <p className="text-[12px]">
        This prototype only covers the <strong className="text-foreground">profile dropdown</strong>{" "}
        — My Profile, Settings, Billing &amp; License, and System Info.
      </p>
    </div>
  );
}

function App() {
  const mainRef = React.useRef<HTMLElement>(null);

  return (
    <ThemeProvider defaultTheme="dark">
      <MemoryRouter initialEntries={["/profile"]}>
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
                  <main ref={mainRef} id="main-content" className="flex-1 overflow-auto p-6 focus:outline-none">
                    <Routes>
                      {/* The four destinations of the sidebar profile dropdown */}
                      <Route path="/profile" element={<ProfilePage />} />
                      <Route path="/settings" element={<SettingsPage />} />
                      <Route path="/billing" element={<BillingPage />} />
                      <Route path="/system-info" element={<SystemInfoPage />} />
                      <Route path="/signin" element={<SignedOut />} />
                      <Route path="/" element={<Navigate to="/profile" replace />} />
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
