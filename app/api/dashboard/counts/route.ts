export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";
import { buildPelkatWhere } from "@/lib/helper";
import { BloodType, Gender, MemberPelkat } from "@prisma/client";
import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-validate";
import { requireViewAccess } from "@/lib/server-auth";

export async function GET() {
  try {
    const authResult = await requireViewAccess("/dashboard");
    if (authResult.error) return authResult.error;
    const session = authResult.user;

    // Coordinators see only their own region's numbers on the dashboard.
    const regionScope =
      session.role === "COORDINATOR" && session.regionId
        ? { family: { regionId: session.regionId } }
        : {};
    const memberWhere = regionScope;
    const familyWhere =
      session.role === "COORDINATOR" && session.regionId
        ? { regionId: session.regionId }
        : {};
    const regionWhere =
      session.role === "COORDINATOR" && session.regionId
        ? { id: session.regionId }
        : {};

    const [
      totalMembers,
      totalFamilies,
      totalRegions,
      totalBranches,
      femaleCount,
      maleCount,
      bloodA,
      bloodB,
      bloodAB,
      bloodO,
      ...pelkatCounts
    ] = await Promise.all([
      prisma.member.count({ where: memberWhere }),
      prisma.family.count({ where: familyWhere }),
      prisma.region.count({ where: regionWhere }),
      prisma.branch.count(),
      prisma.member.count({ where: { ...memberWhere, gender: Gender.FEMALE } }),
      prisma.member.count({ where: { ...memberWhere, gender: Gender.MALE } }),
      prisma.member.count({ where: { ...memberWhere, bloodType: BloodType.A } }),
      prisma.member.count({ where: { ...memberWhere, bloodType: BloodType.B } }),
      prisma.member.count({ where: { ...memberWhere, bloodType: BloodType.AB } }),
      prisma.member.count({ where: { ...memberWhere, bloodType: BloodType.O } }),
      ...Object.values(MemberPelkat).map((pelkat) =>
        prisma.member.count({
          where: { ...memberWhere, ...buildPelkatWhere(pelkat) },
        }),
      ),
    ]);

    const pelkatLabels = Object.values(MemberPelkat);

    return NextResponse.json({
      totalMembers,
      totalFamilies,
      totalRegions,
      totalBranches,
      genderCounts: { female: femaleCount, male: maleCount },
      bloodTypeCounts: { A: bloodA, B: bloodB, AB: bloodAB, O: bloodO },
      pelkatCounts: pelkatLabels.map((pelkat, i) => ({
        pelkat,
        total: pelkatCounts[i],
      })),
    });
  } catch (error) {
    return handleApiError(error, "dashboard counts GET", "Failed to fetch dashboard counts");
  }
}
