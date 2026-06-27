export const runtime = "nodejs";

import { getVillages } from "idn-area-data";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const districtCode = req.nextUrl.searchParams.get("districtCode");

    if (!districtCode) {
      return NextResponse.json(
        { error: "districtCode query parameter is required" },
        { status: 400 },
      );
    }

    const villages = await getVillages();
    const filtered = villages.filter(
      (v: { district_code: string }) => v.district_code === districtCode,
    );

    return NextResponse.json(
      filtered.map((v: { code: string; name: string }) => ({
        code: v.code,
        name: v.name,
      })),
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch villages" },
      { status: 500 },
    );
  }
}
