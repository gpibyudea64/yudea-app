import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

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

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requestedDate = req.nextUrl.searchParams.get("date");
  const today = requestedDate ? new Date(requestedDate) : new Date();
  const parsedDate = Number.isNaN(today.getTime()) ? new Date() : today;
  const { sunday, saturday } = getWeekRange(parsedDate);
  const startKey = `${pad(sunday.getMonth() + 1)}-${pad(sunday.getDate())}`;
  const endKey = `${pad(saturday.getMonth() + 1)}-${pad(saturday.getDate())}`;

  const birthdayFilter =
    startKey <= endKey
      ? `to_char(m."birthDate", 'MM-DD') BETWEEN '${startKey}' AND '${endKey}'`
      : `to_char(m."birthDate", 'MM-DD') >= '${startKey}' OR to_char(m."birthDate", 'MM-DD') <= '${endKey}'`;

  const regionFilter =
    session.user.role === "COORDINATOR" && session.user.regionId
      ? `AND r.id = '${session.user.regionId}'`
      : "";

  const members = await prisma.$queryRawUnsafe<
    {
      id: string;
      name: string;
      birthDate: Date;
      regionName: string;
    }[]
  >(
    `
      SELECT
        m.id,
        m.name,
        m."birthDate",
        r.name AS "regionName"
      FROM "Member" m
      JOIN "Family" f ON f.id = m."familyId"
      JOIN "Region" r ON r.id = f."regionId"
      WHERE (${birthdayFilter})
      ${regionFilter}
      ORDER BY to_char(m."birthDate", 'MM-DD') ASC, m.name ASC
    `,
  );

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
