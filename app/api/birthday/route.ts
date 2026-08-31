export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireViewAccess } from "@/lib/server-auth";

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

function getWeekRange(date: Date) {
  const selected = new Date(date);
  selected.setHours(0, 0, 0, 0);
  const day = selected.getDay();
  const sunday = new Date(selected);
  sunday.setDate(selected.getDate() - day);

  const saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6);
  saturday.setHours(23, 59, 59, 999);

  return { sunday, saturday };
}

/** Extract "MM-DD" from a date for birthday matching (ignores birth year). */
function toMonthDay(date: Date): string {
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export async function GET(req: NextRequest) {
  const authResult = await requireViewAccess("/dashboard/birthday");
  if (authResult.error) return authResult.error;
  const session = authResult.user;

  const requestedDate = req.nextUrl.searchParams.get("date");
  const today = requestedDate ? new Date(requestedDate) : new Date();
  const parsedDate = Number.isNaN(today.getTime()) ? new Date() : today;
  const { sunday, saturday } = getWeekRange(parsedDate);
  const startKey = toMonthDay(sunday);
  const endKey = toMonthDay(saturday);

  // Build the Prisma where clause. Coordinator scoping is applied directly
  // via Prisma relational filter — no raw SQL needed.
  const members = await prisma.member.findMany({
    where: {
      isActive: true,
      isDeceased: false,
      ...(session.role === "COORDINATOR" && session.regionId
        ? { family: { regionId: session.regionId } }
        : {}),
    },
    include: {
      family: {
        include: { region: true },
      },
    },
  });

  // Filter by MM-DD birthday range (handles year wrap-around, e.g. Dec 28 – Jan 3).
  const matched = members.filter((member) => {
    const monthDay = toMonthDay(new Date(member.birthDate));
    return startKey <= endKey
      ? monthDay >= startKey && monthDay <= endKey
      : monthDay >= startKey || monthDay <= endKey;
  });

  // Sort by day-of-year (MM-DD), then by first name.
  matched.sort((a, b) => {
    const aKey = toMonthDay(new Date(a.birthDate));
    const bKey = toMonthDay(new Date(b.birthDate));
    if (aKey !== bKey) return aKey.localeCompare(bKey);
    return a.firstName.localeCompare(b.firstName);
  });

  return NextResponse.json({
    data: matched.map((member) => ({
      id: member.id,
      firstName: member.firstName,
      lastName: member.lastName,
      birthDate: new Date(member.birthDate).toISOString(),
      regionName: member.family?.region?.name ?? "",
      familyName: member.family?.familyName ?? "",
      address: member.family?.address ?? null,
      kotaKabupaten: member.family?.kotaKabupaten ?? null,
      kecamatan: member.family?.kecamatan ?? null,
      pelkat: member.pelkat ?? null,
    })),
    meta: {
      start: sunday.toISOString(),
      end: saturday.toISOString(),
    },
  });
}
