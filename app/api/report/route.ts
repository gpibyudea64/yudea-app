export const runtime = "nodejs";

import { attachPelkat } from "@/lib/helper";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { handleApiError } from "@/lib/api-validate";

// GET /api/report?pelkat=...&region=...
// Returns flat member list with family info for report export
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = req.nextUrl;
    const pelkat = searchParams.get("pelkat")?.trim() ?? "";
    const region = searchParams.get("region")?.trim() ?? "";

    // Build where clause
    const where: Prisma.MemberWhereInput = {};

    if (region && region !== "all") {
      where.family = { regionId: region };
    }

    // Filter by region if user is a coordinator
    const sessionUser = session?.user as { regionId?: string } | undefined;
    const regionId = sessionUser?.regionId;
    if (session?.user?.role === "COORDINATOR" && regionId) {
      where.family = { ...(where.family as Prisma.FamilyWhereInput), regionId };
    }

    const members = await prisma.member.findMany({
      where,
      orderBy: [{ family: { familyName: "asc" } }, { firstName: "asc" }],
      include: {
        family: {
          include: {
            region: true,
          },
        },
      },
    });

    const membersWithPelkat = members.map(attachPelkat);

    const filteredMembers =
      pelkat && pelkat !== "all"
        ? membersWithPelkat.filter((m) => m.pelkat === pelkat)
        : membersWithPelkat;

    // Map to report format
    const reportData = filteredMembers.map((member) => ({
      familyName: member.family?.familyName ?? "",
      firstName: member.firstName,
      lastName: member.lastName ?? "",
      fullName: [member.firstName, member.lastName ?? ""].filter(Boolean).join(" "),
      address: member.sameAddressAsFamily
        ? [
            member.family?.address,
            member.family?.kotaKabupaten,
            member.family?.kecamatan,
          ]
            .filter(Boolean)
            .join(", ")
        : [
            member.memberAddress,
            member.memberKotaKabupaten,
            member.memberKecamatan,
          ]
            .filter(Boolean)
            .join(", "),
      birthDate: member.birthDate,
      regionName: member.family?.region?.name ?? "",
      pelkat: member.pelkat ?? "",
    }));

    return NextResponse.json({ data: reportData });
  } catch (error) {
    return handleApiError(error, "report GET", "Failed to fetch report data");
  }
}
