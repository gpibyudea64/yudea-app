export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { validateBody, handleApiError } from "@/lib/api-validate";
import { updateAttendanceSchema } from "@/schemas/api.schemas";

// GET /api/attendance/:id
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const attendance = await prisma.attendance.findUnique({
      where: { id },
    });

    if (!attendance) {
      return NextResponse.json(
        { error: "Attendance not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(attendance);
  } catch (error) {
    return handleApiError(error, "attendance GET", "Failed to fetch attendance");
  }
}

// PATCH /api/attendance/:id
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const body = await req.json();

    const parsed = validateBody(updateAttendanceSchema, body, "attendance PATCH");
    if (parsed.error) return parsed.error;

    const existing = await prisma.attendance.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Attendance not found" },
        { status: 404 },
      );
    }

    const updatedMaleCount = parsed.data.maleCount ?? existing.maleCount;
    const updatedFemaleCount = parsed.data.femaleCount ?? existing.femaleCount;

    const attendance = await prisma.attendance.update({
      where: { id },
      data: {
        ...(parsed.data.serviceDate !== undefined && {
          serviceDate: new Date(parsed.data.serviceDate),
        }),
        ...(parsed.data.serviceType !== undefined && { serviceType: parsed.data.serviceType }),
        ...(parsed.data.maleCount !== undefined && { maleCount: parsed.data.maleCount }),
        ...(parsed.data.femaleCount !== undefined && { femaleCount: parsed.data.femaleCount }),
        totalCount: updatedMaleCount + updatedFemaleCount,
      },
    });

    return NextResponse.json(attendance);
  } catch (error) {
    return handleApiError(error, "attendance PATCH", "Failed to update attendance");
  }
}

// DELETE /api/attendance/:id
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    await prisma.attendance.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    return handleApiError(error, "attendance DELETE", "Failed to delete attendance");
  }
}
