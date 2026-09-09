import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronDown,
  CircleUser,
  CreditCard,
  Crown,
  Eye,
  Info,
  LogOut,
  Settings,
  ShieldCheck,
  User,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { cn } from "@/lib/utils";
import { useAuthStore, type UserRole } from "@/stores/useAuthStore";

/* ─── Role badge (mirrors User Management's RoleBadge) ───────────────────── */

const PROFILE_ROLE_STYLES: Record<
  UserRole,
  { label: string; icon: React.ElementType; classes: string }
> = {
  owner:    { label: "Owner",    icon: Crown,       classes: "bg-success/15 border-success/30 text-success" },
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
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-2xs font-bold uppercase tracking-wider",
        s.classes
      )}
    >
      <Icon className="size-3" />
      {s.label}
    </span>
  );
}

/* ─── Top-bar account menu ──────────────────────────────────────────────── */

interface UserMenuProps {
  className?: string;
}

export function UserMenu({ className }: UserMenuProps) {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const navigate = useNavigate();
  const [signOutOpen, setSignOutOpen] = React.useState(false);

  if (!user) return null;

  function go(path: string) {
    navigate(path);
  }

  function confirmSignOut() {
    setSignOutOpen(false);
    signOut();
    navigate("/signin", { replace: true });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Open account menu"
            className={cn(
              "flex h-8 items-center gap-2 rounded-full border border-transparent pl-0.5 pr-1.5 transition-colors duration-[var(--duration-fast)] ease-standard hover:border-border hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              className
            )}
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-2xs font-bold text-primary-foreground">
              {user.initials}
            </span>

            <span className="hidden min-w-0 flex-col items-start leading-tight md:flex">
              <span className="truncate text-sm font-medium text-foreground">{user.name}</span>
              <span className="truncate text-2xs text-muted-foreground">
                {PROFILE_ROLE_STYLES[user.role].label}
              </span>
            </span>

            <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-64 p-0">
          <div className="border-b border-border px-3 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {user.initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-bold text-foreground">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                <div className="mt-1">
                  <ProfileRoleBadge role={user.role} />
                </div>
              </div>
            </div>
          </div>

          <div className="p-1">
            <DropdownMenuItem className="gap-2 px-2.5 py-2 text-base" onClick={() => go("/profile")}>
              <User className="size-4 text-muted-foreground" />
              My Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 px-2.5 py-2 text-base" onClick={() => go("/settings")}>
              <Settings className="size-4 text-muted-foreground" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 px-2.5 py-2 text-base" onClick={() => go("/billing")}>
              <CreditCard className="size-4 text-muted-foreground" />
              Billing & License
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 px-2.5 py-2 text-base" onClick={() => go("/system-info")}>
              <Info className="size-4 text-muted-foreground" />
              System Info
            </DropdownMenuItem>
          </div>

          <DropdownMenuSeparator className="my-0" />

          <div className="p-1">
            <DropdownMenuItem
              className="gap-2 px-2.5 py-2 text-base text-sev-critical focus:text-sev-critical"
              onClick={() => setSignOutOpen(true)}
            >
              <LogOut className="size-4" />
              Sign Out
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={signOutOpen}
        onOpenChange={setSignOutOpen}
        destructive
        title="Sign out?"
        description="You'll be signed out on this device and returned to the sign-in screen."
        confirmLabel="Sign Out"
        cancelLabel="Stay signed in"
        onConfirm={confirmSignOut}
      />
    </>
  );
}
