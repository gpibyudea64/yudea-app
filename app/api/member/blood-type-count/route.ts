import { BloodType } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const [all, A, B, AB, O] = await prisma.$transaction([
      prisma.member.count(),
      prisma.member.count({ where: { bloodType: BloodType.A } }),
      prisma.member.count({ where: { bloodType: BloodType.B } }),
      prisma.member.count({ where: { bloodType: BloodType.AB } }),
      prisma.member.count({ where: { bloodType: BloodType.O } }),
    ]);

    return NextResponse.json({ all, A, B, AB, O });
  } catch {
    return NextResponse.json(
      { error: "Failed to count members" },
      { status: 500 },
    );
  }
}
