/* Brand mark for the invite screens, matching the PRD design.

   NOTE: the app has two other marks — the sidebar's triangle-and-swoosh
   (components/layout/AppSidebar) and the auth pages' inline Play badge
   (pages/auth/AuthLayout). Worth unifying them into one brand component. */

/** Accel brand mark — matches the sidebar logo (orange play triangle + wordmark). */
export function AccelMark({ size = "md" }: { size?: "md" | "lg" }) {
  const box = size === "lg" ? "size-9" : "size-7";
  const mark = size === "lg" ? "size-5" : "size-4";
  const word = size === "lg" ? "text-xl" : "text-base";
  return (
    <div className="flex items-center gap-2.5">
      <div className={`flex ${box} items-center justify-center rounded-md bg-primary`}>
        <svg viewBox="0 0 14 14" className={`${mark} fill-primary-foreground`} aria-hidden>
          <polygon points="2,1 13,7 2,13" />
        </svg>
      </div>
      <span className={`${word} font-bold tracking-tight text-foreground`}>Accel</span>
    </div>
  );
}
