import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET /api/region?page=1&limit=10
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.max(1, Number(searchParams.get("limit") ?? 10));
    const skip = (page - 1) * limit;

    const [items, total] = await prisma.$transaction([
      prisma.region.findMany({
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
      prisma.region.count(),
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
