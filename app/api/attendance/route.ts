export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { validateBody, handleApiError } from "@/lib/api-validate";
import { createAttendanceSchema } from "@/schemas/api.schemas";

// GET /api/attendance?page=1&limit=10
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.max(1, Number(searchParams.get("limit") ?? 10));
    const search = searchParams.get("search")?.trim() ?? "";
    const skip = (page - 1) * limit;
    const where = search
      ? { serviceType: { contains: search, mode: "insensitive" as const } }
      : {};

    const [items, total] = await prisma.$transaction([
      prisma.attendance.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
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
  try {
    const body = await req.json();

    const parsed = validateBody(createAttendanceSchema, body, "attendance POST");
    if (parsed.error) return parsed.error;

    const { serviceDate, serviceType, maleCount, femaleCount } = parsed.data;
    const totalCount = maleCount + femaleCount;

    const attendance = await prisma.attendance.create({
      data: {
        serviceDate: new Date(serviceDate),
        serviceType,
        maleCount,
        femaleCount,
        totalCount,
      },
    });

    return NextResponse.json(attendance, { status: 201 });
  } catch (error) {
    return handleApiError(error, "attendance POST", "Failed to create attendance");
  }
}
