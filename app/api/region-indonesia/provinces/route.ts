export const runtime = "nodejs";

import { getProvinces } from "idn-area-data";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const provinces = await getProvinces();
    return NextResponse.json(
      provinces.map((p: { code: string; name: string }) => ({
        code: p.code,
        name: p.name,
      })),
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch provinces" },
      { status: 500 },
    );
  }
}
