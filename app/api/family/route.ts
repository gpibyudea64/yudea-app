export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { Member, Prisma, User } from "@prisma/client";

// GET /api/family?page=1&limit=10
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = req.nextUrl;
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.max(1, Number(searchParams.get("limit") ?? 10));
    const search = searchParams.get("search")?.trim() ?? "";
    const sortBy = searchParams.get("sortBy")?.trim() || "familyName";
    const sortOrder = searchParams.get("sortOrder")?.trim() === "asc" ? "asc" : "desc";
    const skip = (page - 1) * limit;

    // Build where clause for search
    let where: Prisma.FamilyWhereInput = search
      ? {
          OR: [
            { familyName: { contains: search, mode: "insensitive" as const } },
            {
              region: {
                name: { contains: search, mode: "insensitive" as const },
              },
            },
          ],
        }
      : {};

    // Filter by region if user is a coordinator
    const regionId = (session?.user as User)?.regionId;
    if (session?.user?.role === "COORDINATOR" && regionId) {
      where = {
        ...where,
        regionId,
      };
    }

    const [items, total] = await prisma.$transaction([
      prisma.family.findMany({
        where,
        skip,
        take: limit,
        orderBy:
          sortBy === "regionName"
            ? { region: { name: sortOrder } }
            : { [sortBy]: sortOrder },
        include: {
          region: true,
          members: true,
        },
      }),
      prisma.family.count({ where }),
    ]);

    return NextResponse.json({
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch families" },
      { status: 500 },
    );
  }
}

// POST /api/family
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { familyName, address, provinsi, kotaKabupaten, kecamatan, kelurahan, regionId, members } = body;

    if (!familyName || !address || !provinsi || !kotaKabupaten || !kecamatan || !kelurahan || !regionId) {
      return NextResponse.json(
        { error: "Missing required fields: familyName, address, provinsi, kotaKabupaten, kecamatan, kelurahan, regionId" },
        { status: 400 },
      );
    }

    const family = await prisma.family.create({
      data: {
        familyName,
        address,
        provinsi,
        kotaKabupaten,
        kecamatan,
        kelurahan,
        region: { connect: { id: regionId } },
        ...(members?.length
          ? {
              members: {
                create: members.map((member: Member) => ({
                  firstName: member.firstName,
                  lastName: member.lastName || null,
                  birthCity: member.birthCity || '',
                  gender: member.gender,
                  birthDate: new Date(member.birthDate),
                  phone: member.phone || null,
                  email: member.email || null,
                  role: member.role as any,
                  childNumber: member.role === 'CHILD' ? (member as any).childNumber || null : null,
                  sameAddressAsFamily: (member as any).sameAddressAsFamily ?? true,
                  memberAddress: (member as any).sameAddressAsFamily ? null : ((member as any).memberAddress || null),
                  memberProvinsi: (member as any).sameAddressAsFamily ? null : ((member as any).memberProvinsi || null),
                  memberKotaKabupaten: (member as any).sameAddressAsFamily ? null : ((member as any).memberKotaKabupaten || null),
                  memberKecamatan: (member as any).sameAddressAsFamily ? null : ((member as any).memberKecamatan || null),
                  memberKelurahan: (member as any).sameAddressAsFamily ? null : ((member as any).memberKelurahan || null),
                  isActive: member.isActive ?? true,
                  isDeceased: member.isDeceased ?? false,
                  isPresbyter: (member as any).isPresbyter ?? false,
                  deathDate: member.deathDate
                    ? new Date(member.deathDate)
                    : null,
                  statusBaptis: (member as any).statusBaptis || 'BELUM',
                  lokasiBaptis: (member as any).statusBaptis === 'SUDAH' ? ((member as any).lokasiBaptis || null) : null,
                  tanggalBaptis: (member as any).statusBaptis === 'SUDAH' && (member as any).tanggalBaptis
                    ? new Date((member as any).tanggalBaptis)
                    : null,
                  statusSidi: (member as any).statusSidi || 'BELUM',
                  lokasiSidi: (member as any).statusSidi === 'SUDAH' ? ((member as any).lokasiSidi || null) : null,
                  tanggalSidi: (member as any).statusSidi === 'SUDAH' && (member as any).tanggalSidi
                    ? new Date((member as any).tanggalSidi)
                    : null,
                  statusPerkawinan: (member as any).statusPerkawinan || 'BELUM_MENIKAH',
                  lokasiPemberkatanGereja: (member as any).statusPerkawinan === 'MENIKAH' ? ((member as any).lokasiPemberkatanGereja || null) : null,
                  tanggalPemberkatanGereja: (member as any).statusPerkawinan === 'MENIKAH' && (member as any).tanggalPemberkatanGereja
                    ? new Date((member as any).tanggalPemberkatanGereja)
                    : null,
                  lokasiPerkawinanSipil: (member as any).statusPerkawinan === 'MENIKAH' ? ((member as any).lokasiPerkawinanSipil || null) : null,
                  tanggalPerkawinanSipil: (member as any).statusPerkawinan === 'MENIKAH' && (member as any).tanggalPerkawinanSipil
                    ? new Date((member as any).tanggalPerkawinanSipil)
                    : null,
                  jabatan: (member as any).jabatan || null,
                  gerejaAsal: (member as any).gerejaAsal || null,
                  pendidikanTerakhir: (member as any).pendidikanTerakhir || null,
                  pekerjaan: (member as any).pekerjaan || null,
                  tahunDaftar: (member as any).tahunDaftar || null,
                  pengalamanGereja: (member as any).pengalamanGereja || null,
                  pengalamanOrganisasi: (member as any).pengalamanOrganisasi || null,
                  keteranganLain: (member as any).keteranganLain || null,
                })),
              },
            }
          : {}),
      },
      include: {
        region: true,
        members: true,
      },
    });

    return NextResponse.json(family, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create family" },
      { status: 500 },
    );
  }
}
