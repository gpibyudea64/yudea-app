export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

async function findOneOrThrow(id: string) {
  const region = await prisma.region.findUnique({
    where: { id },
    include: {
      branch: true,
      families: true,
      coordinator: { include: { family: true } },
    },
  });

  if (!region) return null;
  return region;
}

// GET /api/region/:id
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const region = await findOneOrThrow(id);

    if (!region) {
      return NextResponse.json({ error: "Region not found" }, { status: 404 });
    }

    return NextResponse.json(region);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch region" },
      { status: 500 },
    );
  }
}

// PATCH /api/region/:id
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, branchId } = body;

    await prisma.region.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(branchId !== undefined && {
          branch: { connect: { id: branchId } },
        }),
      },
    });

    const updated = await findOneOrThrow(id);

    if (!updated) {
      return NextResponse.json({ error: "Region not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update region" },
      { status: 500 },
    );
  }
}

// DELETE /api/region/:id
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    await prisma.region.delete({ where: { id } });

    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete region" },
      { status: 500 },
    );
  }
}
