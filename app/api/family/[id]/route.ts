export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { validateBody, handleApiError } from "@/lib/api-validate";
import { requireEditAccess, requireViewAccess } from "@/lib/server-auth";
import { updateFamilySchema } from "@/schemas/api.schemas";
import type { z } from "zod";

type MemberInput = NonNullable<z.infer<typeof updateFamilySchema>["members"]>[number];

/** Convert empty-string or non-enum values to null for Prisma. */
function toEnumOrNull<T extends string>(value: string | null | undefined): T | null {
  return value && value !== "" ? (value as T) : null;
}

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
