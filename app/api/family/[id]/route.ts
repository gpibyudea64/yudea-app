export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { validateBody, handleApiError } from "@/lib/api-validate";
import { updateFamilySchema } from "@/schemas/api.schemas";

// GET /api/family/:id
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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
  try {
    const { id } = await params;
    const body = await req.json();

    const parsed = validateBody(updateFamilySchema, body, "family PATCH");
    if (parsed.error) return parsed.error;

    const { familyName, address, provinsi, kotaKabupaten, kecamatan, kelurahan, regionId, members } = parsed.data;

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
                    lastName?: string;
                    birthCity?: string;
                    gender: "MALE" | "FEMALE";
                    birthDate: string;
                    phone?: string;
                    email?: string;
                    role: string;
                    childNumber?: number;
                    isActive?: boolean;
                    isDeceased?: boolean;
                    deathDate?: string;
                  }) => ({
                    firstName: member.firstName,
                    lastName: member.lastName || null,
                    birthCity: member.birthCity || '',
                    gender: member.gender,
                    birthDate: new Date(member.birthDate),
                    phone: member.phone || null,
                    email: member.email || null,
                    role: member.role,
                    childNumber: member.role === 'CHILD' ? (member.childNumber || null) : null,
                    isActive: member.isActive ?? true,
                    isDeceased: member.isDeceased ?? false,
                    deathDate: member.deathDate
                      ? new Date(member.deathDate)
                      : null,
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
  try {
    const { id } = await params;

    await prisma.family.delete({ where: { id } });

    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    return handleApiError(error, "family DELETE", "Failed to delete family");
  }
}
