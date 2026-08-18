import { auth } from "@/auth";
import { normalizeAppRole, hasRequiredRole, getRouteAccessForPath } from "@/lib/rbac";
import { getRoleAccessConfigFromDb } from "@/lib/rbac-settings";
import { NextResponse } from "next/server";

export async function getSessionUser() {
  const session = await auth();
  if (!session?.user?.id) return null;

  return {
    id: session.user.id,
    email: session.user.email ?? undefined,
    name: session.user.name ?? undefined,
    role: normalizeAppRole(session.user.role),
    regionId: (session.user as { regionId?: string }).regionId ?? undefined,
  };
}

export async function requireAuth() {
  const user = await getSessionUser();
  if (!user) {
    return {
      user: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { user, error: null };
}

export async function requireAdmin() {
  const result = await requireAuth();
  if (result.error) return result;

  if (result.user!.role !== "ADMIN") {
    return {
      user: null,
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return result;
}

/**
 * Enforces edit access for a dashboard route, driven by the persisted RBAC
 * config (defaults merged with any admin overrides stored in AppSetting).
 *
 * This closes the gap where write endpoints relied only on the middleware's
 * authentication check: a view-only MEMBER role user could mutate records by
 * calling the API directly. Returns 403 when the user's role is not in the
 * route's `edit` list.
 */
export async function requireEditAccess(pathname: string) {
  const result = await requireAuth();
  if (result.error) return result;

  const config = await getRoleAccessConfigFromDb();
  const routeAccess = getRouteAccessForPath(pathname, config);
  const editRoles = routeAccess?.edit;

  if (!hasRequiredRole(result.user!.role, editRoles)) {
    return {
      user: null,
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return result;
}

/**
 * Enforces view access for a dashboard route, driven by the persisted RBAC
 * config — the server-side mirror of the client's RbacGuard / usePageAccess.
 *
 * Read endpoints previously checked only that a user was authenticated, so a
 * role with a restricted UI (e.g. MEMBER) could still fetch any resource by
 * calling the API directly. Returns 403 when the user's role is not in the
 * route's `view` list. The returned user carries `regionId`, so callers can
 * reuse it for coordinator region scoping instead of calling `auth()` again.
 */
export async function requireViewAccess(pathname: string) {
  const result = await requireAuth();
  if (result.error) return result;

  const config = await getRoleAccessConfigFromDb();
  const routeAccess = getRouteAccessForPath(pathname, config);
  const viewRoles = routeAccess?.view;

  if (!hasRequiredRole(result.user!.role, viewRoles)) {
    return {
      user: null,
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return result;
}
