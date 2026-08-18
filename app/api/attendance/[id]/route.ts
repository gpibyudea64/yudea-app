export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { validateBody, handleApiError, isPrismaUniqueViolation } from "@/lib/api-validate";
import { requireEditAccess, requireViewAccess } from "@/lib/server-auth";
import { updateAttendanceSchema } from "@/schemas/api.schemas";

// GET /api/attendance/:id
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireViewAccess("/dashboard/attendance");
  if (authResult.error) return authResult.error;

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
  const authResult = await requireEditAccess("/dashboard/attendance");
  if (authResult.error) return authResult.error;

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

    const updatedServiceDate =
      parsed.data.serviceDate !== undefined
        ? new Date(parsed.data.serviceDate)
        : existing.serviceDate;
    const updatedServiceType = parsed.data.serviceType ?? existing.serviceType;

    // If the date or type is changing, the new (serviceDate, serviceType) pair
    // must not collide with a *different* record — the record itself is exempt.
    if (
      updatedServiceDate.getTime() !== existing.serviceDate.getTime() ||
      updatedServiceType !== existing.serviceType
    ) {
      const duplicate = await prisma.attendance.findUnique({
        where: {
          serviceDate_serviceType: {
            serviceDate: updatedServiceDate,
            serviceType: updatedServiceType,
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
    }

    const attendance = await prisma.attendance.update({
      where: { id },
      data: {
        ...(parsed.data.serviceDate !== undefined && {
          serviceDate: updatedServiceDate,
        }),
        ...(parsed.data.serviceType !== undefined && { serviceType: updatedServiceType }),
        ...(parsed.data.maleCount !== undefined && { maleCount: parsed.data.maleCount }),
        ...(parsed.data.femaleCount !== undefined && { femaleCount: parsed.data.femaleCount }),
        totalCount: updatedMaleCount + updatedFemaleCount,
      },
    });

    return NextResponse.json(attendance);
  } catch (error) {
    // Race-condition backstop: another request claimed the new date/type in
    // between the pre-check and the update.
    if (isPrismaUniqueViolation(error)) {
      return NextResponse.json(
        { error: "Attendance already exists for this date and service type" },
        { status: 409 },
      );
    }
    return handleApiError(error, "attendance PATCH", "Failed to update attendance");
  }
}

// DELETE /api/attendance/:id
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireEditAccess("/dashboard/attendance");
  if (authResult.error) return authResult.error;

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
