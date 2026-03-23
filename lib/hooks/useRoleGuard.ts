"use client";

import { useAuth } from "./useAuth";
import { type UserRole } from "@/lib/rbac";

/**
 * Checks if the current user has one of the allowed roles.
 * The layout is responsible for showing the "Access Denied" UI.
 * This hook simply prevents the page from rendering its own data/content.
 */
export function useRoleGuard(allowedRoles: UserRole[]) {
  const { user, loading } = useAuth();
  const isAuthorized = !loading && !!user && allowedRoles.includes(user.role);
  return { user, loading, isAuthorized };
}
