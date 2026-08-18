export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { validateBody, handleApiError } from "@/lib/api-validate";
import { requireEditAccess, requireViewAccess } from "@/lib/server-auth";
import { updateFamilySchema } from "@/schemas/api.schemas";

// GET /api/family/:id
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireViewAccess("/dashboard/families");
  if (authResult.error) return authResult.error;

  try {
    const { id } = await params;

    const family = await prisma.family.findUnique({
      where: { id },
      include: {
        region: true,
        members: true,
      },
    });

    if (!family) {
      return NextResponse.json({ error: "Family not found" }, { status: 404 });
    }

    return NextResponse.json(family);
  } catch (error) {
    return handleApiError(error, "family GET", "Failed to fetch family");
  }
}

// PATCH /api/family/:id
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireEditAccess("/dashboard/families");
  if (authResult.error) return authResult.error;

  const { id } = await params;

  try {
    const body = await req.json();

    const parsed = validateBody(updateFamilySchema, body, "family PATCH");
    if (parsed.error) return parsed.error;

    const { familyName, address, provinsi, kotaKabupaten, kecamatan, kelurahan, regionId, members } = parsed.data;

    // Coordinators may only update families in their own region (and may not
    // move a family to another region).
    if (authResult.user.role === "COORDINATOR" && authResult.user.regionId) {
      const family = await prisma.family.findUnique({
        where: { id },
        select: { regionId: true },
      });
      if (!family) {
        return NextResponse.json({ error: "Family not found" }, { status: 404 });
      }
      if (
        family.regionId !== authResult.user.regionId ||
        (regionId !== undefined && regionId !== authResult.user.regionId)
      ) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const family = await prisma.family.update({
      where: { id },
      data: {
        ...(familyName !== undefined && { familyName }),
        ...(address !== undefined && { address }),
        ...(provinsi !== undefined && { provinsi: provinsi || null }),
        ...(kotaKabupaten !== undefined && { kotaKabupaten: kotaKabupaten || null }),
        ...(kecamatan !== undefined && { kecamatan: kecamatan || null }),
        ...(kelurahan !== undefined && { kelurahan: kelurahan || null }),
        ...(regionId !== undefined && {
          region: { connect: { id: regionId } },
        }),
        ...(members?.length
          ? {
              members: {
                create: (members as never[]).map(
                  (member: {
                    firstName: string;
                    lastName?: string | null;
                    birthCity?: string;
                    gender: "MALE" | "FEMALE";
                    birthDate: string;
                    phone?: string | null;
                    email?: string | null;
                    bloodType?: string;
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
                    deathDate?: string | null;
                    statusBaptis?: string;
                    lokasiBaptis?: string | null;
                    tanggalBaptis?: string | null;
                    statusSidi?: string;
                    lokasiSidi?: string | null;
                    tanggalSidi?: string | null;
                    statusPerkawinan?: string;
                    lokasiPemberkatanGereja?: string | null;
                    tanggalPemberkatanGereja?: string | null;
                    lokasiPerkawinanSipil?: string | null;
                    tanggalPerkawinanSipil?: string | null;
                    jabatan?: string | null;
                    gerejaAsal?: string | null;
                    pendidikanTerakhir?: string | null;
                    pekerjaan?: string | null;
                    tahunDaftar?: string | null;
                    pengalamanGereja?: string | null;
                    pengalamanOrganisasi?: string | null;
                    keteranganLain?: string | null;
                  }) => ({
                    firstName: member.firstName,
                    lastName: member.lastName || null,
                    birthCity: member.birthCity || '',
                    gender: member.gender,
                    birthDate: new Date(member.birthDate),
                    phone: member.phone || '',
                    email: member.email || null,
                    bloodType: member.bloodType ? (member.bloodType as never) : null,
                    role: member.role,
                    childNumber: member.role === 'CHILD' ? (member.childNumber || null) : null,
                    sameAddressAsFamily: member.sameAddressAsFamily ?? true,
                    memberAddress: member.sameAddressAsFamily ? null : (member.memberAddress || null),
                    memberProvinsi: member.sameAddressAsFamily ? null : (member.memberProvinsi || null),
                    memberKotaKabupaten: member.sameAddressAsFamily ? null : (member.memberKotaKabupaten || null),
                    memberKecamatan: member.sameAddressAsFamily ? null : (member.memberKecamatan || null),
                    memberKelurahan: member.sameAddressAsFamily ? null : (member.memberKelurahan || null),
                    isActive: member.isActive ?? true,
                    isDeceased: member.isDeceased ?? false,
                    deathDate: member.deathDate
                      ? new Date(member.deathDate)
                      : null,
                    statusBaptis: member.statusBaptis || 'BELUM',
                    lokasiBaptis: member.statusBaptis === 'SUDAH' ? (member.lokasiBaptis || null) : null,
                    tanggalBaptis: member.statusBaptis === 'SUDAH' && member.tanggalBaptis
                      ? new Date(member.tanggalBaptis)
                      : null,
                    statusSidi: member.statusSidi || 'BELUM',
                    lokasiSidi: member.statusSidi === 'SUDAH' ? (member.lokasiSidi || null) : null,
                    tanggalSidi: member.statusSidi === 'SUDAH' && member.tanggalSidi
                      ? new Date(member.tanggalSidi)
                      : null,
                    statusPerkawinan: member.statusPerkawinan || 'BELUM_MENIKAH',
                    lokasiPemberkatanGereja: member.statusPerkawinan === 'MENIKAH' ? (member.lokasiPemberkatanGereja || null) : null,
                    tanggalPemberkatanGereja: member.statusPerkawinan === 'MENIKAH' && member.tanggalPemberkatanGereja
                      ? new Date(member.tanggalPemberkatanGereja)
                      : null,
                    lokasiPerkawinanSipil: member.statusPerkawinan === 'MENIKAH' ? (member.lokasiPerkawinanSipil || null) : null,
                    tanggalPerkawinanSipil: member.statusPerkawinan === 'MENIKAH' && member.tanggalPerkawinanSipil
                      ? new Date(member.tanggalPerkawinanSipil)
                      : null,
                    jabatan: member.jabatan || null,
                    gerejaAsal: member.gerejaAsal || null,
                    pendidikanTerakhir: member.pendidikanTerakhir || null,
                    pekerjaan: member.pekerjaan || null,
                    tahunDaftar: member.tahunDaftar || null,
                    pengalamanGereja: member.pengalamanGereja || null,
                    pengalamanOrganisasi: member.pengalamanOrganisasi || null,
                    keteranganLain: member.keteranganLain || null,
                  } as never),
                ),
              },
            }
          : {}),
      } as never,
      include: {
        region: true,
        members: true,
      },
    });

    return NextResponse.json(family);
  } catch (error) {
    return handleApiError(error, "family PATCH", "Failed to update family");
  }
}

// DELETE /api/family/:id
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireEditAccess("/dashboard/families");
  if (authResult.error) return authResult.error;

  const { id } = await params;

  try {
    // Coordinators may only delete families in their own region.
    if (authResult.user.role === "COORDINATOR" && authResult.user.regionId) {
      const family = await prisma.family.findUnique({
        where: { id },
        select: { regionId: true },
      });
      if (!family) {
        return NextResponse.json({ error: "Family not found" }, { status: 404 });
      }
      if (family.regionId !== authResult.user.regionId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Cascade: members reference the family (no DB-level onDelete: Cascade),
    // and a member may be a region coordinator — clear that reference first.
    const memberIds = await prisma.member.findMany({
      where: { familyId: id },
      select: { id: true },
    });

    await prisma.$transaction([
      prisma.region.updateMany({
        where: { coordinatorMemberId: { in: memberIds.map((m) => m.id) } },
        data: { coordinatorMemberId: null },
      }),
      prisma.member.deleteMany({ where: { familyId: id } }),
      prisma.family.delete({ where: { id } }),
    ]);

    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    return handleApiError(error, "family DELETE", "Failed to delete family");
  }
}
