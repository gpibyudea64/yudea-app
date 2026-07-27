export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { validateBody, handleApiError } from "@/lib/api-validate";
import { updateRegionSchema } from "@/schemas/api.schemas";

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
    return handleApiError(error, "region GET", "Failed to fetch region");
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

    const parsed = validateBody(updateRegionSchema, body, "region PATCH");
    if (parsed.error) return parsed.error;

    await prisma.region.update({
      where: { id },
      data: {
        ...(parsed.data.name !== undefined && { name: parsed.data.name }),
        ...(parsed.data.branchId !== undefined && {
          branch: { connect: { id: parsed.data.branchId } },
        }),
      },
    });

    const updated = await findOneOrThrow(id);

    if (!updated) {
      return NextResponse.json({ error: "Region not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error, "region PATCH", "Failed to update region");
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
    return handleApiError(error, "region DELETE", "Failed to delete region");
  }
}
