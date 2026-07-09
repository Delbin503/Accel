import { cn } from "@/lib/utils";

/**
 * Accel token coin — brand icon used for Run Analysis credits.
 *
 * Vector recreation of the uploaded coin so it stays crisp at 12–28px.
 * To use the exact uploaded artwork instead, drop the file at
 * `src/assets/accel-coin.png` and replace the <svg> body with:
 *   <img src={accelCoin} className={cn("object-contain", className)} alt="" />
 * (import accelCoin from "@/assets/accel-coin.png").
 */
export function CoinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={cn(className)} aria-hidden="true" role="img">
      <circle cx="24" cy="24" r="22" fill="#F5821F" stroke="#0B0B0B" strokeWidth="2.5" />
      <circle cx="24" cy="24" r="18" fill="none" stroke="#0B0B0B" strokeWidth="1.2" />
      {/* Accel mark: play triangle + swoosh + tail */}
      <path d="M20.5 11 L28.5 31.5 L12.5 31.5 Z" fill="#0B0B0B" />
      <path
        d="M16 33 C 24.5 28.4 30.5 23.8 40 14.6 C 35.6 24 29 29.2 21 34.8 Z"
        fill="#0B0B0B"
      />
      <path d="M30.6 31.2 L37.6 27 L36 34 L29 35.6 Z" fill="#0B0B0B" />
    </svg>
  );
}
