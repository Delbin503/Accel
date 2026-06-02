import * as React from "react";
import { Play } from "lucide-react";

/**
 * Shared shell for sign-in / sign-up / onboarding screens. Two-column layout:
 *   - Left: brand panel with gradient + bullet points
 *   - Right: the actual auth/onboarding card
 *
 * Stacks on mobile (brand panel hidden below sm).
 */
export function AuthLayout({
  children,
  brandSlot,
}: {
  children: React.ReactNode;
  brandSlot?: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen grid-cols-1 bg-background text-foreground lg:grid-cols-[1fr_1.05fr]">
      {/* Brand panel — hidden on small screens */}
      <div
        className="relative hidden flex-col justify-between overflow-hidden p-10 lg:flex"
        style={{
          background:
            "radial-gradient(120% 80% at 0% 0%, rgba(221,114,36,0.35) 0%, rgba(40,30,15,0.4) 45%, rgba(0,0,0,0.95) 100%)",
        }}
      >
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-secondary">
            <Play className="size-4 fill-white text-white" />
          </div>
          <p className="text-[18px] font-bold tracking-tight text-foreground">Accel</p>
        </div>

        <div className="space-y-6">
          {brandSlot ?? (
            <>
              <h2 className="text-[28px] font-bold leading-tight text-foreground">
                AI-powered vision intelligence for every site you operate.
              </h2>
              <ul className="space-y-3 text-[13px] text-muted-foreground">
                <li className="flex items-start gap-2.5">
                  <span className="mt-1 size-1.5 flex-shrink-0 rounded-full bg-secondary" />
                  <span>
                    <strong className="text-foreground">Detect</strong> SOP breaches, intrusions and asset
                    movements in real time across every camera.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="mt-1 size-1.5 flex-shrink-0 rounded-full bg-secondary" />
                  <span>
                    <strong className="text-foreground">Investigate</strong> incidents in one place with
                    AI-linked evidence, timelines and reports.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="mt-1 size-1.5 flex-shrink-0 rounded-full bg-secondary" />
                  <span>
                    <strong className="text-foreground">Scale</strong> to any number of sites — each with
                    its own subscription, retention and team.
                  </span>
                </li>
              </ul>
            </>
          )}
        </div>

        <p className="text-[11px] text-muted-foreground">© 2026 Sigmawave · Powered by Accel TRMS</p>
      </div>

      {/* Auth content */}
      <div className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-[440px]">
          {/* Mobile-only inline logo */}
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex size-8 items-center justify-center rounded-md bg-secondary">
              <Play className="size-3.5 fill-white text-white" />
            </div>
            <p className="text-[16px] font-bold tracking-tight text-foreground">Accel</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
