import * as React from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";
import { useNotificationsStore } from "@/stores/useNotificationsStore";
import {
  LayoutDashboard,
  Video,
  Film,
  AlertTriangle,
  MapPin,
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
  ChevronRight,
  Bell,
  LogOut,
  User,
  CreditCard,
  Info,
  ShieldCheck,
  CircleUser,
  Eye,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { NotificationsDrawer } from "@/components/shared/NotificationsDrawer";
import type { UserRole } from "@/stores/useAuthStore";

/* ─── Role badge (mirrors User Management's RoleBadge) ────────────────── */

const PROFILE_ROLE_STYLES: Record<
  UserRole,
  {
    label: string;
    icon: React.ElementType;
    classes: string;
  }
> = {
  admin:    { label: "Admin",    icon: ShieldCheck, classes: "bg-info/15 border-info/30 text-info" },
  operator: { label: "Operator", icon: CircleUser,  classes: "bg-warning/15 border-warning/30 text-warning" },
  viewer:   { label: "Viewer",   icon: Eye,         classes: "bg-success/15 border-success/30 text-success" },
};

function ProfileRoleBadge({ role }: { role: UserRole }) {
  const s = PROFILE_ROLE_STYLES[role];
  const Icon = s.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        s.classes
      )}
    >
      <Icon className="size-3" />
      {s.label}
    </span>
  );
}

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
          { label: "Overview", href: "/site/overview", icon: MapPin },
          { label: "Cameras", href: "/site/cameras", icon: Video },
          { label: "NVR Devices", href: "/site/nvr", icon: HardDrive },
          { label: "Zones", href: "/site/zones", icon: MapPin },
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
      { label: "System Config", href: "/config", icon: Settings },
      { label: "Activity Logs", href: "/activity-logs", icon: ScrollText },
    ],
  },
];

/* ─── Logo ──────────────────────────────────────────────────────────────── */

function AccelLogo() {
  return (
    <div className="flex items-center gap-2.5 px-2 py-1">
      {/* Orange triangle / play mark */}
      <div className="flex size-7 items-center justify-center rounded-md bg-primary">
        <svg viewBox="0 0 14 14" className="size-4 fill-primary-foreground" aria-hidden>
          <polygon points="2,1 13,7 2,13" />
        </svg>
      </div>
      <span className="text-base font-bold tracking-tight text-foreground">Accel</span>
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
          "relative rounded-md transition-colors",
          isActive &&
            "border-l-2 border-primary bg-primary-muted text-primary hover:bg-primary-muted hover:text-primary"
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
  const isAnyChildActive =
    item.children?.some(
      (c) => location.pathname === c.href || location.pathname.startsWith(c.href + "/")
    ) ?? false;

  const [open, setOpen] = React.useState(isAnyChildActive);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            className={cn(
              "relative rounded-md transition-colors",
              isAnyChildActive &&
                "border-l-2 border-primary bg-primary-muted text-primary hover:bg-primary-muted hover:text-primary"
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
          <SidebarMenuSub>
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
                    <NavLink to={child.href}>{child.label}</NavLink>
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

/* ─── User profile section ──────────────────────────────────────────────── */

function UserProfile({ onBell }: { onBell: () => void }) {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const unreadCount = useNotificationsStore((s) => s.items.filter((n) => !n.read).length);
  const navigate = useNavigate();

  if (!user) return null;

  function go(path: string) {
    navigate(path);
  }

  function handleSignOut() {
    signOut();
    navigate("/signin", { replace: true });
  }

  return (
    <div className="border-t border-border px-2 py-3">
      <div className="flex items-stretch gap-2">
        {/* Profile card — opens dropdown menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex min-w-0 flex-1 items-center gap-3 rounded-md border border-transparent bg-card/40 px-2.5 py-2 text-left transition-colors hover:border-border hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {user.initials}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
                <p className="truncate text-xs capitalize text-primary">{user.role}</p>
              </div>

              <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent side="top" align="start" className="w-64 p-0">
          <div className="border-b border-border px-3 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-[12px] font-bold text-primary-foreground">
                {user.initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-bold text-foreground">{user.name}</p>
                <p className="truncate text-[11px] text-muted-foreground">{user.email}</p>
                <div className="mt-1">
                  <ProfileRoleBadge role={user.role} />
                </div>
              </div>
            </div>
          </div>
          <div className="p-1">
            <DropdownMenuItem className="gap-2 px-2.5 py-2 text-[13px]" onClick={() => go("/profile")}>
              <User className="size-4 text-muted-foreground" />
              My Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 px-2.5 py-2 text-[13px]" onClick={() => go("/settings")}>
              <Settings className="size-4 text-muted-foreground" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 px-2.5 py-2 text-[13px]" onClick={() => go("/billing")}>
              <CreditCard className="size-4 text-muted-foreground" />
              Billing & License
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 px-2.5 py-2 text-[13px]" onClick={() => go("/system-info")}>
              <Info className="size-4 text-muted-foreground" />
              System Info
            </DropdownMenuItem>
          </div>
          <DropdownMenuSeparator className="my-0" />
          <div className="p-1">
            <DropdownMenuItem className="gap-2 px-2.5 py-2 text-[13px] text-sev-critical focus:text-sev-critical"
              onClick={handleSignOut}>
              <LogOut className="size-4" />
              Sign Out
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
        </DropdownMenu>

        {/* Bell card — its own button, opens the notifications drawer */}
        <button
          type="button"
          onClick={onBell}
          aria-label={
            unreadCount > 0
              ? `${unreadCount} unread notifications`
              : "Open notifications"
          }
          className="relative flex size-12 shrink-0 items-center justify-center rounded-md border border-transparent bg-card/40 text-muted-foreground transition-colors hover:border-border hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

/* ─── Sigmawave footer ──────────────────────────────────────────────────── */

function SigmawaveFooter() {
  const { state } = useSidebar();
  if (state === "collapsed") return null;

  return (
    <div className="px-4 pb-3 pt-1 text-center">
      <p className="text-[10px] leading-relaxed text-muted-foreground/60">
        Powered By © Sigmawave
        <br />
        Version 1.01
      </p>
    </div>
  );
}

/* ─── Main sidebar component ────────────────────────────────────────────── */

export function AppSidebar() {
  const [notifOpen, setNotifOpen] = React.useState(false);

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarHeader className="pb-1 pt-3">
          <AccelLogo />
        </SidebarHeader>

        <SidebarContent className="gap-0 overflow-x-hidden">
          {NAV_GROUPS.map((group) => (
            <SidebarGroup key={group.label} className="py-2">
              <SidebarGroupLabel className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
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
          <UserProfile onBell={() => setNotifOpen(true)} />
          <SigmawaveFooter />
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      <NotificationsDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />
    </>
  );
}

/* ─── Re-export trigger so AppLayout can use it ─────────────────────────── */
export { SidebarProvider, SidebarTrigger };
