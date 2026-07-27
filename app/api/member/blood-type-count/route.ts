export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";
import { BloodType } from "@prisma/client";
import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-validate";

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
  } catch (error) {
    return handleApiError(error, "member blood-type-count GET", "Failed to count members");
  }
}
