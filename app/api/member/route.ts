export const runtime = "nodejs";

import { attachPelkat, buildPelkatWhere, parsePagination } from "@/lib/helper";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { BloodType, MemberPelkat, Prisma } from "@prisma/client";
import { validateBody, handleApiError } from "@/lib/api-validate";
import { requireEditAccess, requireViewAccess } from "@/lib/server-auth";
import { createMemberSchema } from "@/schemas/api.schemas";

// GET /api/member?page=1&limit=10
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireViewAccess("/dashboard/members");
    if (authResult.error) return authResult.error;
    const session = authResult.user;
    const { searchParams } = req.nextUrl;
    const { page, limit } = parsePagination(searchParams);
    const search = searchParams.get("search")?.trim() ?? "";
    const region = searchParams.get("region")?.trim() ?? "";
    const pelkat = searchParams.get("pelkat")?.trim() ?? "";
    const sortBy = searchParams.get("sortBy")?.trim() || "firstName";
    const sortOrder = searchParams.get("sortOrder")?.trim() === "asc" ? "asc" : "desc";
    const skip = (page - 1) * limit;

    // Build where clause for search
    const searchWhere: Prisma.MemberWhereInput = search
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

    // Collect all filter conditions and combine with AND to avoid
    // shallow-merge overwrites when multiple filters set the same key.
    const filters: Prisma.MemberWhereInput[] = [];
    if (Object.keys(searchWhere).length) filters.push(searchWhere);

    if (region && region !== "all") {
      filters.push({ family: { regionId: region } });
    }

    // Filter by region if user is a coordinator
    const regionId = session.regionId;
    if (session.role === "COORDINATOR" && regionId) {
      filters.push({ family: { regionId } });
    }

    // Apply server-side pelkat filter using the existing buildPelkatWhere helper
    if (pelkat && pelkat !== "all" && Object.values(MemberPelkat).includes(pelkat as MemberPelkat)) {
      filters.push(buildPelkatWhere(pelkat as MemberPelkat));
    }

    const where: Prisma.MemberWhereInput =
      filters.length > 1 ? { AND: filters } : filters[0] ?? {};

    const [items, total] = await prisma.$transaction([
      prisma.member.findMany({
        where,
        skip,
        take: limit,
        orderBy:
          sortBy === "familyRegionName"
            ? { family: { region: { name: sortOrder } } }
            : sortBy === "familyFamilyName"
              ? { family: { familyName: sortOrder } }
              : sortBy === "fullName"
                ? [{ firstName: sortOrder }, { lastName: sortOrder }]
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

    return NextResponse.json({
      data: membersWithPelkat,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleApiError(error, "member GET", "Failed to fetch members");
  }
}

// POST /api/member
export async function POST(req: NextRequest) {
  const authResult = await requireEditAccess("/dashboard/members");
  if (authResult.error) return authResult.error;

  try {
    const body = await req.json();

    const parsed = validateBody(createMemberSchema, body, "member POST");
    if (parsed.error) return parsed.error;

    const d = parsed.data;

    // Coordinators may only add members to families in their own region.
    if (authResult.user.role === "COORDINATOR" && authResult.user.regionId) {
      const family = await prisma.family.findUnique({
        where: { id: d.familyId },
        select: { regionId: true },
      });
      if (!family || family.regionId !== authResult.user.regionId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const member = await prisma.member.create({
      data: {
        firstName: d.firstName,
        lastName: d.lastName || null,
        birthCity: d.birthCity,
        gender: d.gender,
        birthDate: new Date(d.birthDate),
        phone: d.phone,
        email: d.email || null,
        role: d.role,
        childNumber: d.role === "CHILD" ? (d.childNumber || null) : null,
        sameAddressAsFamily: d.sameAddressAsFamily ?? true,
        memberAddress: d.sameAddressAsFamily ? null : (d.memberAddress || null),
        memberProvinsi: d.sameAddressAsFamily ? null : (d.memberProvinsi || null),
        memberKotaKabupaten: d.sameAddressAsFamily ? null : (d.memberKotaKabupaten || null),
        memberKecamatan: d.sameAddressAsFamily ? null : (d.memberKecamatan || null),
        memberKelurahan: d.sameAddressAsFamily ? null : (d.memberKelurahan || null),
        isActive: d.isActive ?? true,
        isDeceased: d.isDeceased ?? false,
        deathDate: d.deathDate ? new Date(d.deathDate) : null,
        bloodType: d.bloodType ? (d.bloodType as BloodType) : null,
        statusBaptis: d.statusBaptis || 'BELUM',
        lokasiBaptis: d.lokasiBaptis || null,
        tanggalBaptis: d.tanggalBaptis ? new Date(d.tanggalBaptis) : null,
        statusSidi: d.statusSidi || 'BELUM',
        lokasiSidi: d.lokasiSidi || null,
        tanggalSidi: d.tanggalSidi ? new Date(d.tanggalSidi) : null,
        statusPerkawinan: d.statusPerkawinan || 'BELUM_MENIKAH',
        lokasiPemberkatanGereja: d.lokasiPemberkatanGereja || null,
        tanggalPemberkatanGereja: d.tanggalPemberkatanGereja ? new Date(d.tanggalPemberkatanGereja) : null,
        lokasiPerkawinanSipil: d.lokasiPerkawinanSipil || null,
        tanggalPerkawinanSipil: d.tanggalPerkawinanSipil ? new Date(d.tanggalPerkawinanSipil) : null,
        jabatan: d.jabatan || null,
        gerejaAsal: d.gerejaAsal || null,
        pendidikanTerakhir: d.pendidikanTerakhir || null,
        pekerjaan: d.pekerjaan || null,
        tahunDaftar: d.tahunDaftar || null,
        pengalamanGereja: d.pengalamanGereja || null,
        pengalamanOrganisasi: d.pengalamanOrganisasi || null,
        keteranganLain: d.keteranganLain || null,
        family: { connect: { id: d.familyId } },
      },
      include: { family: true },
    });

    return NextResponse.json(attachPelkat(member), { status: 201 });
  } catch (error) {
    return handleApiError(error, "member POST", "Failed to create member");
  }
}
