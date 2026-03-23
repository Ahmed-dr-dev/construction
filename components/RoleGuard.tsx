"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { type UserRole, getDefaultRoute } from "@/lib/rbac";
import { ShieldX } from "lucide-react";

interface RoleGuardProps {
  roles: UserRole[];
  children: ReactNode;
}

/**
 * Wraps page content with role-based access control.
 * If the authenticated user's role is not in `roles`, they are redirected
 * to their default route and this component renders nothing.
 */
export default function RoleGuard({ roles, children }: RoleGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/signin"); return; }
    if (!roles.includes(user.role)) {
      router.replace(getDefaultRoute(user.role));
    }
  }, [user, loading, router, roles]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
        Vérification des permissions...
      </div>
    );
  }

  if (!user || !roles.includes(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
        <ShieldX className="w-10 h-10" />
        <p className="text-sm font-medium">Accès non autorisé</p>
        <p className="text-xs">Redirection en cours…</p>
      </div>
    );
  }

  return <>{children}</>;
}
