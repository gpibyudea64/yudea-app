"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { useStoredUser } from "@/lib/auth-session";
import { useStoredRoleAccessConfig } from "@/lib/rbac-config";
import { canEditPath, canViewPath } from "@/lib/rbac";

export function usePageAccess(pathname?: string) {
  const currentPath = usePathname();
  const path = pathname ?? currentPath;
  const user = useStoredUser();
  const config = useStoredRoleAccessConfig();

  return useMemo(
    () => ({
      canView: canViewPath(user?.role, path, config),
      canEdit: canEditPath(user?.role, path, config),
      role: user?.role,
    }),
    [user?.role, path, config],
  );
}
