import { prisma } from "@/lib/prisma";
import { APP_ROLES, normalizeAppRole } from "@/lib/rbac";
import { requireAdmin } from "@/lib/server-auth";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const authResult = await requireAdmin();
  if (authResult.error) return authResult.error;

  try {
    const { searchParams } = req.nextUrl;
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.max(1, Number(searchParams.get("limit") ?? 10));
    const search = searchParams.get("search")?.trim() ?? "";
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [items, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { email: "asc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      data: items.map((user) => ({
        ...user,
        role: normalizeAppRole(user.role),
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const authResult = await requireAdmin();
  if (authResult.error) return authResult.error;

  try {
    const body = await req.json();
    const { name, email, password, role, regionId } = body;

    if (!email || !password || !role) {
      return NextResponse.json(
        { error: "Email, password, and role are required" },
        { status: 400 },
      );
    }

    const normalizedRole = normalizeAppRole(role);
    if (!(APP_ROLES as readonly string[]).includes(normalizedRole)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    if (normalizedRole === "COORDINATOR" && !regionId) {
      return NextResponse.json(
        { error: "Coordinator must be assigned to a region" },
        { status: 400 },
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Email is already registered" },
        { status: 409 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name ?? null,
        email,
        password: hashedPassword,
        role: normalizedRole,
        ...(regionId ? { region: { connect: { id: regionId } } } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        regionId: true,
      },
    });

    return NextResponse.json(
      { ...user, role: normalizeAppRole(user.role) },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 },
    );
  }
}
