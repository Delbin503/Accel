import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * A bar pinned to the bottom of the viewport that keeps its module's column.
 *
 * `sticky` was the obvious answer and the wrong one: the page grows rather
 * than scrolling inside `<main>`, so a sticky bar parks at the bottom of the
 * content, which can be far below the fold. `fixed` pins it to the viewport
 * but drops out of flow, losing the column — so an in-flow, zero-height
 * anchor stays behind to report where that column is, and the bar follows it.
 */
export function FloatingBar({ children, className }: {
  children: React.ReactNode;
  className?: string;
}) {
  const anchorRef = React.useRef<HTMLDivElement>(null);
  const [box, setBox] = React.useState<{ left: number; width: number } | null>(null);

  React.useEffect(() => {
    const el = anchorRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setBox({ left: r.left, width: r.width });
    };
    // Fires on observe, so the first measurement arrives without a synchronous
    // setState here, and again whenever the sidebar collapses or the pane resizes.
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <>
      <div ref={anchorRef} aria-hidden className="h-0 w-full" />
      {box && (
        <div
          className={cn("fixed bottom-6 z-[var(--z-sticky)]", className)}
          style={{ left: box.left, width: box.width }}
        >
          {children}
        </div>
      )}
    </>
  );
}
