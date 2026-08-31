export const runtime = "nodejs";

import { parsePagination } from "@/lib/helper";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { validateBody, handleApiError } from "@/lib/api-validate";
import { requireEditAccess, requireViewAccess } from "@/lib/server-auth";
import { createFamilySchema } from "@/schemas/api.schemas";
import type { z } from "zod";

type MemberInput = NonNullable<z.infer<typeof createFamilySchema>["members"]>[number];

/** Convert empty-string or non-enum values to null for Prisma. */
function toEnumOrNull<T extends string>(value: string | null | undefined): T | null {
  return value && value !== "" ? (value as T) : null;
}

// GET /api/family?page=1&limit=10
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireViewAccess("/dashboard/families");
    if (authResult.error) return authResult.error;
    const session = authResult.user;
    const { searchParams } = req.nextUrl;
    const { page, limit } = parsePagination(searchParams);
    const search = searchParams.get("search")?.trim() ?? "";
    const sortBy = searchParams.get("sortBy")?.trim() || "familyName";
    const sortOrder = searchParams.get("sortOrder")?.trim() === "asc" ? "asc" : "desc";
    const skip = (page - 1) * limit;

    // Build where clause for search
    const searchWhere: Prisma.FamilyWhereInput = search
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

    // Collect all filter conditions and combine with AND to avoid
    // shallow-merge overwrites when multiple filters set the same key.
    const filters: Prisma.FamilyWhereInput[] = [];
    if (Object.keys(searchWhere).length) filters.push(searchWhere);

    // Filter by region if user is a coordinator
    const regionId = session.regionId;
    if (session.role === "COORDINATOR" && regionId) {
      filters.push({ regionId });
    }

    const where: Prisma.FamilyWhereInput =
      filters.length > 1 ? { AND: filters } : filters[0] ?? {};

    const [items, total] = await prisma.$transaction([
      prisma.family.findMany({
        where,
        skip,
        take: limit,
        orderBy:
          sortBy === "regionName"
            ? { region: { name: sortOrder } }
            : sortBy === "memberCount"
              ? { members: { _count: sortOrder } }
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
    return handleApiError(error, "family GET", "Failed to fetch families");
  }
}

// POST /api/family
export async function POST(req: NextRequest) {
  const authResult = await requireEditAccess("/dashboard/families");
  if (authResult.error) return authResult.error;

  try {
    const body = await req.json();

    const parsed = validateBody(createFamilySchema, body, "family POST");
    if (parsed.error) return parsed.error;

    const { familyName, address, provinsi, kotaKabupaten, kecamatan, kelurahan, regionId, members } = parsed.data;

    // Coordinators may only create families in their own region.
    if (
      authResult.user.role === "COORDINATOR" &&
      authResult.user.regionId &&
      regionId !== authResult.user.regionId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
                create: members.map((m: MemberInput) => ({
                  firstName: m.firstName,
                  lastName: m.lastName || null,
                  birthCity: m.birthCity || '',
                  gender: m.gender,
                  birthDate: new Date(m.birthDate),
                  phone: m.phone || '',
                  email: m.email || null,
                  bloodType: toEnumOrNull<'A' | 'B' | 'AB' | 'O'>(m.bloodType),
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
                  deathDate: m.deathDate ? new Date(m.deathDate) : null,                  statusBaptis: (m.statusBaptis || 'BELUM') as 'SUDAH' | 'BELUM',
                    lokasiBaptis: m.statusBaptis === 'SUDAH' ? (m.lokasiBaptis || null) : null,
                    tanggalBaptis: m.statusBaptis === 'SUDAH' && m.tanggalBaptis
                      ? new Date(m.tanggalBaptis)
                      : null,
                    statusSidi: (m.statusSidi || 'BELUM') as 'SUDAH' | 'BELUM',
                    lokasiSidi: m.statusSidi === 'SUDAH' ? (m.lokasiSidi || null) : null,
                    tanggalSidi: m.statusSidi === 'SUDAH' && m.tanggalSidi
                      ? new Date(m.tanggalSidi)
                      : null,
                    statusPerkawinan: (m.statusPerkawinan || 'BELUM_MENIKAH') as 'BELUM_MENIKAH' | 'JANDA' | 'DUDA' | 'MENIKAH',
                  lokasiPemberkatanGereja: m.statusPerkawinan === 'MENIKAH' ? (m.lokasiPemberkatanGereja || null) : null,
                  tanggalPemberkatanGereja: m.statusPerkawinan === 'MENIKAH' && m.tanggalPemberkatanGereja
                    ? new Date(m.tanggalPemberkatanGereja)
                    : null,
                  lokasiPerkawinanSipil: m.statusPerkawinan === 'MENIKAH' ? (m.lokasiPerkawinanSipil || null) : null,
                  tanggalPerkawinanSipil: m.statusPerkawinan === 'MENIKAH' && m.tanggalPerkawinanSipil
                    ? new Date(m.tanggalPerkawinanSipil)
                    : null,
                  jabatan: toEnumOrNull<'WARGA_JEMAAT' | 'DIAKEN' | 'PENATUA' | 'PENGURUS_PELKAT' | 'PENGURUS_KOMISI'>(m.jabatan),
                  gerejaAsal: m.gerejaAsal || null,
                  pendidikanTerakhir: m.pendidikanTerakhir || null,
                  pekerjaan: m.pekerjaan || null,
                  tahunDaftar: m.tahunDaftar || null,
                  pengalamanGereja: m.pengalamanGereja || null,
                  pengalamanOrganisasi: m.pengalamanOrganisasi || null,
                  keteranganLain: m.keteranganLain || null,
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
    return handleApiError(error, "family POST", "Failed to create family");
  }
}
