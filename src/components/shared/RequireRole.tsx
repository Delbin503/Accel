import * as React from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore, type UserRole } from "@/stores/useAuthStore";
import { ShieldAlert } from "lucide-react";

interface RequireRoleProps {
  children: React.ReactNode;
  /** Minimum role required. Hierarchy: admin > operator > viewer */
  roles: UserRole[];
  /** Where to redirect if unauthorized. Defaults to "/" */
  redirectTo?: string;
  /** Render an inline message instead of redirecting */
  inline?: boolean;
}

export function RequireRole({
  children,
  roles,
  redirectTo = "/",
  inline = false,
}: RequireRoleProps) {
  const user = useAuthStore((s) => s.user);

  if (!user || !roles.includes(user.role)) {
    if (inline) {
      return (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
          <ShieldAlert className="size-8" />
          <p className="text-sm font-medium">You don't have access to this area.</p>
        </div>
      );
    }
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
