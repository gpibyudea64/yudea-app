export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/family/count
export async function GET() {
  try {
    const all = await prisma.family.count();

    return NextResponse.json({ all });
  } catch {
    return NextResponse.json(
      { error: "Failed to count families" },
      { status: 500 },
    );
  }
}
