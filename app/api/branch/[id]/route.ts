import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET /api/attendance/:id
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const branch = await prisma.branch.findUnique({
      where: { id: id },
    });

    if (!branch) {
      return NextResponse.json({ error: "branch not found" }, { status: 404 });
    }

    return NextResponse.json(branch);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch branch" },
      { status: 500 },
    );
  }
}

// PATCH /api/attendance/:id
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const { name } = body;

    const existing = await prisma.branch.findUnique({
      where: { id: id },
    });

    if (!existing) {
      return NextResponse.json({ error: "branch not found" }, { status: 404 });
    }

    const branch = await prisma.branch.update({
      where: { id: id },
      data: {
        ...(name !== undefined && {
          name: name,
        }),
      },
    });

    return NextResponse.json(branch);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update branch" },
      { status: 500 },
    );
  }
}

// DELETE /api/attendance/:id
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    await prisma.branch.delete({
      where: { id: id },
    });

    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete branch" },
      { status: 500 },
    );
  }
}
