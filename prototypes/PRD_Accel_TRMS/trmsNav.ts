import { NAV_GROUPS, type NavGroup, type NavItem } from "@/components/layout/AppSidebar";

/* TRMS's nav — the app's own sidebar, cut down to the screens TRMS has.

   It is filtered from the app's NAV_GROUPS rather than written out again, so
   labels, icons and order stay the app's, and the paths are the app's own
   routes: links inside the real pages (a detection → its case, an NVR → its
   camera) land on the right screen without any rewriting. */

/** The app routes TRMS covers. Anything else is not part of this prototype. */
const TRMS_HREFS = new Set([
  "/",
  "/live",
  "/detection-feed",
  "/site",
  "/site/overview",
  "/site/cameras",
  "/site/nvr",
  "/rules",
  "/incidents",
  "/activity-logs",
]);

/** TRMS calls cameras "devices". */
const RELABEL: Record<string, string> = { "/site/cameras": "Devices" };

function keep(item: NavItem): NavItem | null {
  if (!TRMS_HREFS.has(item.href)) return null;
  const children = item.children?.map(keep).filter((c): c is NavItem => c !== null);
  return { ...item, label: RELABEL[item.href] ?? item.label, children };
}

export const TRMS_NAV: NavGroup[] = NAV_GROUPS.map((group) => ({
  ...group,
  items: group.items.map(keep).filter((i): i is NavItem => i !== null),
})).filter((group) => group.items.length > 0);

/** Breadcrumb trail for a path: group › item › child, from the nav above. */
export function trmsTrail(pathname: string): string[] {
  let best: { len: number; trail: string[] } | null = null;
  const consider = (href: string, trail: string[]) => {
    const match = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
    if (match && (!best || href.length > best.len)) best = { len: href.length, trail };
  };
  for (const group of TRMS_NAV) {
    for (const item of group.items) {
      consider(item.href, [group.label, item.label]);
      for (const child of item.children ?? []) consider(child.href, [group.label, item.label, child.label]);
    }
  }
  return (best as { trail: string[] } | null)?.trail ?? ["Accel"];
}
