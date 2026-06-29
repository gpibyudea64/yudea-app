export const runtime = "nodejs";

import { getRegencies } from "idn-area-data";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const provinceCode = req.nextUrl.searchParams.get("provinceCode");

    if (!provinceCode) {
      return NextResponse.json(
        { error: "provinceCode query parameter is required" },
        { status: 400 },
      );
    }

    const regencies = await getRegencies();
    const filtered = regencies.filter(
      (r: { province_code: string }) => r.province_code === provinceCode,
    );

    return NextResponse.json(
      filtered.map((r: { code: string; name: string }) => ({
        code: r.code,
        name: r.name,
      })),
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch regencies" },
      { status: 500 },
    );
  }
}
