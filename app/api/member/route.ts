export const runtime = "nodejs";

import { attachPelkat } from "@/lib/helper";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { Prisma, User } from "@prisma/client";

// GET /api/member?page=1&limit=10
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = req.nextUrl;
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.max(1, Number(searchParams.get("limit") ?? 10));
    const search = searchParams.get("search")?.trim() ?? "";
    const region = searchParams.get("region")?.trim() ?? "";
    const pelkat = searchParams.get("pelkat")?.trim() ?? "";
    const sortBy = searchParams.get("sortBy")?.trim() || "firstName";
    const sortOrder = searchParams.get("sortOrder")?.trim() === "asc" ? "asc" : "desc";
    const skip = (page - 1) * limit;

    // Build where clause for search
    let where: Prisma.MemberWhereInput = search
      ? {
          OR: [
            { firstName: { contains: search, mode: "insensitive" as const } },
            { lastName: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
            { phone: { contains: search, mode: "insensitive" as const } },
            {
              family: {
                familyName: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            },
          ],
        }
      : {};

    if (region && region !== "all") {
      where = {
        ...where,
        family: {
          regionId: region,
        },
      };
    }

    // Filter by region if user is a coordinator
    const regionId = (session?.user as User)?.regionId;
    if (session?.user?.role === "COORDINATOR" && regionId) {
      where = {
        ...where,
        family: {
          regionId,
        },
      };
    }

    const [items, total] = await prisma.$transaction([
      prisma.member.findMany({
        where,
        skip,
        take: limit,
        orderBy:
          sortBy === "familyRegionName"
            ? { family: { region: { name: sortOrder } } }
            : sortBy === "pelkat"
              ? { createdAt: "desc" } // pelkat sorting done in JS below
              : { [sortBy]: sortOrder },
        include: {
          family: {
            include: {
              region: true,
            },
          },
        },
      }),
      prisma.member.count({ where }),
    ]);

    const membersWithPelkat = items.map(attachPelkat);

    // Client-side sort for pelkat (computed field)
    if (sortBy === "pelkat") {
      membersWithPelkat.sort((a, b) => {
        const aVal = (a.pelkat ?? "").toLowerCase();
        const bVal = (b.pelkat ?? "").toLowerCase();
        return sortOrder === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      });
    }

    const filteredMembers =
      pelkat && pelkat !== "all"
        ? membersWithPelkat.filter((m) => m.pelkat === pelkat)
        : membersWithPelkat;

    const filteredTotal =
      pelkat && pelkat !== "all"
        ? membersWithPelkat.filter((m) => m.pelkat === pelkat).length
        : total;

    return NextResponse.json({
      data: filteredMembers,
      meta: {
        total: filteredTotal,
        page,
        limit,
        totalPages: Math.ceil(filteredTotal / limit),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 },
    );
  }
}

// POST /api/member
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (
      !body.firstName ||
      !body.gender ||
      !body.birthDate ||
      !body.role ||
      !body.familyId ||
      !body.birthCity ||
      !body.phone
    ) {
      return NextResponse.json(
        { error: "Missing required fields: firstName, lastName, birthCity, gender, birthDate, phone, role, familyId" },
        { status: 400 },
      );
    }

    const member = await prisma.member.create({
      data: {
        firstName: body.firstName,
        lastName: body.lastName || null,
        birthCity: body.birthCity,
        gender: body.gender,
        birthDate: new Date(body.birthDate),
        phone: body.phone,
        email: body.email || null,
        role: body.role,
        childNumber: body.role === "CHILD" ? (body.childNumber || null) : null,
        sameAddressAsFamily: body.sameAddressAsFamily ?? true,
        memberAddress: body.sameAddressAsFamily ? null : (body.memberAddress || null),
        memberProvinsi: body.sameAddressAsFamily ? null : (body.memberProvinsi || null),
        memberKotaKabupaten: body.sameAddressAsFamily ? null : (body.memberKotaKabupaten || null),
        memberKecamatan: body.sameAddressAsFamily ? null : (body.memberKecamatan || null),
        memberKelurahan: body.sameAddressAsFamily ? null : (body.memberKelurahan || null),
        isActive: body.isActive ?? true,
        isDeceased: body.isDeceased ?? false,
        isPresbyter: body.isPresbyter ?? false,
        deathDate: body.deathDate ? new Date(body.deathDate) : null,
        statusBaptis: body.statusBaptis || 'BELUM',
        lokasiBaptis: body.lokasiBaptis || null,
        tanggalBaptis: body.tanggalBaptis ? new Date(body.tanggalBaptis) : null,
        statusSidi: body.statusSidi || 'BELUM',
        lokasiSidi: body.lokasiSidi || null,
        tanggalSidi: body.tanggalSidi ? new Date(body.tanggalSidi) : null,
        statusPerkawinan: body.statusPerkawinan || 'BELUM_MENIKAH',
        lokasiPemberkatanGereja: body.lokasiPemberkatanGereja || null,
        tanggalPemberkatanGereja: body.tanggalPemberkatanGereja ? new Date(body.tanggalPemberkatanGereja) : null,
        lokasiPerkawinanSipil: body.lokasiPerkawinanSipil || null,
        tanggalPerkawinanSipil: body.tanggalPerkawinanSipil ? new Date(body.tanggalPerkawinanSipil) : null,
        jabatan: body.jabatan || null,
        gerejaAsal: body.gerejaAsal || null,
        pendidikanTerakhir: body.pendidikanTerakhir || null,
        pekerjaan: body.pekerjaan || null,
        tahunDaftar: body.tahunDaftar || null,
        pengalamanGereja: body.pengalamanGereja || null,
        pengalamanOrganisasi: body.pengalamanOrganisasi || null,
        keteranganLain: body.keteranganLain || null,
        family: { connect: { id: body.familyId } },
      },
      include: { family: true },
    });

    return NextResponse.json(attachPelkat(member), { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create member" },
      { status: 500 },
    );
  }
}
