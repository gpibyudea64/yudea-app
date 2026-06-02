"use client";

import { clearAuthSession, persistAuthSession } from "@/lib/auth-session";
import { fetchRoleAccessConfig } from "@/lib/api/rbac-settings";
import { persistRoleAccessConfig } from "@/lib/rbac-config";
import { normalizeAppRole } from "@/lib/rbac";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

export function SessionSync() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return;

    persistAuthSession({
      user: {
        id: session.user.id,
        email: session.user.email ?? undefined,
        name: session.user.name ?? undefined,
        role: normalizeAppRole(session.user.role),
      },
    });
  }, [session, status]);

  useEffect(() => {
    if (status !== "authenticated") return;

    fetchRoleAccessConfig()
      .then((config) => persistRoleAccessConfig(config))
      .catch(() => undefined);
  }, [status]);

  useEffect(() => {
    if (status === "unauthenticated") {
      clearAuthSession();
    }
  }, [status]);

  return null;
}
