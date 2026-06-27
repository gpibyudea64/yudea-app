export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// POST /api/family/split
// Creates a new family and moves selected members into it, promoting one as FAMILY_HEAD.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
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
    } = body;

    if (!originalFamilyId || !newHeadMemberId || !familyName || !regionId) {
      return NextResponse.json(
        { error: "Missing required fields: originalFamilyId, newHeadMemberId, familyName, regionId" },
        { status: 400 },
      );
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
