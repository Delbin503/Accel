import * as React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@accel/ui/lib/utils";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarRail,
  SidebarTrigger,
} from "@accel/ui/components/ui/sidebar";
import { useSidebar } from "@accel/ui/components/ui/sidebar-context";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@accel/ui/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipTrigger } from "@accel/ui/components/ui/tooltip";
import sigmawaveLogo from "@/assets/sigmawave-logo.svg";
import { NAV_GROUPS, type NavGroup, type NavItem } from "./nav-groups";

// NAV_GROUPS lives in ./nav-groups.ts so this file only exports components
// (React Fast Refresh). The types are re-exported for existing importers.
export type { NavGroup, NavItem };

const PROTOTYPE_ROUTES: Record<string, string> = {
  "/": "/PRD_Dashboard/",
  "/live": "/PRD_Live_Monitoring/",
  "/recordings": "/PRD_Recordings/",
  "/detection-feed": "/PRD_Detection_Feed/",
  "/site/overview": "/PRD_Site_Management/",
  "/site/cameras": "/PRD_Cameras/",
  "/site/nvr": "/PRD_NVR_Devices/",
  "/models": "/PRD_Model_Management/",
  "/rules": "/PRD_Rule_Library/",
  "/incidents": "/PRD_Incident_Cases/",
  "/analysis": "/PRD_Run_Analysis/",
  "/deployment": "/PRD_Model_Deployment/",
  "/users": "/PRD_User_Management/",
  "/device-health": "/PRD_Device_Health/",
  "/config": "/PRD_System_Configuration/",
  "/activity-logs": "/PRD_Activity_Logs/",
};

function prototypeHref(href: string) {
  if (typeof window === "undefined" || !window.location.pathname.startsWith("/PRD_")) {
    return undefined;
  }

  return PROTOTYPE_ROUTES[href];
}

/* Rendered inside `SidebarMenuButton asChild`, which passes the button's
   className, data attributes and ref down to this element — they must reach
   the <a> / NavLink, or the menu item loses all of its styling. */
const SidebarLink = React.forwardRef<
  HTMLAnchorElement,
  { href: string; children: React.ReactNode } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">
>(({ href, children, ...props }, ref) => {
  const destination = prototypeHref(href);
  if (destination) {
    return (
      <a ref={ref} href={destination} {...props}>
        {children}
      </a>
    );
  }
  return (
    <NavLink ref={ref} to={href} end={href === "/"} {...props}>
      {children}
    </NavLink>
  );
});
SidebarLink.displayName = "SidebarLink";

/* ─── Logo ──────────────────────────────────────────────────────────────── */

/* Accel logo — the brand lockup from assets/accel-logo-dark.svg, drawn inline.

   Inline rather than an <img> for two reasons. The source file is the dark-
   background version: its wordmark is white, which would vanish in the light
   theme, so here the wordmark takes the foreground token instead. And the
   source carries a drop shadow plus wide padding around the artwork; the
   viewBox below is cropped to the artwork so the logo sizes predictably. */

const MARK_PATHS = [
  "M32.4233 7.64709L12.3529 41.2141H24.3408C28.2487 31.3687 32.1165 27.548 40.5882 22.3275L32.4233 7.64709Z",
  "M53.3717 26.2863C38.6929 28.3662 32.7562 33.384 25.3305 47.6471C28.9353 33.8212 33.1949 28.603 44.0521 24.0595C47.9968 24.51 50.0182 25.0238 53.3717 26.2863Z",
  "M37.5367 34.7811L40.4233 40.5543H50.815L45.1243 30.7399C42.2301 31.7791 40.5668 32.6701 37.5367 34.7811Z",
];

const WORDMARK_PATHS = [
  "M67.7596 40.505H63.9796L63.8066 37.9109H57.7784L56.4937 40.505H52.8619L61.5584 23.7791H66.4748L67.7596 40.505ZM63.6831 35.1438L63.1643 27.1391L59.1125 35.1438H63.6831Z",
  "M79.6948 40.505H70.8748C69.4913 40.505 68.923 40.0356 68.923 39.0226C68.923 38.7509 68.9725 38.4297 69.0466 38.0591L70.6525 30.4497C70.9983 28.7697 71.7395 28.0038 73.5183 28.0038H82.3383L81.696 31.0426H74.6548C74.1113 31.0426 73.963 31.1662 73.8395 31.7097L72.7772 36.7003C72.7525 36.8238 72.7278 36.9226 72.7278 37.0215C72.7278 37.2932 72.876 37.392 73.296 37.392H80.3372L79.6948 40.505Z",
  "M92.5911 40.505H83.7711C82.3876 40.505 81.8193 40.0356 81.8193 39.0226C81.8193 38.7509 81.8687 38.4297 81.9429 38.0591L83.5487 30.4497C83.8946 28.7697 84.6358 28.0038 86.4146 28.0038H95.2346L94.5923 31.0426H87.5511C87.0076 31.0426 86.8593 31.1662 86.7358 31.7097L85.6734 36.7003C85.6487 36.8238 85.624 36.9226 85.624 37.0215C85.624 37.2932 85.7723 37.392 86.1923 37.392H93.2334L92.5911 40.505Z",
  "M106.698 40.505H96.5685C95.1603 40.505 94.5921 40.0356 94.5921 39.0226C94.5921 38.7509 94.6415 38.4297 94.7156 38.0591L96.3215 30.4497C96.6674 28.7697 97.4085 28.0038 99.2121 28.0038H107.661C108.921 28.0038 109.416 28.4732 109.416 29.4368C109.416 29.7085 109.391 30.005 109.317 30.3509L108.279 35.2673H99.9532L100.373 33.192H105.413L105.784 31.512C105.809 31.3885 105.809 31.2897 105.809 31.1909C105.809 30.9438 105.685 30.845 105.29 30.845H100.324C99.7556 30.845 99.6321 30.9932 99.5085 31.5368L98.3474 36.9226C98.3227 37.0709 98.298 37.1944 98.298 37.2932C98.298 37.5897 98.4462 37.6638 98.8662 37.6638H107.291L106.698 40.505Z",
  "M112.681 40.505H109.222L112.977 22.7662H116.436L112.681 40.505Z",
];

function AccelLogo() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <div
      data-slot="app-sidebar-logo"
      className={cn(
        "flex items-center py-1",
        isCollapsed ? "justify-center px-0" : "px-2"
      )}
    >
      {/* Collapsed to the icon rail there is only room for the mark, so the
          viewBox narrows to it and the wordmark is left out. It shrinks a step
          too, clear of the edge toggle that straddles the rail's border. */}
      <svg
        data-slot="app-sidebar-logo-mark"
        viewBox={isCollapsed ? "12 7 42 41" : "12 7 105 41"}
        role="img"
        aria-label="Accel"
        className={cn("shrink-0", isCollapsed ? "size-6" : "h-8 w-auto")}
      >
        {/* --brand-mark is the logo file's exact orange (not the primary token,
            which is a shade off); a re-skin overrides it. */}
        <g data-slot="app-sidebar-logo-mark-shape" className="fill-brand-mark">
          {MARK_PATHS.map((d) => <path key={d} d={d} />)}
        </g>
        {!isCollapsed && (
          <g className="fill-foreground">
            {WORDMARK_PATHS.map((d) => <path key={d} d={d} />)}
          </g>
        )}
      </svg>
    </div>
  );
}

/* ─── Single nav item (leaf) ────────────────────────────────────────────── */

function NavLeaf({ item }: { item: NavItem }) {
  const location = useLocation();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const isActive =
    item.href === "/"
      ? location.pathname === "/"
      : location.pathname === item.href || location.pathname.startsWith(item.href + "/");

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        tooltip={isCollapsed ? item.label : undefined}
        className={cn(
          "relative rounded-md border-l-2 border-transparent transition-colors",
          // In the rail, 2px less left padding offsets the active-state border, so the icon sits dead centre.
          "group-data-[collapsible=icon]:pl-1.5!",
          isActive &&
            "border-primary bg-primary/10 text-primary-ink hover:bg-primary/10 hover:text-primary-ink"
        )}
      >
        <SidebarLink href={item.href}>
          <item.icon
            data-slot="app-sidebar-item-icon"
            className={cn("size-4 shrink-0", isActive ? "text-primary-ink" : "text-muted-foreground")}
          />
          <span data-slot="app-sidebar-item-label">{item.label}</span>
        </SidebarLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

/* ─── Collapsible nav item (parent with children) ───────────────────────── */

function NavParent({ item }: { item: NavItem }) {
  const location = useLocation();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const isAnyChildActive =
    item.children?.some(
      (c) => location.pathname === c.href || location.pathname.startsWith(c.href + "/")
    ) ?? false;

  const [open, setOpen] = React.useState(isAnyChildActive);

  // Collapsed (icon) mode: clicking the parent icon toggles an inline group of
  // child icons revealed right inside the rail (grouped by an orange overlay so
  // they still read as belonging to the parent). Hover shows the label tooltip.
  if (isCollapsed) {
    return (
      <>
        <SidebarMenuItem>
          <SidebarMenuButton
            onClick={() => setOpen((v) => !v)}
            isActive={isAnyChildActive}
            tooltip={item.label}
            className={cn(
              "relative rounded-md border-l-2 border-transparent transition-colors",
              // In the rail, 2px less left padding offsets the active-state border, so the icon sits dead centre.
              "group-data-[collapsible=icon]:pl-1.5!",
              isAnyChildActive &&
                "border-primary bg-primary/10 text-primary-ink hover:bg-primary/10 hover:text-primary-ink"
            )}
          >
            <item.icon
            data-slot="app-sidebar-item-icon"
              className={cn(
                "size-4 shrink-0",
                isAnyChildActive ? "text-primary-ink" : "text-muted-foreground"
              )}
            />
            <span data-slot="app-sidebar-item-label" className="sr-only">{item.label}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>

        {open && (
          <div data-slot="app-sidebar-rail-group" className="-mx-1 my-0.5 flex flex-col items-center gap-1 rounded-lg border border-primary/40 px-1 py-1">
            {item.children?.map((child) => {
              const childActive =
                location.pathname === child.href ||
                location.pathname.startsWith(child.href + "/");

              return (
                <SidebarMenuItem key={child.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={childActive}
                    tooltip={child.label}
                    className={cn(
                      "rounded-md transition-colors",
                      childActive &&
                        "bg-primary/10 text-primary-ink hover:bg-primary/10 hover:text-primary-ink"
                    )}
                  >
                    <SidebarLink href={child.href}>
                      <child.icon
            data-slot="app-sidebar-item-icon"
                        className={cn(
                          "size-4 shrink-0",
                          childActive ? "text-primary-ink" : "text-muted-foreground"
                        )}
                      />
                      <span data-slot="app-sidebar-item-label">{child.label}</span>
                    </SidebarLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </div>
        )}
      </>
    );
  }

  return (
    // asChild: the <li> itself is the collapsible root, so the menu <ul> has only <li> children.
    <Collapsible asChild open={open} onOpenChange={setOpen} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            className={cn(
              "relative rounded-md border-l-2 border-transparent transition-colors",
              isAnyChildActive &&
                "border-primary bg-primary/10 text-primary-ink hover:bg-primary/10 hover:text-primary-ink"
            )}
          >
            <item.icon
            data-slot="app-sidebar-item-icon"
              className={cn(
                "size-4 shrink-0",
                isAnyChildActive ? "text-primary-ink" : "text-muted-foreground"
              )}
            />
            <span data-slot="app-sidebar-item-label">{item.label}</span>
            <ChevronDown
              data-slot="app-sidebar-item-chevron"
              className={cn(
                "ml-auto size-3.5 shrink-0 text-muted-foreground transition-transform duration-[var(--duration-normal)]",
                open && "rotate-180"
              )}
            />
          </SidebarMenuButton>
        </CollapsibleTrigger>

        <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
          <SidebarMenuSub className="my-1 gap-0.5 rounded-md border-primary/50 bg-primary/[0.06] py-1.5">
            {item.children?.map((child) => {
              const childActive =
                location.pathname === child.href ||
                location.pathname.startsWith(child.href + "/");

              return (
                <SidebarMenuSubItem key={child.href}>
                  <SidebarMenuSubButton
                    asChild
                    isActive={childActive}
                    className={cn(
                      childActive && "text-primary-ink"
                    )}
                  >
                    <SidebarLink href={child.href}>
                      <child.icon
            data-slot="app-sidebar-item-icon"
                        className={cn(
                          "size-4 shrink-0",
                          childActive ? "text-primary-ink" : "text-muted-foreground"
                        )}
                      />
                      <span data-slot="app-sidebar-item-label">{child.label}</span>
                    </SidebarLink>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              );
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

/* ─── Sigmawave footer ──────────────────────────────────────────────────── */

function SigmawaveFooter() {
  const { state } = useSidebar();
  if (state === "collapsed") return null;

  return (
    <div data-slot="app-sidebar-credits" className="px-4 pb-3 pt-1 text-center">
      <div data-slot="app-sidebar-credits-row" className="flex items-center justify-center gap-1.5">
        <p data-slot="app-sidebar-credits-label" className="text-2xs text-muted-foreground">Powered by</p>
        <img data-slot="app-sidebar-credits-logo" src={sigmawaveLogo} alt="Sigmawave" className="h-3 w-auto" />
      </div>
      <p data-slot="app-sidebar-version" className="mt-1 text-2xs leading-relaxed text-muted-foreground">Version 1.01</p>
    </div>
  );
}

/* ─── Edge toggle ───────────────────────────────────────────────────────── */

/* The collapse control is a small round button sitting on the sidebar's right
   edge, level with the logo, in place of a trigger in the top bar. It is fixed
   to the viewport rather than placed inside the sidebar: the sidebar is its own
   stacking context below the sticky top bar, which would cover the half of the
   button that hangs over the page. It follows the sidebar's width as it
   collapses. On mobile the sidebar is a sheet, so the top bar keeps its
   trigger there and this button is hidden. */
function SidebarEdgeToggle() {
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const label = isCollapsed ? "Expand sidebar" : "Collapse sidebar";
  const Icon = isCollapsed ? ChevronRight : ChevronLeft;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          data-slot="app-sidebar-edge-toggle"
          type="button"
          onClick={toggleSidebar}
          aria-label={label}
          aria-expanded={!isCollapsed}
          className={cn(
            "fixed top-3 z-[calc(var(--z-sticky)+1)] hidden size-6 -translate-x-1/2 items-center justify-center rounded-full border border-border bg-sidebar text-muted-foreground shadow-raised md:flex",
            "transition-[left,color,background-color] duration-[var(--duration-normal)] ease-linear hover:bg-muted hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            isCollapsed ? "left-(--sidebar-width-icon)" : "left-(--sidebar-width)"
          )}
        >
          <Icon className="size-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

/* ─── Main sidebar component ────────────────────────────────────────────── */

export function AppSidebar({
  groups = NAV_GROUPS,
}: {
  /** Nav to render. Defaults to the app's own; a product built on the shell passes its own. */
  groups?: NavGroup[];
} = {}) {
  return (
    <>
    <Sidebar collapsible="icon">
      {/* Same height as the top bar, so the logo, the edge toggle and the
          breadcrumb all sit on one line. */}
      <SidebarHeader className="h-12 justify-center py-0">
        <AccelLogo />
      </SidebarHeader>

      <SidebarContent className="gap-0 overflow-x-hidden">
        {groups.map((group) => (
          <SidebarGroup key={group.label} className="py-2">
            <SidebarGroupLabel className="mb-1 px-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {group.label}
            </SidebarGroupLabel>

            {/* Collapsed, the icons sit centred in the rail rather than flush left. */}
            <SidebarMenu className="group-data-[collapsible=icon]:items-center">
              {group.items.map((item) =>
                item.children ? (
                  <NavParent key={item.href} item={item} />
                ) : (
                  <NavLeaf key={item.href} item={item} />
                )
              )}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-0">
        <SigmawaveFooter />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
    <SidebarEdgeToggle />
    </>
  );
}

/* ─── Re-export trigger so AppLayout can use it ─────────────────────────── */
export { SidebarProvider, SidebarTrigger };
