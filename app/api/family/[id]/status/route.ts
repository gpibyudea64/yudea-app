export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// PATCH /api/family/:id/status
// Updates isActive and tanggalPindah for ALL members of a family.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { isActive, tanggalPindah } = body;

    if (isActive === undefined) {
      return NextResponse.json(
        { error: "isActive is required" },
        { status: 400 },
      );
    }

    // Update all members of this family
    const result = await prisma.member.updateMany({
      where: { familyId: id },
      data: {
        isActive,
        ...(tanggalPindah !== undefined
          ? { tanggalPindah: tanggalPindah ? new Date(tanggalPindah) : null }
          : {}),
      },
    });

    return NextResponse.json({
      message: "Status updated for all family members",
      count: result.count,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update family status" },
      { status: 500 },
    );
  }
}
