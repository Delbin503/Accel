import * as React from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Routes, Route, useNavigate } from "react-router-dom";
import { Toaster } from "sonner";
import { RotateCcw, LayoutDashboard } from "lucide-react";
import { AppSidebar, SidebarProvider, SidebarTrigger } from "@/components/layout/AppSidebar";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AccountSetup, type AccountProfile } from "./AccountSetup";
import { OtpVerify } from "./OtpVerify";
import { WelcomeModal } from "./WelcomeModal";
import { MOCK_INVITE, siteLabels, roleLabel, AccelMark } from "./shared";
import "./proto.css";

type Stage = "setup" | "verify" | "welcome";

/* PROTOTYPE-ONLY: restart the flow from the top without reloading the page. */
function RestartButton({ onRestart }: { onRestart: () => void }) {
  return (
    <button
      onClick={onRestart}
      title="Restart flow"
      className="fixed bottom-6 right-6 z-[100] flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-medium text-muted-foreground opacity-40 shadow-lg transition-opacity hover:opacity-100 hover:text-foreground"
    >
      <RotateCcw className="size-3.5" />
      Restart flow
    </button>
  );
}

/* Logged-out chrome — minimal top bar with theme toggle, no sidebar. */
function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-background">
      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>
      {children}
    </div>
  );
}

/* Pre-auth flow: setup form → email-code verification → welcome modal → dashboard. */
function SetupRoute({
  profile,
  onProfile,
}: {
  profile: AccountProfile | null;
  onProfile: (p: AccountProfile | null) => void;
}) {
  const navigate = useNavigate();
  const [stage, setStage] = React.useState<Stage>("setup");

  return (
    <AuthShell>
      {stage !== "setup" ? (
        <OtpVerify
          email={MOCK_INVITE.email}
          onVerified={() => setStage("welcome")}
          onBack={() => setStage("setup")}
        />
      ) : (
        <AccountSetup
          invite={MOCK_INVITE}
          onComplete={(p) => {
            onProfile(p);
            setStage("verify");
          }}
        />
      )}
      <WelcomeModal
        open={stage === "welcome"}
        firstName={profile?.firstName ?? ""}
        invite={MOCK_INVITE}
        onEnter={() => navigate("/dashboard")}
      />
    </AuthShell>
  );
}

/* The destination — real app shell (sidebar + header) with a first-run landing.
   Proves the invitee lands inside the authenticated dashboard. */
function DashboardRoute({ profile }: { profile: AccountProfile | null }) {
  const name = profile?.firstName || "there";
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-12 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur-sm">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" aria-label="Toggle sidebar" />
            <div className="flex-1" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto p-6">
            <div className="mx-auto max-w-2xl py-10">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary-muted text-primary">
                  <LayoutDashboard className="size-5" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    You're in, {name}.
                  </h1>
                  <p className="text-md text-muted-foreground">
                    Welcome to {MOCK_INVITE.orgName} on Accel.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground">Your role</p>
                  <p className="mt-1 text-lg font-semibold text-foreground">{roleLabel(MOCK_INVITE.role)}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground">Site access</p>
                  <p className="mt-1 text-lg font-semibold text-foreground">{siteLabels(MOCK_INVITE.siteIds)}</p>
                </div>
              </div>

              <p className="mt-6 text-sm text-muted-foreground">
                Use the sidebar to explore live monitoring, the detection feed, and your assigned sites.
              </p>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function App() {
  const [profile, setProfile] = React.useState<AccountProfile | null>(null);
  const [runId, setRunId] = React.useState(0);

  return (
    <ThemeProvider defaultTheme="dark">
      <MemoryRouter key={runId} initialEntries={["/setup"]}>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider delayDuration={200}>
            <Routes>
              <Route
                path="/setup"
                element={<SetupRoute profile={profile} onProfile={setProfile} />}
              />
              <Route path="/dashboard" element={<DashboardRoute profile={profile} />} />
              <Route path="*" element={<NotInPrototype />} />
            </Routes>
            <RestartButton
              onRestart={() => {
                setProfile(null);
                setRunId((n) => n + 1);
              }}
            />
            <Toaster position="top-right" theme="dark" />
          </TooltipProvider>
        </QueryClientProvider>
      </MemoryRouter>
    </ThemeProvider>
  );
}

function NotInPrototype() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background text-center text-muted-foreground">
      <AccelMark />
      <p className="text-sm font-medium text-foreground">Not part of this prototype</p>
      <p className="text-sm">This prototype covers the invite → account setup → welcome → dashboard flow.</p>
    </div>
  );
}

const el = document.getElementById("root");
if (el) createRoot(el).render(<App />);
