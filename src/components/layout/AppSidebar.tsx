import * as React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Video,
  Cctv,
  Film,
  AlertTriangle,
  MapPin,
  Building2,
  Brain,
  BookOpen,
  FolderOpen,
  PlayCircle,
  Cpu,
  HardDrive,
  Users,
  HeartPulse,
  Settings,
  ScrollText,
  ChevronDown,
} from "lucide-react";
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
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import sigmawaveLogo from "@/assets/sigmawave-logo.svg";

/* ─── Nav data ──────────────────────────────────────────────────────────── */

export interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  children?: NavItem[];
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Monitor",
    items: [
      { label: "Dashboard", href: "/", icon: LayoutDashboard },
      { label: "Live Monitoring", href: "/live", icon: Video },
      { label: "Recordings", href: "/recordings", icon: Film },
      { label: "Detection Feed", href: "/detection-feed", icon: AlertTriangle },
    ],
  },
  {
    label: "Manage",
    items: [
      {
        label: "Site",
        href: "/site",
        icon: MapPin,
        children: [
          { label: "Site Management", href: "/site/overview", icon: Building2 },
          { label: "Cameras", href: "/site/cameras", icon: Cctv },
          { label: "NVR Devices", href: "/site/nvr", icon: HardDrive },
        ],
      },
      { label: "Model Management", href: "/models", icon: Brain },
      { label: "Rules Library", href: "/rules", icon: BookOpen },
      { label: "Incident Cases", href: "/incidents", icon: FolderOpen },
    ],
  },
  {
    label: "Deploy",
    items: [
      { label: "Run Analysis", href: "/analysis", icon: PlayCircle },
      { label: "Model Deployment", href: "/deployment", icon: Cpu },
    ],
  },
  {
    label: "System",
    items: [
      { label: "User Management", href: "/users", icon: Users },
      { label: "Device Health", href: "/device-health", icon: HeartPulse },
      { label: "System Configuration", href: "/config", icon: Settings },
      { label: "Activity Logs", href: "/activity-logs", icon: ScrollText },
    ],
  },
];

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
      className={cn(
        "flex items-center py-1",
        isCollapsed ? "justify-center px-0" : "px-2"
      )}
    >
      {/* Collapsed to the icon rail there is only room for the mark, so the
          viewBox narrows to it and the wordmark is left out. */}
      <svg
        viewBox={isCollapsed ? "12 7 42 41" : "12 7 105 41"}
        role="img"
        aria-label="Accel"
        className={cn("shrink-0", isCollapsed ? "size-8" : "h-8 w-auto")}
      >
        {/* The mark keeps the logo file's exact orange rather than the primary
            token, which is a shade off — a logo is the one place the asset's
            own colour wins over the theme. */}
        <g fill="#FE5C01">
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
          isActive &&
            "border-primary bg-primary-muted text-primary hover:bg-primary-muted hover:text-primary"
        )}
      >
        <NavLink to={item.href} end={item.href === "/"}>
          <item.icon
            className={cn("size-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground")}
          />
          <span>{item.label}</span>
        </NavLink>
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
              isAnyChildActive &&
                "border-primary bg-primary-muted text-primary hover:bg-primary-muted hover:text-primary"
            )}
          >
            <item.icon
              className={cn(
                "size-4 shrink-0",
                isAnyChildActive ? "text-primary" : "text-muted-foreground"
              )}
            />
            <span className="sr-only">{item.label}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>

        {open && (
          <div className="-mx-1 my-0.5 flex flex-col items-center gap-1 rounded-lg border border-primary/40 px-1 py-1">
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
                        "bg-primary-muted text-primary hover:bg-primary-muted hover:text-primary"
                    )}
                  >
                    <NavLink to={child.href}>
                      <child.icon
                        className={cn(
                          "size-4 shrink-0",
                          childActive ? "text-primary" : "text-muted-foreground"
                        )}
                      />
                      <span>{child.label}</span>
                    </NavLink>
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
    <Collapsible open={open} onOpenChange={setOpen} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            className={cn(
              "relative rounded-md border-l-2 border-transparent transition-colors",
              isAnyChildActive &&
                "border-primary bg-primary-muted text-primary hover:bg-primary-muted hover:text-primary"
            )}
          >
            <item.icon
              className={cn(
                "size-4 shrink-0",
                isAnyChildActive ? "text-primary" : "text-muted-foreground"
              )}
            />
            <span>{item.label}</span>
            <ChevronDown
              className={cn(
                "ml-auto size-3.5 shrink-0 text-muted-foreground transition-transform duration-200",
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
                      childActive && "text-primary"
                    )}
                  >
                    <NavLink to={child.href}>
                      <child.icon
                        className={cn(
                          "size-4 shrink-0",
                          childActive ? "text-primary" : "text-muted-foreground"
                        )}
                      />
                      <span>{child.label}</span>
                    </NavLink>
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
    <div className="px-4 pb-3 pt-1 text-center">
      <div className="flex items-center justify-center gap-1.5">
        <p className="text-2xs text-muted-foreground/60">Powered by</p>
        <img src={sigmawaveLogo} alt="Sigmawave" className="h-3 w-auto" />
      </div>
      <p className="mt-1 text-2xs leading-relaxed text-muted-foreground/60">Version 1.01</p>
    </div>
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
    <Sidebar collapsible="icon">
      <SidebarHeader className="pb-1 pt-3">
        <AccelLogo />
      </SidebarHeader>

      <SidebarContent className="gap-0 overflow-x-hidden">
        {groups.map((group) => (
          <SidebarGroup key={group.label} className="py-2">
            <SidebarGroupLabel className="mb-1 px-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
              {group.label}
            </SidebarGroupLabel>

            <SidebarMenu>
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
  );
}

/* ─── Re-export trigger so AppLayout can use it ─────────────────────────── */
export { SidebarProvider, SidebarTrigger };
