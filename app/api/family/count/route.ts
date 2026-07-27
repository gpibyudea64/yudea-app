export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-validate";

// GET /api/family/count
export async function GET() {
  try {
    const all = await prisma.family.count();

    return NextResponse.json({ all });
  } catch (error) {
    return handleApiError(error, "family count GET", "Failed to count families");
  }
}
