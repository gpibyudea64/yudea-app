import { buildPelkatWhere } from "@/lib/helper";
import { prisma } from "@/lib/prisma";
import { MemberPelkat } from "@prisma/client";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const counts = await Promise.all(
      Object.values(MemberPelkat).map(async (pelkat) => ({
        pelkat,
        total: await prisma.member.count({ where: buildPelkatWhere(pelkat) }),
      })),
    );

    return NextResponse.json(counts);
  } catch {
    return NextResponse.json(
      { error: "Failed to count pelkat members" },
      { status: 500 },
    );
  }
}
