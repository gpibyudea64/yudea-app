import { prisma } from "@/lib/prisma";
import { buildPelkatWhere } from "@/lib/helper";
import { BloodType, Gender, MemberPelkat } from "@prisma/client";
import { NextResponse } from "next/server";

export async function GET() {
  try {
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
      prisma.member.count(),
      prisma.family.count(),
      prisma.region.count(),
      prisma.branch.count(),
      prisma.member.count({ where: { gender: Gender.FEMALE } }),
      prisma.member.count({ where: { gender: Gender.MALE } }),
      prisma.member.count({ where: { bloodType: BloodType.A } }),
      prisma.member.count({ where: { bloodType: BloodType.B } }),
      prisma.member.count({ where: { bloodType: BloodType.AB } }),
      prisma.member.count({ where: { bloodType: BloodType.O } }),
      ...Object.values(MemberPelkat).map((pelkat) =>
        prisma.member.count({ where: buildPelkatWhere(pelkat) }),
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
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch dashboard counts" },
      { status: 500 },
    );
  }
}
