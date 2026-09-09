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

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  children?: NavItem[];
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
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

/* Accel brand mark — triangle "A" with swoosh + tail, in brand orange. */
function AccelMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={cn("text-primary", className)} aria-hidden>
      <path d="M20.5 11 L28.5 31.5 L12.5 31.5 Z" fill="currentColor" />
      <path
        d="M16 33 C 24.5 28.4 30.5 23.8 40 14.6 C 35.6 24 29 29.2 21 34.8 Z"
        fill="currentColor"
      />
      <path d="M30.6 31.2 L37.6 27 L36 34 L29 35.6 Z" fill="currentColor" />
    </svg>
  );
}

function AccelLogo() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <div
      className={cn(
        "flex items-center gap-2.5 py-1",
        isCollapsed ? "justify-center px-0" : "px-2"
      )}
    >
      <AccelMark className="size-8 shrink-0" />
      {!isCollapsed && (
        <span className="text-lg font-bold tracking-tight text-foreground">Accel</span>
      )}
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

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="pb-1 pt-3">
        <AccelLogo />
      </SidebarHeader>

      <SidebarContent className="gap-0 overflow-x-hidden">
        {NAV_GROUPS.map((group) => (
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
