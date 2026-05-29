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
    const { name, gender, birthDate, phone, email, role, isActive, familyId } =
      body;

    const member = await prisma.member.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(gender !== undefined && { gender }),
        ...(birthDate !== undefined && { birthDate: new Date(birthDate) }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(email !== undefined && { email: email || null }),
        ...(role !== undefined && { role }),
        ...(isActive !== undefined && { isActive }),
        ...(body.isDeceased !== undefined && { isDeceased: body.isDeceased }),
        ...(body.deathDate !== undefined && {
          deathDate: body.deathDate ? new Date(body.deathDate) : null,
        }),
        ...(familyId !== undefined && {
          family: { connect: { id: familyId } },
        }),
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
