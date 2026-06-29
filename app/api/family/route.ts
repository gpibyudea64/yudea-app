export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { Prisma, User } from "@prisma/client";

// Form input type with all the extra fields the family dialog sends
interface MemberFormInput {
  firstName: string;
  lastName?: string | null;
  birthCity?: string;
  gender: string;
  birthDate: string | Date;
  phone?: string | null;
  email?: string | null;
  role: string;
  childNumber?: number | null;
  sameAddressAsFamily?: boolean;
  memberAddress?: string | null;
  memberProvinsi?: string | null;
  memberKotaKabupaten?: string | null;
  memberKecamatan?: string | null;
  memberKelurahan?: string | null;
  isActive?: boolean;
  isDeceased?: boolean;
  isPresbyter?: boolean;
  deathDate?: string | Date | null;
  statusBaptis?: string;
  lokasiBaptis?: string | null;
  tanggalBaptis?: string | Date | null;
  statusSidi?: string;
  lokasiSidi?: string | null;
  tanggalSidi?: string | Date | null;
  statusPerkawinan?: string;
  lokasiPemberkatanGereja?: string | null;
  tanggalPemberkatanGereja?: string | Date | null;
  lokasiPerkawinanSipil?: string | null;
  tanggalPerkawinanSipil?: string | Date | null;
  jabatan?: string | null;
  gerejaAsal?: string | null;
  pendidikanTerakhir?: string | null;
  pekerjaan?: string | null;
  tahunDaftar?: string | null;
  pengalamanGereja?: string | null;
  pengalamanOrganisasi?: string | null;
  keteranganLain?: string | null;
}

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
  } catch {
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
                create: members.map((member: MemberFormInput) => {
                  const m = member;
                  return {
                    firstName: m.firstName,
                    lastName: m.lastName || null,
                    birthCity: m.birthCity || '',
                    gender: m.gender,
                    birthDate: new Date(m.birthDate),
                    phone: m.phone || null,
                    email: m.email || null,
                    role: m.role,
                    childNumber: m.role === 'CHILD' ? (m.childNumber || null) : null,
                    sameAddressAsFamily: m.sameAddressAsFamily ?? true,
                    memberAddress: m.sameAddressAsFamily ? null : (m.memberAddress || null),
                    memberProvinsi: m.sameAddressAsFamily ? null : (m.memberProvinsi || null),
                    memberKotaKabupaten: m.sameAddressAsFamily ? null : (m.memberKotaKabupaten || null),
                    memberKecamatan: m.sameAddressAsFamily ? null : (m.memberKecamatan || null),
                    memberKelurahan: m.sameAddressAsFamily ? null : (m.memberKelurahan || null),
                    isActive: m.isActive ?? true,
                    isDeceased: m.isDeceased ?? false,
                    isPresbyter: m.isPresbyter ?? false,
                    deathDate: m.deathDate ? new Date(m.deathDate) : null,
                    statusBaptis: m.statusBaptis || 'BELUM',
                    lokasiBaptis: m.statusBaptis === 'SUDAH' ? (m.lokasiBaptis || null) : null,
                    tanggalBaptis: m.statusBaptis === 'SUDAH' && m.tanggalBaptis
                      ? new Date(m.tanggalBaptis)
                      : null,
                    statusSidi: m.statusSidi || 'BELUM',
                    lokasiSidi: m.statusSidi === 'SUDAH' ? (m.lokasiSidi || null) : null,
                    tanggalSidi: m.statusSidi === 'SUDAH' && m.tanggalSidi
                      ? new Date(m.tanggalSidi)
                      : null,
                    statusPerkawinan: m.statusPerkawinan || 'BELUM_MENIKAH',
                    lokasiPemberkatanGereja: m.statusPerkawinan === 'MENIKAH' ? (m.lokasiPemberkatanGereja || null) : null,
                    tanggalPemberkatanGereja: m.statusPerkawinan === 'MENIKAH' && m.tanggalPemberkatanGereja
                      ? new Date(m.tanggalPemberkatanGereja)
                      : null,
                    lokasiPerkawinanSipil: m.statusPerkawinan === 'MENIKAH' ? (m.lokasiPerkawinanSipil || null) : null,
                    tanggalPerkawinanSipil: m.statusPerkawinan === 'MENIKAH' && m.tanggalPerkawinanSipil
                      ? new Date(m.tanggalPerkawinanSipil)
                      : null,
                    jabatan: m.jabatan || null,
                    gerejaAsal: m.gerejaAsal || null,
                    pendidikanTerakhir: m.pendidikanTerakhir || null,
                    pekerjaan: m.pekerjaan || null,
                    tahunDaftar: m.tahunDaftar || null,
                    pengalamanGereja: m.pengalamanGereja || null,
                    pengalamanOrganisasi: m.pengalamanOrganisasi || null,
                    keteranganLain: m.keteranganLain || null,
                  };
                }),
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
  } catch {
    return NextResponse.json(
      { error: "Failed to create family" },
      { status: 500 },
    );
  }
}
