export const runtime = "nodejs";

import { getDistricts } from "idn-area-data";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const regencyCode = req.nextUrl.searchParams.get("regencyCode");

    if (!regencyCode) {
      return NextResponse.json(
        { error: "regencyCode query parameter is required" },
        { status: 400 },
      );
    }

    const districts = await getDistricts();
    const filtered = districts.filter(
      (d: { regency_code: string }) => d.regency_code === regencyCode,
    );

    return NextResponse.json(
      filtered.map((d: { code: string; name: string }) => ({
        code: d.code,
        name: d.name,
      })),
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch districts" },
      { status: 500 },
    );
  }
}
