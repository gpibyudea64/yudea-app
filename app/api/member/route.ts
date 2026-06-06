export const runtime = "nodejs";

import { attachPelkat } from "@/lib/helper";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { Prisma, User } from "@prisma/client";

// GET /api/member?page=1&limit=10
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = req.nextUrl;
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.max(1, Number(searchParams.get("limit") ?? 10));
    const search = searchParams.get("search")?.trim() ?? "";
    const region = searchParams.get("region")?.trim() ?? "";
    const pelkat = searchParams.get("pelkat")?.trim() ?? "";
    const skip = (page - 1) * limit;

    // Build where clause for search
    let where: Prisma.MemberWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
            { phone: { contains: search, mode: "insensitive" as const } },
            {
              family: {
                familyName: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            },
          ],
        }
      : {};

    if (region && region !== "all") {
      where = {
        ...where,
        family: {
          regionId: region,
        },
      };
    }

    // Filter by region if user is a coordinator
    const regionId = (session?.user as User)?.regionId;
    if (session?.user?.role === "COORDINATOR" && regionId) {
      where = {
        ...where,
        family: {
          regionId,
        },
      };
    }

    const [items, total] = await prisma.$transaction([
      prisma.member.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          family: {
            include: {
              region: true,
            },
          },
        },
      }),
      prisma.member.count({ where }),
    ]);

    const membersWithPelkat = items.map(attachPelkat);

    const filteredMembers =
      pelkat && pelkat !== "all"
        ? membersWithPelkat.filter((m) => m.pelkat === pelkat)
        : membersWithPelkat;

    const filteredTotal =
      pelkat && pelkat !== "all"
        ? membersWithPelkat.filter((m) => m.pelkat === pelkat).length
        : total;

    return NextResponse.json({
      data: filteredMembers,
      meta: {
        total: filteredTotal,
        page,
        limit,
        totalPages: Math.ceil(filteredTotal / limit),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 },
    );
  }
}

// POST /api/member
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (
      !body.name ||
      !body.gender ||
      !body.birthDate ||
      !body.role ||
      !body.familyId
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const member = await prisma.member.create({
      data: {
        name: body.name,
        gender: body.gender,
        birthDate: new Date(body.birthDate),
        phone: body.phone || null,
        email: body.email || null,
        role: body.role,
        isActive: body.isActive ?? true,
        isDeceased: body.isDeceased ?? false,
        isPresbyter: body.isPresbyter ?? false,
        deathDate: body.deathDate ? new Date(body.deathDate) : null,
        family: { connect: { id: body.familyId } },
      },
      include: { family: true },
    });

    return NextResponse.json(attachPelkat(member), { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create member" },
      { status: 500 },
    );
  }
}
