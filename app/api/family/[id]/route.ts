export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

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
    return NextResponse.json(
      { error: "Failed to fetch family" },
      { status: 500 },
    );
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
    const { familyName, address, regionId, members } = body;

    const family = await prisma.family.update({
      where: { id },
      data: {
        ...(familyName !== undefined && { familyName }),
        ...(address !== undefined && { address }),
        ...(regionId !== undefined && {
          region: { connect: { id: regionId } },
        }),
        ...(members?.length
          ? {
              members: {
                create: members.map(
                  (member: {
                    name: string;
                    gender: "MALE" | "FEMALE";
                    birthDate: string;
                    phone?: string;
                    email?: string;
                    role: "FAMILY_HEAD" | "WIFE" | "CHILD" | "OTHER";
                    isActive?: boolean;
                    isDeceased?: boolean;
                    deathDate?: string;
                  }) => ({
                    name: member.name,
                    gender: member.gender,
                    birthDate: new Date(member.birthDate),
                    phone: member.phone || null,
                    email: member.email || null,
                    role: member.role,
                    isActive: member.isActive ?? true,
                    isDeceased: member.isDeceased ?? false,
                    deathDate: member.deathDate
                      ? new Date(member.deathDate)
                      : null,
                  }),
                ),
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
    return NextResponse.json(
      { error: "Failed to update family" },
      { status: 500 },
    );
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
    return NextResponse.json(
      { error: "Failed to delete family" },
      { status: 500 },
    );
  }
}
