import { Gender } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const [all, female, male] = await prisma.$transaction([
      prisma.member.count(),
      prisma.member.count({ where: { gender: Gender.FEMALE } }),
      prisma.member.count({ where: { gender: Gender.MALE } }),
    ]);

    return NextResponse.json({ all, female, male });
  } catch {
    return NextResponse.json(
      { error: "Failed to count members" },
      { status: 500 },
    );
  }
}
