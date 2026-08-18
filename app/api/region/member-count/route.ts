import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-validate";
import { requireViewAccess } from "@/lib/server-auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    const authResult = await requireViewAccess("/dashboard/regions");
    if (authResult.error) return authResult.error;
    const session = authResult.user;
    const regionId = session.regionId;

    const result =
      session.role === "COORDINATOR" && regionId
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
    return handleApiError(error, "region member-count GET", "Failed to fetch member counts by region");
  }
}
