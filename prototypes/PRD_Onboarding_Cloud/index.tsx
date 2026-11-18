import * as React from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { TooltipProvider } from "@accel/ui/components/ui/tooltip";
import SignInPage from "@/pages/auth/SignIn";
import SignInVerifyPage from "@/pages/auth/SignInVerify";
import SignUpPage from "@/pages/auth/SignUp";
import ForgotPasswordPage from "@/pages/auth/ForgotPassword";
import AccountSuspendedPage from "@/pages/auth/AccountSuspended";
import DashboardPage from "@/pages/dashboard";
import { AppLayout } from "@/components/app/AppLayout";
import { StateTester } from "./StateTester";
import { CLOUD_SCREENS, type CloudScreen, type AsyncMode } from "./screens";
import {
  LoadingPreview,
  ErrorPreview,
  DonePreview,
  NotInPrototype,
} from "./shared";
import "./proto.css";
import { TesterShell } from "../_shared/TesterShell";

function Shell() {
  const navigate = useNavigate();
  const location = useLocation();
  const [asyncMode, setAsyncMode] = React.useState<AsyncMode>("idle");

  // Current screen is derived from the route (best-match by path).
  const screen: CloudScreen | null =
    [...CLOUD_SCREENS].reverse().find((s) => location.pathname.startsWith(s.path))?.key ?? null;

  function goTo(s: CloudScreen) {
    setAsyncMode("idle");
    const target = CLOUD_SCREENS.find((x) => x.key === s)!;
    navigate(target.path, target.state ? { state: target.state } : undefined);
  }

  return (
    <div data-slot="onboarding-cloud-prototype" className="min-h-screen w-full bg-background">
      {asyncMode === "loading" ? (
        <LoadingPreview />
      ) : asyncMode === "error" ? (
        <ErrorPreview onRetry={() => setAsyncMode("idle")} />
      ) : (
        <Routes>
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/signin/verify" element={<SignInVerifyPage />} />
          <Route path="/signup" element={<SignUpPage key="su-account" />} />
          {/* Deep-link into the real SignUp wizard steps via initialStep. */}
          <Route path="/signup/plan" element={<SignUpPage key="su-plan" initialStep="plan" />} />
          <Route path="/signup/payment" element={<SignUpPage key="su-payment" initialStep="payment" />} />
          <Route path="/signup/site" element={<SignUpPage key="su-site" initialStep="site" />} />
          <Route path="/signup/team" element={<SignUpPage key="su-team" initialStep="team" />} />
          {/* Opens on a filled-in sign-up so every review section has content. */}
          <Route path="/signup/review" element={<SignUpPage key="su-review" initialStep="review" />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          {/* Sign-in dead end for a suspended account. */}
          <Route path="/account-suspended" element={<AccountSuspendedPage />} />
          <Route path="/done" element={<DonePreview />} />
          {/* Sign-up's Confirm Checkout lands on the real dashboard, which shows the welcome modal. */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
          </Route>
          <Route path="*" element={<NotInPrototype />} />
        </Routes>
      )}

      {/* PROTOTYPE-ONLY floating tester — low opacity, reveals on hover. */}
      <TesterShell position="top-6 right-6">
        <StateTester screen={screen} onScreen={goTo} async={asyncMode} onAsync={setAsyncMode} />
      </TesterShell>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <MemoryRouter initialEntries={["/signin"]}>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider delayDuration={200}>
            <Shell />
            <Toaster position="top-right" theme="dark" />
          </TooltipProvider>
        </QueryClientProvider>
      </MemoryRouter>
    </ThemeProvider>
  );
}

const el = document.getElementById("root");
if (el) createRoot(el).render(<App />);
