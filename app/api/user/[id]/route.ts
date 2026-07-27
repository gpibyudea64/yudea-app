import { prisma } from "@/lib/prisma";
import { APP_ROLES, normalizeAppRole } from "@/lib/rbac";
import { requireAdmin } from "@/lib/server-auth";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { validateBody, handleApiError } from "@/lib/api-validate";
import { updateUserSchema } from "@/schemas/api.schemas";

export const runtime = "nodejs";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireAdmin();
  if (authResult.error) return authResult.error;

  const { id } = await params;

  try {
    const body = await req.json();

    const parsed = validateBody(updateUserSchema, body, "user PATCH");
    if (parsed.error) return parsed.error;

    const { name, email, password, role, regionId } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (email && email !== existing.email) {
      const duplicate = await prisma.user.findUnique({ where: { email } });
      if (duplicate) {
        return NextResponse.json(
          { error: "Email is already registered" },
          { status: 409 },
        );
      }
    }

    let normalizedRole: string | undefined;
    if (role !== undefined) {
      normalizedRole = normalizeAppRole(role);
      if (!(APP_ROLES as readonly string[]).includes(normalizedRole)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }
    }

    if (
      normalizedRole === "COORDINATOR" &&
      regionId === undefined &&
      !existing.regionId
    ) {
      return NextResponse.json(
        { error: "Coordinator must be assigned to a region" },
        { status: 400 },
      );
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name || null }),
        ...(email !== undefined && { email }),
        ...(normalizedRole !== undefined && { role: normalizedRole }),
        ...(password && { password: await bcrypt.hash(password, 10) }),
        ...(regionId !== undefined
          ? {
              region: regionId
                ? { connect: { id: regionId } }
                : { disconnect: true },
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        regionId: true,
      },
    });

    return NextResponse.json({
      ...user,
      role: normalizeAppRole(user.role),
    });
  } catch (error) {
    return handleApiError(error, "user PATCH", "Failed to update user");
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireAdmin();
  if (authResult.error) return authResult.error;

  const { id } = await params;

  if (authResult.user?.id === id) {
    return NextResponse.json(
      { error: "You cannot delete your own account" },
      { status: 400 },
    );
  }

  try {
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    return handleApiError(error, "user DELETE", "Failed to delete user");
  }
}
