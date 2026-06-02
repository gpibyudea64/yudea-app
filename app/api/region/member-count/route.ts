import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    const regionId = session?.user?.regionId;

    const result =
      session?.user?.role === "COORDINATOR" && regionId
        ? await prisma.$queryRaw<
            Array<{ regionId: string; regionName: string; memberCount: bigint }>
          >`
            SELECT r.id AS "regionId",
                   r.name AS "regionName",
                   COUNT(m.id) AS "memberCount"
            FROM "Region" r
            LEFT JOIN "Family" f ON f."regionId" = r.id
            LEFT JOIN "Member" m ON m."familyId" = f.id
            WHERE r.id = ${regionId}
            GROUP BY r.id, r.name
            ORDER BY r.name ASC
          `
        : await prisma.$queryRaw<
            Array<{ regionId: string; regionName: string; memberCount: bigint }>
          >`
            SELECT r.id AS "regionId",
                   r.name AS "regionName",
                   COUNT(m.id) AS "memberCount"
            FROM "Region" r
            LEFT JOIN "Family" f ON f."regionId" = r.id
            LEFT JOIN "Member" m ON m."familyId" = f.id
            GROUP BY r.id, r.name
            ORDER BY r.name ASC
          `;

    const data = result.map((item) => ({
      regionId: item.regionId,
      regionName: item.regionName,
      memberCount: Number(item.memberCount),
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error("/api/region/member-count error:", error);
    return NextResponse.json(
      { error: "Failed to fetch member counts by region" },
      { status: 500 },
    );
  }
}
