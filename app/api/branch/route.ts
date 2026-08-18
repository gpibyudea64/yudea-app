export const runtime = "nodejs";

import { parsePagination } from "@/lib/helper";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { validateBody, handleApiError } from "@/lib/api-validate";
import { requireEditAccess, requireViewAccess } from "@/lib/server-auth";
import { createBranchSchema } from "@/schemas/api.schemas";

export async function GET(req: NextRequest) {
  const authResult = await requireViewAccess("/dashboard/branches");
  if (authResult.error) return authResult.error;

  try {
    const { searchParams } = req.nextUrl;
    const { page, limit } = parsePagination(searchParams);
    const search = searchParams.get("search")?.trim() ?? "";
    const sortBy = searchParams.get("sortBy")?.trim() || "name";
    const sortOrder = searchParams.get("sortOrder")?.trim() === "asc" ? "asc" : "desc";
    const skip = (page - 1) * limit;
    const where = search
      ? { name: { contains: search, mode: "insensitive" as const } }
      : {};

    const [items, total] = await prisma.$transaction([
      prisma.branch.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          regions: true,
        },
      }),
      prisma.branch.count({ where }),
    ]);

    return NextResponse.json({
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleApiError(error, "branch GET", "Failed to fetch branch");
  }
}

export async function POST(req: NextRequest) {
  const authResult = await requireEditAccess("/dashboard/branches");
  if (authResult.error) return authResult.error;

  try {
    const body = await req.json();

    const parsed = validateBody(createBranchSchema, body, "branch POST");
    if (parsed.error) return parsed.error;

    const branch = await prisma.branch.create({
      data: { name: parsed.data.name },
    });

    return NextResponse.json(branch, { status: 201 });
  } catch (error) {
    return handleApiError(error, "branch POST", "Failed to create branch");
  }
}
