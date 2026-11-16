import * as React from "react";
import { Play } from "lucide-react";
import { Link } from "react-router-dom";
import { AuthBackground } from "@/components/app/AuthBackground";

/**
 * Shell for sign-in / forgot-password / single-screen auth pages.
 *
 * Dark void with a subtle animated background. Floating Accel logo
 * top-left. Single centred column.
 */
export function AuthLayout({
  children,
  cancelHref,
  wide,
  hideBrand = false,
}: {
  children: React.ReactNode;
  cancelHref?: string;
  wide?: boolean;
  /** Hide the corner brand — used by pages that show a centered hero logo. */
  hideBrand?: boolean;
  /** Reserved — kept for backwards-compat with old callsite signatures. */
  brandSlot?: React.ReactNode;
}) {
  return (
    <div data-slot="auth-layout" className="relative min-h-screen text-foreground">
      <AuthBackground />

      {/* Landmarks: the corner links sit in a <header> (`contents`, so the
          absolutely positioned links lay out as before); the form is <main>. */}
      {(!hideBrand || cancelHref) && (
      <header data-slot="auth-layout-header" className="contents">
      {!hideBrand && (
        <Link
          to="/signin"
          className="absolute left-5 top-5 z-10 flex items-center gap-2 sm:left-8 sm:top-6"
        >
          <div className="flex size-7 items-center justify-center rounded-md bg-secondary">
            <Play className="size-3 fill-media-foreground text-media-foreground" />
          </div>
          <p className="text-md font-bold tracking-tight text-foreground">
            Accel
          </p>
        </Link>
      )}

      {cancelHref && (
        <Link
          to={cancelHref}
          className="absolute right-5 top-5 z-10 rounded-md border border-border bg-card/40 px-3 py-1.5 text-sm font-semibold text-muted-foreground backdrop-blur-sm transition-colors hover:text-foreground sm:right-8 sm:top-6"
        >
          Cancel
        </Link>
      )}
      </header>
      )}

      <main data-slot="auth-layout-main" className="flex min-h-screen items-center justify-center px-4 py-16 sm:px-6">
        <div data-slot="auth-layout-content" className={wide ? "w-full max-w-[1024px]" : "w-full max-w-[420px]"}>
          {children}
        </div>
      </main>
    </div>
  );
}
