export const runtime = "nodejs";

import { attachPelkat } from "@/lib/helper";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { validateBody, handleApiError } from "@/lib/api-validate";
import { updateMemberSchema } from "@/schemas/api.schemas";

// GET /api/member/:id
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const member = await prisma.member.findUnique({
      where: { id },
      include: { family: true },
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    return NextResponse.json(attachPelkat(member));
  } catch (error) {
    return handleApiError(error, "member GET", "Failed to fetch member");
  }
}

// PATCH /api/member/:id
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const parsed = validateBody(updateMemberSchema, body, "member PATCH");
    if (parsed.error) return parsed.error;

    const d = parsed.data;

    const connectFamily = d.familyId !== undefined
      ? { family: { connect: { id: d.familyId } } }
      : {};

    const member = await prisma.member.update({
      where: { id },
      data: {
        ...(d.firstName !== undefined && { firstName: d.firstName }),
        ...(d.lastName !== undefined && { lastName: d.lastName || null }),
        ...(d.birthCity !== undefined && { birthCity: d.birthCity }),
        ...(d.gender !== undefined && { gender: d.gender }),
        ...(d.birthDate !== undefined && { birthDate: new Date(d.birthDate) }),
        ...(d.phone !== undefined && { phone: d.phone }),
        ...(d.email !== undefined && { email: d.email || null }),
        ...(d.role !== undefined && { role: d.role }),
        ...(d.childNumber !== undefined && {
          childNumber: d.role === "CHILD" ? (d.childNumber || null) : null,
        }),
        ...(d.sameAddressAsFamily !== undefined && {
          sameAddressAsFamily: d.sameAddressAsFamily,
          ...(d.sameAddressAsFamily
            ? {
                memberAddress: null,
                memberProvinsi: null,
                memberKotaKabupaten: null,
                memberKecamatan: null,
                memberKelurahan: null,
              }
            : {}),
        }),
        ...(d.memberAddress !== undefined && { memberAddress: d.memberAddress || null }),
        ...(d.memberProvinsi !== undefined && { memberProvinsi: d.memberProvinsi || null }),
        ...(d.memberKotaKabupaten !== undefined && { memberKotaKabupaten: d.memberKotaKabupaten || null }),
        ...(d.memberKecamatan !== undefined && { memberKecamatan: d.memberKecamatan || null }),
        ...(d.memberKelurahan !== undefined && { memberKelurahan: d.memberKelurahan || null }),
        ...(d.isActive !== undefined && { isActive: d.isActive }),
        ...(d.tanggalPindah !== undefined && {
          tanggalPindah: d.tanggalPindah ? new Date(d.tanggalPindah) : null,
        }),
        ...(d.isDeceased !== undefined && { isDeceased: d.isDeceased }),
        ...(d.deathDate !== undefined && {
          deathDate: d.deathDate ? new Date(d.deathDate) : null,
        }),
        ...(d.isPresbyter !== undefined && { isPresbyter: d.isPresbyter }),
        ...(d.statusBaptis !== undefined && { statusBaptis: d.statusBaptis }),
        ...(d.lokasiBaptis !== undefined && { lokasiBaptis: d.lokasiBaptis || null }),
        ...(d.tanggalBaptis !== undefined && {
          tanggalBaptis: d.tanggalBaptis ? new Date(d.tanggalBaptis) : null,
        }),
        ...(d.statusSidi !== undefined && { statusSidi: d.statusSidi }),
        ...(d.lokasiSidi !== undefined && { lokasiSidi: d.lokasiSidi || null }),
        ...(d.tanggalSidi !== undefined && {
          tanggalSidi: d.tanggalSidi ? new Date(d.tanggalSidi) : null,
        }),
        ...(d.statusPerkawinan !== undefined && { statusPerkawinan: d.statusPerkawinan }),
        ...(d.lokasiPemberkatanGereja !== undefined && {
          lokasiPemberkatanGereja: d.lokasiPemberkatanGereja || null,
        }),
        ...(d.tanggalPemberkatanGereja !== undefined && {
          tanggalPemberkatanGereja: d.tanggalPemberkatanGereja ? new Date(d.tanggalPemberkatanGereja) : null,
        }),
        ...(d.lokasiPerkawinanSipil !== undefined && {
          lokasiPerkawinanSipil: d.lokasiPerkawinanSipil || null,
        }),
        ...(d.tanggalPerkawinanSipil !== undefined && {
          tanggalPerkawinanSipil: d.tanggalPerkawinanSipil ? new Date(d.tanggalPerkawinanSipil) : null,
        }),
        ...(d.jabatan !== undefined && { jabatan: d.jabatan || null }),
        ...(d.gerejaAsal !== undefined && { gerejaAsal: d.gerejaAsal || null }),
        ...(d.pendidikanTerakhir !== undefined && {
          pendidikanTerakhir: d.pendidikanTerakhir || null,
        }),
        ...(d.pekerjaan !== undefined && { pekerjaan: d.pekerjaan || null }),
        ...(d.tahunDaftar !== undefined && { tahunDaftar: d.tahunDaftar || null }),
        ...(d.pengalamanGereja !== undefined && {
          pengalamanGereja: d.pengalamanGereja || null,
        }),
        ...(d.pengalamanOrganisasi !== undefined && {
          pengalamanOrganisasi: d.pengalamanOrganisasi || null,
        }),
        ...(d.keteranganLain !== undefined && {
          keteranganLain: d.keteranganLain || null,
        }),
        ...connectFamily,
      } as never,
      include: { family: true },
    });

    return NextResponse.json(attachPelkat(member));
  } catch (error) {
    return handleApiError(error, "member PATCH", "Failed to update member");
  }
}

// DELETE /api/member/:id
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await prisma.member.delete({ where: { id } });
    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    return handleApiError(error, "member DELETE", "Failed to delete member");
  }
}
