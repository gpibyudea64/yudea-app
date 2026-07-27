import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { validateBody, handleApiError } from "@/lib/api-validate";
import { createRegionSchema } from "@/schemas/api.schemas";

export const runtime = "nodejs";

// GET /api/region?page=1&limit=10
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = req.nextUrl;
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.max(1, Number(searchParams.get("limit") ?? 10));
    const search = searchParams.get("search")?.trim() ?? "";
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
    const sessionUser = session?.user as { regionId?: string } | undefined;
    const regionId = sessionUser?.regionId;
    if (session?.user?.role === "COORDINATOR" && regionId) {
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
        orderBy: { createdAt: "desc" },
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
