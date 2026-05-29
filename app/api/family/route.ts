import type { Member } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET /api/family?page=1&limit=10
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.max(1, Number(searchParams.get("limit") ?? 10));
    const search = searchParams.get("search")?.trim() ?? "";
    const skip = (page - 1) * limit;
    const where = search
      ? {
          OR: [
            { familyName: { contains: search, mode: "insensitive" as const } },
            { address: { contains: search, mode: "insensitive" as const } },
            {
              region: {
                name: { contains: search, mode: "insensitive" as const },
              },
            },
          ],
        }
      : {};

    const [items, total] = await prisma.$transaction([
      prisma.family.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          region: true,
          members: true,
        },
      }),
      prisma.family.count({ where }),
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
      { error: "Failed to fetch families" },
      { status: 500 },
    );
  }
}

// POST /api/family
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { familyName, address, regionId, members } = body;

    if (!familyName || !regionId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const family = await prisma.family.create({
      data: {
        familyName,
        address,
        region: { connect: { id: regionId } },
        ...(members?.length
          ? {
              members: {
                create: members.map((member: Member) => ({
                  name: member.name,
                  gender: member.gender,
                  birthDate: new Date(member.birthDate),
                  phone: member.phone || null,
                  email: member.email || null,
                  role: member.role,
                  isActive: member.isActive ?? true,
                  isDeceased: member.isDeceased ?? false,
                  deathDate: member.deathDate
                    ? new Date(member.deathDate)
                    : null,
                })),
              },
            }
          : {}),
      },
      include: {
        region: true,
        members: true,
      },
    });

    return NextResponse.json(family, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create family" },
      { status: 500 },
    );
  }
}
