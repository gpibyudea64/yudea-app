export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { validateBody } from "@/lib/api-validate";
import { requireEditAccess } from "@/lib/server-auth";
import { splitFamilySchema } from "@/schemas/api.schemas";

// POST /api/family/split
// Creates a new family and moves selected members into it, promoting one as FAMILY_HEAD.
export async function POST(req: NextRequest) {
  const authResult = await requireEditAccess("/dashboard/families");
  if (authResult.error) return authResult.error;

  try {
    const body = await req.json();

    const parsed = validateBody(splitFamilySchema, body, "family split POST");
    if (parsed.error) return parsed.error;

    const {
      originalFamilyId,
      newHeadMemberId,
      movedMemberIds,
      familyName,
      address,
      provinsi,
      kotaKabupaten,
      kecamatan,
      kelurahan,
      regionId,
    } = parsed.data;

    // Coordinators may only split families inside their own region, and the
    // new family must also belong to their region.
    if (authResult.user.role === "COORDINATOR" && authResult.user.regionId) {
      if (regionId !== authResult.user.regionId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const originalFamily = await prisma.family.findUnique({
        where: { id: originalFamilyId },
        select: { regionId: true },
      });
      if (!originalFamily) {
        return NextResponse.json({ error: "Original family not found" }, { status: 404 });
      }
      if (originalFamily.regionId !== authResult.user.regionId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const memberIdsToMove = movedMemberIds?.length ? movedMemberIds : [newHeadMemberId];

    const [result] = await prisma.$transaction(async (tx) => {
      // Verify the original family exists and validate member ownership
      const originalFamily = await tx.family.findUnique({
        where: { id: originalFamilyId },
        include: { members: true },
      });

      if (!originalFamily) {
        throw new Error("Original family not found");
      }

      // Validate all members belong to the original family
      const validMemberIds = new Set(originalFamily.members.map((m) => m.id));
      for (const id of memberIdsToMove) {
        if (!validMemberIds.has(id)) {
          throw new Error(`Member ${id} does not belong to the original family`);
        }
      }

      // Create the new family
      const newFamily = await tx.family.create({
        data: {
          familyName,
          address: address || null,
          provinsi: provinsi || null,
          kotaKabupaten: kotaKabupaten || null,
          kecamatan: kecamatan || null,
          kelurahan: kelurahan || null,
          region: { connect: { id: regionId } },
        },
      });

      // Move members to new family and update the head member's role
      for (const memberId of memberIdsToMove) {
        const isHead = memberId === newHeadMemberId;
        await tx.member.update({
          where: { id: memberId },
          data: {
            familyId: newFamily.id,
            ...(isHead ? { role: "FAMILY_HEAD" as const } : {}),
          },
        });
      }

      // Fetch the completed new family
      return [
        await tx.family.findUnique({
          where: { id: newFamily.id },
          include: { region: true, members: true },
        }),
      ];
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to split family";
    if (message === "Original family not found") {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    console.error("Family split error:", error);
    return NextResponse.json({ error: "Failed to split family" }, { status: 500 });
  }
}
