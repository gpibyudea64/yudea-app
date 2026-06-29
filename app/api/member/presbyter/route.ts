export const runtime = "nodejs";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma, User } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = req.nextUrl;
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.max(1, Number(searchParams.get("limit") ?? 10));
    const search = searchParams.get("search")?.trim() ?? "";
    const region = searchParams.get("region")?.trim() ?? "";
    const skip = (page - 1) * limit;

    // Build where clause for search
    let where: Prisma.MemberWhereInput = search
      ? {
          AND: [
            {
              OR: [
                { firstName: { contains: search, mode: "insensitive" as const } },
                { lastName: { contains: search, mode: "insensitive" as const } },
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
            },
            {
              isPresbyter: true,
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

    return NextResponse.json({
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 },
    );
  }
}
