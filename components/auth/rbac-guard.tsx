"use client";

import { ReactNode, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useStoredRoleAccessMap } from "@/lib/rbac-config";
import { getAllowedRolesForPathFromConfig, hasRequiredRole } from "@/lib/rbac";
import { useStoredUser } from "@/lib/auth-session";

export function RbacGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const currentUser = useStoredUser();
  const roleAccessMap = useStoredRoleAccessMap();

  const allowedRoles = useMemo(
    () => getAllowedRolesForPathFromConfig(pathname, roleAccessMap),
    [pathname, roleAccessMap],
  );

  const isAllowed = hasRequiredRole(currentUser?.role, allowedRoles);

  if (!allowedRoles?.length) {
    return <>{children}</>;
  }

  if (!currentUser) {
    return <>{children}</>;
  }

  if (isAllowed) {
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
          <Button onClick={() => router.push("/dashboard")}>
            Back to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
