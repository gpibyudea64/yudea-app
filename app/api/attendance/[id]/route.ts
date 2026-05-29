import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET /api/attendance/:id
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const attendance = await prisma.attendance.findUnique({
      where: { id: params.id },
    });

    if (!attendance) {
      return NextResponse.json(
        { error: "Attendance not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(attendance);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch attendance" },
      { status: 500 },
    );
  }
}

// PATCH /api/attendance/:id
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await req.json();
    const { serviceDate, serviceType, maleCount, femaleCount } = body;

    const existing = await prisma.attendance.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Attendance not found" },
        { status: 404 },
      );
    }

    const updatedMaleCount = maleCount ?? existing.maleCount;
    const updatedFemaleCount = femaleCount ?? existing.femaleCount;

    const attendance = await prisma.attendance.update({
      where: { id: params.id },
      data: {
        ...(serviceDate !== undefined && {
          serviceDate: new Date(serviceDate),
        }),
        ...(serviceType !== undefined && { serviceType }),
        ...(maleCount !== undefined && { maleCount }),
        ...(femaleCount !== undefined && { femaleCount }),
        totalCount: updatedMaleCount + updatedFemaleCount,
      },
    });

    return NextResponse.json(attendance);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update attendance" },
      { status: 500 },
    );
  }
}

// DELETE /api/attendance/:id
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await prisma.attendance.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete attendance" },
      { status: 500 },
    );
  }
}
