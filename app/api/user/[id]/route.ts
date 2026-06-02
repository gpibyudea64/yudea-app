import { prisma } from "@/lib/prisma";
import { APP_ROLES, normalizeAppRole } from "@/lib/rbac";
import { requireAdmin } from "@/lib/server-auth";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireAdmin();
  if (authResult.error) return authResult.error;

  const { id } = await params;

  try {
    const body = await req.json();
    const { name, email, password, role } = body;

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

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name || null }),
        ...(email !== undefined && { email }),
        ...(normalizedRole !== undefined && { role: normalizedRole }),
        ...(password && { password: await bcrypt.hash(password, 10) }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return NextResponse.json({
      ...user,
      role: normalizeAppRole(user.role),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 },
    );
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
  } catch {
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 },
    );
  }
}
