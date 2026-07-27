export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";
import { Gender } from "@prisma/client";
import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-validate";

export async function GET() {
  try {
    const [all, female, male] = await prisma.$transaction([
      prisma.member.count(),
      prisma.member.count({ where: { gender: Gender.FEMALE } }),
      prisma.member.count({ where: { gender: Gender.MALE } }),
    ]);

    return NextResponse.json({ all, female, male });
  } catch (error) {
    return handleApiError(error, "member gender-count GET", "Failed to count members");
  }
}
