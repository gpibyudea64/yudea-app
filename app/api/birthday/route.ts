export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
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

type BirthdayRow = {
  id: string;
  firstName: string;
  lastName: string | null;
  birthDate: Date;
  regionName: string;
  familyName: string;
  address: string | null;
  kotaKabupaten: string | null;
  kecamatan: string | null;
  pelkat: string | null;
};

export async function GET(req: NextRequest) {
  const authResult = await requireViewAccess("/dashboard/birthday");
  if (authResult.error) return authResult.error;
  const session = authResult.user;

  const requestedDate = req.nextUrl.searchParams.get("date");
  const today = requestedDate ? new Date(requestedDate) : new Date();
  const parsedDate = Number.isNaN(today.getTime()) ? new Date() : today;
  const { sunday, saturday } = getWeekRange(parsedDate);
  const startKey = `${pad(sunday.getMonth() + 1)}-${pad(sunday.getDate())}`;
  const endKey = `${pad(saturday.getMonth() + 1)}-${pad(saturday.getDate())}`;

  // Build the birthday filter using Prisma.sql tagged templates for parameterized queries.
  // The MM-DD keys are safe (derived from date math, not user input), but using
  // parameterized values via Prisma.sql is the correct defense-in-depth pattern.
  const birthdayFilter: Prisma.Sql =
    startKey <= endKey
      ? Prisma.sql`to_char(m."birthDate", 'MM-DD') BETWEEN ${startKey} AND ${endKey}`
      : Prisma.sql`to_char(m."birthDate", 'MM-DD') >= ${startKey} OR to_char(m."birthDate", 'MM-DD') <= ${endKey}`;

  // Restrict region when the user is a COORDINATOR — parameterized via Prisma.sql
  const isCoordinator =
    session.role === "COORDINATOR" && !!session.regionId;

  const regionClause: Prisma.Sql = isCoordinator
    ? Prisma.sql`AND r.id = ${session.regionId}`
    : Prisma.sql``;

  const members = await prisma.$queryRaw<BirthdayRow[]>`
    SELECT
      m.id,
      m."firstName",
      m."lastName",
      m."birthDate",
      r.name AS "regionName",
      f."familyName",
      f.address,
      f."kotaKabupaten",
      f."kecamatan",
      m."pelkat"
    FROM "Member" m
    JOIN "Family" f ON f.id = m."familyId"
    JOIN "Region" r ON r.id = f."regionId"
    WHERE (${birthdayFilter})
    ${regionClause}
    ORDER BY to_char(m."birthDate", 'MM-DD') ASC, m."firstName" ASC
  `;

  return NextResponse.json({
    data: members.map((member) => ({
      ...member,
      birthDate: member.birthDate.toISOString(),
    })),
    meta: {
      start: sunday.toISOString(),
      end: saturday.toISOString(),
    },
  });
}
