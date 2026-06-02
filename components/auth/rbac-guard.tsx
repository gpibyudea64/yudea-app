"use client";

import { ReactNode, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useStoredRoleAccessConfig } from "@/lib/rbac-config";
import { canViewPath, getDefaultDashboardPath } from "@/lib/rbac";
import { useStoredUser } from "@/lib/auth-session";

export function RbacGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const currentUser = useStoredUser();
  const roleAccessConfig = useStoredRoleAccessConfig();

  const isAllowed = useMemo(
    () => canViewPath(currentUser?.role, pathname, roleAccessConfig),
    [currentUser?.role, pathname, roleAccessConfig],
  );

  const hasRestrictedRoute = useMemo(() => {
    const entry = Object.keys(roleAccessConfig).some(
      (path) =>
        pathname === path || pathname.startsWith(`${path}/`),
    );
    return entry;
  }, [pathname, roleAccessConfig]);

  if (!currentUser) {
    return <>{children}</>;
  }

  if (!hasRestrictedRoute || isAllowed) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Access Restricted</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Your role does not have permission to open this page.
          </p>
          <Button
            onClick={() =>
              router.push(getDefaultDashboardPath(currentUser.role))
            }
          >
            Go to your dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
