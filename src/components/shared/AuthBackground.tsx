/**
 * Animated Accel auth background.
 *
 * Product-specific motion: the campus surveillance image carries the product
 * context, while lightweight SVG overlays add live routes, detection zones, and
 * status pings. Kept low-contrast so auth/onboarding forms remain primary.
 */
export function AuthBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
      <img
        className="auth-bg-image absolute inset-0 h-full w-full object-cover"
        src="/assets/onboarding-surveillance-bg.png"
        alt=""
        aria-hidden
      />
      <div className="auth-bg-image-shade absolute inset-0" />
      <div className="auth-bg-grid absolute inset-0" />
      <div className="auth-bg-scanline absolute inset-x-0 top-0 h-px" />

      <svg
        className="auth-onboarding-motion absolute inset-0 h-full w-full"
        viewBox="0 0 1680 960"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <defs>
          <filter id="auth-route-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g className="auth-zone-layer" filter="url(#auth-route-glow)">
          <path className="auth-zone auth-zone-a" d="M80 255L215 220L258 410L124 430Z" />
          <path className="auth-zone auth-zone-b" d="M1250 84H1494V245H1278V160H1250Z" />
          <path className="auth-zone auth-zone-c" d="M1262 585L1508 550L1560 700L1388 768L1278 706Z" />
        </g>

        <g className="auth-flow-lines">
          <path className="auth-flow auth-flow-a" d="M175 360C280 365 318 454 430 466S625 436 760 470" />
          <path className="auth-flow auth-flow-b" d="M760 470C930 438 1060 430 1212 440S1420 516 1605 478" />
          <path className="auth-flow auth-flow-c" d="M1214 440C1165 340 1190 210 1294 138" />
          <path className="auth-flow auth-flow-d" d="M1214 440C1190 575 1072 696 932 818" />
          <path className="auth-flow auth-flow-e" d="M1214 440C1276 560 1338 666 1485 640" />
        </g>

        <g className="auth-route-beads" filter="url(#auth-route-glow)">
          <circle className="auth-route-bead auth-delay-0" cx="430" cy="466" r="3.5" />
          <circle className="auth-route-bead auth-delay-2" cx="1212" cy="440" r="3.5" />
          <circle className="auth-route-bead auth-delay-4" cx="1485" cy="640" r="3.5" />
        </g>

        <g className="auth-detection-pings" filter="url(#auth-route-glow)">
          <Ping x={108} y={178} delayClass="auth-delay-0" />
          <Ping x={238} y={365} delayClass="auth-delay-2" />
          <Ping x={1288} y={132} delayClass="auth-delay-1" />
          <Ping x={1500} y={635} delayClass="auth-delay-3" />
          <Ping x={1635} y={690} delayClass="auth-delay-5" variant="critical" />
        </g>

        <g className="auth-status-dots">
          <circle cx="108" cy="178" r="4" />
          <circle cx="238" cy="365" r="4" />
          <circle cx="1288" cy="132" r="4" />
          <circle cx="1500" cy="635" r="4" />
          <circle className="auth-status-dot-critical" cx="1635" cy="690" r="4" />
        </g>
      </svg>

      <div className="auth-bg-focus absolute inset-0" />

      <Crosshair className="absolute left-4 top-4" />
      <Crosshair className="absolute right-4 top-4 scale-x-[-1]" />
      <Crosshair className="absolute bottom-4 left-4 scale-y-[-1]" />
      <Crosshair className="absolute bottom-4 right-4 scale-[-1]" />
    </div>
  );
}

function Ping({
  x,
  y,
  delayClass,
  variant = "default",
}: {
  x: number;
  y: number;
  delayClass: string;
  variant?: "default" | "critical";
}) {
  return (
    <g className={`auth-ping auth-ping-${variant} ${delayClass}`} transform={`translate(${x} ${y})`}>
      <circle r="18" />
      <circle r="34" />
    </g>
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
