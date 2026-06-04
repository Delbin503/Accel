/**
 * Animated background for auth / onboarding screens.
 *
 * Three layers, all behind the form, all pointer-events:none:
 *   1. Subtle dot grid — evokes the surveillance / CV camera-overlay feel.
 *   2. Drifting blob orbs in the brand palette (orange/blue/purple)
 *      that float slowly via CSS @keyframes (see index.css).
 *   3. A slow vertical scanline that sweeps top-to-bottom every 14s,
 *      mimicking a security camera's IR pass.
 */
export function AuthBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
      {/* Vignette base — slightly darker at the corners */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 0%, rgba(255,255,255,0.025) 0%, transparent 60%), radial-gradient(120% 80% at 50% 100%, rgba(0,0,0,0.35) 0%, transparent 55%)",
        }}
      />

      {/* Dot grid */}
      <div
        className="absolute inset-0 opacity-[0.10]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.65) 1px, transparent 0)",
          backgroundSize: "28px 28px",
          maskImage:
            "radial-gradient(ellipse 80% 60% at 50% 50%, #000 40%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 60% at 50% 50%, #000 40%, transparent 80%)",
        }}
      />

      {/* Drifting blob orbs */}
      <div
        className="animate-auth-blob-1 absolute -left-32 -top-32 size-[520px] rounded-full opacity-[0.18]"
        style={{
          background:
            "radial-gradient(circle, #DD7224 0%, transparent 65%)",
          filter: "blur(70px)",
        }}
      />
      <div
        className="animate-auth-blob-2 absolute -right-40 top-1/4 size-[460px] rounded-full opacity-[0.14]"
        style={{
          background:
            "radial-gradient(circle, #4477FF 0%, transparent 65%)",
          filter: "blur(70px)",
        }}
      />
      <div
        className="animate-auth-blob-3 absolute -bottom-40 left-1/3 size-[500px] rounded-full opacity-[0.12]"
        style={{
          background:
            "radial-gradient(circle, #B33CFF 0%, transparent 65%)",
          filter: "blur(80px)",
        }}
      />

      {/* Slow scanning line — security-camera IR pass feel */}
      <div className="animate-auth-scanline absolute inset-x-0 top-0 h-px">
        <div
          className="h-px w-full"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(221,114,36,0.35) 25%, rgba(221,114,36,0.55) 50%, rgba(221,114,36,0.35) 75%, transparent 100%)",
            boxShadow: "0 0 16px rgba(221,114,36,0.35)",
          }}
        />
      </div>

      {/* Corner crosshair marks — subtle CCTV / HUD feel */}
      <Crosshair className="absolute left-4 top-4" />
      <Crosshair className="absolute right-4 top-4 scale-x-[-1]" />
      <Crosshair className="absolute left-4 bottom-4 scale-y-[-1]" />
      <Crosshair className="absolute right-4 bottom-4 scale-[-1]" />
    </div>
  );
}

function Crosshair({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      aria-hidden
    >
      <path
        d="M1 1H8M1 1V8"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        className="text-muted-foreground/30"
      />
    </svg>
  );
}
