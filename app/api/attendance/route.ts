export const runtime = "nodejs";

import { parsePagination } from "@/lib/helper";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { validateBody, handleApiError, isPrismaUniqueViolation } from "@/lib/api-validate";
import { requireEditAccess, requireViewAccess } from "@/lib/server-auth";
import { createAttendanceSchema } from "@/schemas/api.schemas";

// GET /api/attendance?page=1&limit=10
export async function GET(req: NextRequest) {
  const authResult = await requireViewAccess("/dashboard/attendance");
  if (authResult.error) return authResult.error;

  try {
    const { searchParams } = req.nextUrl;
    const { page, limit } = parsePagination(searchParams);
    const search = searchParams.get("search")?.trim() ?? "";
    const sortBy = searchParams.get("sortBy")?.trim() || "serviceDate";
    const sortOrder = searchParams.get("sortOrder")?.trim() === "asc" ? "asc" : "desc";
    const skip = (page - 1) * limit;
    const where = search
      ? { serviceType: { contains: search, mode: "insensitive" as const } }
      : {};

    const [items, total] = await prisma.$transaction([
      prisma.attendance.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.attendance.count({ where }),
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
    return handleApiError(error, "attendance GET", "Failed to fetch attendance");
  }
}

// POST /api/attendance
export async function POST(req: NextRequest) {
  const authResult = await requireEditAccess("/dashboard/attendance");
  if (authResult.error) return authResult.error;

  try {
    const body = await req.json();

    const parsed = validateBody(createAttendanceSchema, body, "attendance POST");
    if (parsed.error) return parsed.error;

    const { serviceDate, serviceType, maleCount, femaleCount } = parsed.data;
    const totalCount = maleCount + femaleCount;

    // The (serviceDate, serviceType) pair is unique — reject duplicates with a
    // 409 instead of letting Prisma throw P2002 (which would surface as a 500).
    const parsedDate = new Date(serviceDate);
    const duplicate = await prisma.attendance.findUnique({
      where: {
        serviceDate_serviceType: {
          serviceDate: parsedDate,
          serviceType,
        },
      },
      select: { id: true },
    });
    if (duplicate) {
      return NextResponse.json(
        { error: "Attendance already exists for this date and service type" },
        { status: 409 },
      );
    }

    const attendance = await prisma.attendance.create({
      data: {
        serviceDate: parsedDate,
        serviceType,
        maleCount,
        femaleCount,
        totalCount,
      },
    });

    return NextResponse.json(attendance, { status: 201 });
  } catch (error) {
    // Race-condition backstop: another request created the same record in
    // between the pre-check and the create.
    if (isPrismaUniqueViolation(error)) {
      return NextResponse.json(
        { error: "Attendance already exists for this date and service type" },
        { status: 409 },
      );
    }
    return handleApiError(error, "attendance POST", "Failed to create attendance");
  }
}
