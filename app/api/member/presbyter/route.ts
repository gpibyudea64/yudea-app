export const runtime = "nodejs";

import { parsePagination } from "@/lib/helper";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-validate";
import { requireViewAccess } from "@/lib/server-auth";

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireViewAccess("/dashboard/members");
    if (authResult.error) return authResult.error;
    const session = authResult.user;
    const { searchParams } = req.nextUrl;
    const { page, limit } = parsePagination(searchParams);
    const search = searchParams.get("search")?.trim() ?? "";
    const region = searchParams.get("region")?.trim() ?? "";
    const sortBy = searchParams.get("sortBy")?.trim() || "firstName";
    const sortOrder = searchParams.get("sortOrder")?.trim() === "asc" ? "asc" : "desc";
    const skip = (page - 1) * limit;

    // Presbyters are members whose jabatan is DIAKEN or PENATUA.
    // The jabatan filter must ALWAYS apply — not just when searching.
    let where: Prisma.MemberWhereInput = {
      jabatan: { in: ["DIAKEN", "PENATUA"] },
    };

    if (search) {
      where = {
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
          where,
        ],
      };
    }

    if (region && region !== "all") {
      where = {
        ...where,
        family: {
          regionId: region,
        },
      };
    }

    // Filter by region if user is a coordinator
    const regionId = session.regionId;
    if (session.role === "COORDINATOR" && regionId) {
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
        orderBy:
          sortBy === "familyRegionName"
            ? { family: { region: { name: sortOrder } } }
            : { [sortBy]: sortOrder },
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
  } catch (error) {
    return handleApiError(error, "presbyter GET", "Failed to fetch members");
  }
}
