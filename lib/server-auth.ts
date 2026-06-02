import { auth } from "@/auth";
import { normalizeAppRole } from "@/lib/rbac";
import { NextResponse } from "next/server";

export async function getSessionUser() {
  const session = await auth();
  if (!session?.user?.id) return null;

  return {
    id: session.user.id,
    email: session.user.email ?? undefined,
    name: session.user.name ?? undefined,
    role: normalizeAppRole(session.user.role),
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
