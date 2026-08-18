import { parsePagination } from "@/lib/helper";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { validateBody, handleApiError } from "@/lib/api-validate";
import { requireEditAccess, requireViewAccess } from "@/lib/server-auth";
import { createRegionSchema } from "@/schemas/api.schemas";

export const runtime = "nodejs";

// GET /api/region?page=1&limit=10
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireViewAccess("/dashboard/regions");
    if (authResult.error) return authResult.error;
    const session = authResult.user;
    const { searchParams } = req.nextUrl;
    const { page, limit } = parsePagination(searchParams);
    const search = searchParams.get("search")?.trim() ?? "";
    const sortBy = searchParams.get("sortBy")?.trim() || "name";
    const sortOrder = searchParams.get("sortOrder")?.trim() === "asc" ? "asc" : "desc";
    const skip = (page - 1) * limit;

    // Build where clause for search
    let where: Prisma.RegionWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            {
              branch: {
                name: { contains: search, mode: "insensitive" as const },
              },
            },
          ],
        }
      : {};

    // Filter by coordinator's region if user is a coordinator
    const regionId = session.regionId;
    if (session.role === "COORDINATOR" && regionId) {
      where = {
        ...where,
        id: regionId,
      };
    }

    const [items, total] = await prisma.$transaction([
      prisma.region.findMany({
        where,
        skip,
        take: limit,
        orderBy:
          sortBy === "branchName"
            ? { branch: { name: sortOrder } }
            : { [sortBy]: sortOrder },
        include: {
          branch: true,
          families: true,
          coordinator: {
            include: { family: true },
          },
        },
      }),
      prisma.region.count({ where }),
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
    return handleApiError(error, "region GET", "Failed to fetch regions");
  }
}

// POST /api/region
export async function POST(req: NextRequest) {
  const authResult = await requireEditAccess("/dashboard/regions");
  if (authResult.error) return authResult.error;

  try {
    const body = await req.json();

    const parsed = validateBody(createRegionSchema, body, "region POST");
    if (parsed.error) return parsed.error;

    const region = await prisma.region.create({
      data: {
        name: parsed.data.name,
        branch: { connect: { id: parsed.data.branchId } },
      },
    });

    const full = await prisma.region.findUnique({
      where: { id: region.id },
      include: {
        branch: true,
        families: true,
        coordinator: { include: { family: true } },
      },
    });

    return NextResponse.json(full, { status: 201 });
  } catch (error) {
    return handleApiError(error, "region POST", "Failed to create region");
  }
}
