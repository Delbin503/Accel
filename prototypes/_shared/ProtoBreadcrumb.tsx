import { Link, useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { NAV_GROUPS } from "@/components/layout/AppSidebar";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────────────
   PROTOTYPE-ONLY. Top-bar breadcrumb — "Manage › Site › Cameras".

   The trail is derived from the current path against the sidebar's own
   NAV_GROUPS, so it can never drift from the nav. Routes that live outside the
   sidebar (account pages, detail routes) are covered by EXTRA_ROUTES below.

   Must NOT be promoted to src/ as-is — the real app would want a Radix-backed
   breadcrumb primitive in components/ui/ with link semantics.
   ────────────────────────────────────────────────────────────────────────── */

/** Routes with no sidebar entry, or that need a deeper trail. */
const EXTRA_ROUTES: Record<string, string[]> = {
  "/detection-feed/dismissed": ["Monitor", "Detection Feed", "Dismissed Events"],
  "/recordings/enhance": ["Monitor", "Recordings", "Video Enhancement"],
  "/site/zones": ["Manage", "Site", "Zones"],
  "/users/deleted": ["System", "User Management", "Deleted Users"],
  "/profile": ["Account", "My Profile"],
  "/settings": ["Account", "Settings"],
  "/billing": ["Account", "Billing & License"],
  "/system-info": ["Account", "System Info"],
  "/dev/modals": ["Dev", "Modal Gallery"],
};

/** Longest-prefix match against the sidebar tree. */
function trailFromNav(pathname: string): string[] | null {
  let best: { length: number; trail: string[] } | null = null;

  const consider = (href: string, trail: string[]) => {
    const isMatch = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
    if (!isMatch) return;
    if (!best || href.length > best.length) best = { length: href.length, trail };
  };

  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      consider(item.href, [group.label, item.label]);
      for (const child of item.children ?? []) {
        consider(child.href, [group.label, item.label, child.label]);
      }
    }
  }

  return best ? (best as { trail: string[] }).trail : null;
}

function protoTrail(pathname: string): string[] {
  const extra = Object.keys(EXTRA_ROUTES)
    .filter((r) => pathname === r || pathname.startsWith(r + "/"))
    .sort((a, b) => b.length - a.length)[0];
  if (extra) return EXTRA_ROUTES[extra];
  return trailFromNav(pathname) ?? ["Dashboard"];
}

/** A crumb is a label, or a label with the page it opens. */
export type Crumb = string | { label: string; href?: string };

export function ProtoBreadcrumb({
  trail: forced,
  className,
}: {
  /** Override the derived trail — for routes a prototype fakes. Crumbs given an href become links. */
  trail?: Crumb[];
  className?: string;
}) {
  const { pathname } = useLocation();
  const trail = (forced ?? protoTrail(pathname)).map((c) => (typeof c === "string" ? { label: c } : c));

  return (
    <nav aria-label="Breadcrumb" className={cn("flex min-w-0 items-center gap-1", className)}>
      <ol className="flex min-w-0 items-center gap-1">
        {trail.map((crumb, i) => {
          const isLast = i === trail.length - 1;
          return (
            <li key={`${crumb.label}-${i}`} className="flex min-w-0 items-center gap-1">
              {i > 0 && (
                <ChevronRight className="size-3 shrink-0 text-muted-foreground/60" aria-hidden />
              )}
              {/* Earlier crumbs with a page link back to it; group labels and the current page stay text. */}
              {!isLast && crumb.href ? (
                <Link to={crumb.href} className="truncate text-base text-muted-foreground transition-colors hover:text-foreground">
                  {crumb.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={cn(
                    "truncate text-base",
                    isLast ? "font-medium text-foreground" : "text-muted-foreground"
                  )}
                >
                  {crumb.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
