export const runtime = "nodejs";

import { attachPelkat } from "@/lib/helper";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

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
    return NextResponse.json(
      { error: "Failed to fetch member" },
      { status: 500 },
    );
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

    const connectFamily = body.familyId !== undefined
      ? { family: { connect: { id: body.familyId } } }
      : {};

    const member = await prisma.member.update({
      where: { id },
      data: {
        ...(body.firstName !== undefined && { firstName: body.firstName }),
        ...(body.lastName !== undefined && { lastName: body.lastName || null }),
        ...(body.birthCity !== undefined && { birthCity: body.birthCity }),
        ...(body.gender !== undefined && { gender: body.gender }),
        ...(body.birthDate !== undefined && { birthDate: new Date(body.birthDate) }),
        ...(body.phone !== undefined && { phone: body.phone }),
        ...(body.email !== undefined && { email: body.email || null }),
        ...(body.role !== undefined && { role: body.role }),
        ...(body.childNumber !== undefined && {
          childNumber: body.role === "CHILD" ? (body.childNumber || null) : null,
        }),
        ...(body.sameAddressAsFamily !== undefined && {
          sameAddressAsFamily: body.sameAddressAsFamily,
          ...(body.sameAddressAsFamily
            ? {
                memberAddress: null,
                memberProvinsi: null,
                memberKotaKabupaten: null,
                memberKecamatan: null,
                memberKelurahan: null,
              }
            : {}),
        }),
        ...(body.memberAddress !== undefined && { memberAddress: body.memberAddress || null }),
        ...(body.memberProvinsi !== undefined && { memberProvinsi: body.memberProvinsi || null }),
        ...(body.memberKotaKabupaten !== undefined && { memberKotaKabupaten: body.memberKotaKabupaten || null }),
        ...(body.memberKecamatan !== undefined && { memberKecamatan: body.memberKecamatan || null }),
        ...(body.memberKelurahan !== undefined && { memberKelurahan: body.memberKelurahan || null }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.tanggalPindah !== undefined && {
          tanggalPindah: body.tanggalPindah ? new Date(body.tanggalPindah) : null,
        }),
        ...(body.isDeceased !== undefined && { isDeceased: body.isDeceased }),
        ...(body.deathDate !== undefined && {
          deathDate: body.deathDate ? new Date(body.deathDate) : null,
        }),
        ...(body.isPresbyter !== undefined && { isPresbyter: body.isPresbyter }),
        ...(body.statusBaptis !== undefined && { statusBaptis: body.statusBaptis }),
        ...(body.lokasiBaptis !== undefined && { lokasiBaptis: body.lokasiBaptis || null }),
        ...(body.tanggalBaptis !== undefined && {
          tanggalBaptis: body.tanggalBaptis ? new Date(body.tanggalBaptis) : null,
        }),
        ...(body.statusSidi !== undefined && { statusSidi: body.statusSidi }),
        ...(body.lokasiSidi !== undefined && { lokasiSidi: body.lokasiSidi || null }),
        ...(body.tanggalSidi !== undefined && {
          tanggalSidi: body.tanggalSidi ? new Date(body.tanggalSidi) : null,
        }),
        ...(body.statusPerkawinan !== undefined && { statusPerkawinan: body.statusPerkawinan }),
        ...(body.lokasiPemberkatanGereja !== undefined && {
          lokasiPemberkatanGereja: body.lokasiPemberkatanGereja || null,
        }),
        ...(body.tanggalPemberkatanGereja !== undefined && {
          tanggalPemberkatanGereja: body.tanggalPemberkatanGereja ? new Date(body.tanggalPemberkatanGereja) : null,
        }),
        ...(body.lokasiPerkawinanSipil !== undefined && {
          lokasiPerkawinanSipil: body.lokasiPerkawinanSipil || null,
        }),
        ...(body.tanggalPerkawinanSipil !== undefined && {
          tanggalPerkawinanSipil: body.tanggalPerkawinanSipil ? new Date(body.tanggalPerkawinanSipil) : null,
        }),
        ...(body.jabatan !== undefined && { jabatan: body.jabatan || null }),
        ...(body.gerejaAsal !== undefined && { gerejaAsal: body.gerejaAsal || null }),
        ...(body.pendidikanTerakhir !== undefined && {
          pendidikanTerakhir: body.pendidikanTerakhir || null,
        }),
        ...(body.pekerjaan !== undefined && { pekerjaan: body.pekerjaan || null }),
        ...(body.tahunDaftar !== undefined && { tahunDaftar: body.tahunDaftar || null }),
        ...(body.pengalamanGereja !== undefined && {
          pengalamanGereja: body.pengalamanGereja || null,
        }),
        ...(body.pengalamanOrganisasi !== undefined && {
          pengalamanOrganisasi: body.pengalamanOrganisasi || null,
        }),
        ...(body.keteranganLain !== undefined && {
          keteranganLain: body.keteranganLain || null,
        }),
        ...connectFamily,
      },
      include: { family: true },
    });

    return NextResponse.json(attachPelkat(member));
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update member" },
      { status: 500 },
    );
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
    return NextResponse.json(
      { error: "Failed to delete member" },
      { status: 500 },
    );
  }
}
