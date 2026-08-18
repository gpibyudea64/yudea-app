export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { validateBody, handleApiError } from "@/lib/api-validate";
import { requireEditAccess } from "@/lib/server-auth";
import { familyStatusSchema } from "@/schemas/api.schemas";

// PATCH /api/family/:id/status
// Updates isActive and tanggalPindah for ALL members of a family.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireEditAccess("/dashboard/families");
  if (authResult.error) return authResult.error;

  const { id } = await params;

  try {
    const body = await req.json();

    const parsed = validateBody(familyStatusSchema, body, "family status PATCH");
    if (parsed.error) return parsed.error;

    const { isActive, tanggalPindah } = parsed.data;

    // Coordinators may only change status of families in their own region.
    if (authResult.user.role === "COORDINATOR" && authResult.user.regionId) {
      const family = await prisma.family.findUnique({
        where: { id },
        select: { regionId: true },
      });
      if (!family) {
        return NextResponse.json({ error: "Family not found" }, { status: 404 });
      }
      if (family.regionId !== authResult.user.regionId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
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
    return handleApiError(error, "family status PATCH", "Failed to update family status");
  }
}
