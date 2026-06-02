import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

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
    let where: any = search
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
    const regionId = (session?.user as any)?.regionId;
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
    return NextResponse.json(
      { error: "Failed to fetch regions" },
      { status: 500 },
    );
  }
}

// POST /api/region
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, branchId } = body;

    if (!name || !branchId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const region = await prisma.region.create({
      data: {
        name,
        branch: { connect: { id: branchId } },
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
    return NextResponse.json(
      { error: "Failed to create region" },
      { status: 500 },
    );
  }
}
