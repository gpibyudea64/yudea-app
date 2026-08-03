export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { validateBody, handleApiError } from "@/lib/api-validate";
import { updateBranchSchema } from "@/schemas/api.schemas";

async function findOneOrThrow(id: string) {
  const branch = await prisma.branch.findUnique({
    where: { id },
    include: {
      regions: true,
    },
  });

  if (!branch) return null;
  return branch;
}

// GET /api/branch/:id
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const branch = await findOneOrThrow(id);

    if (!branch) {
      return NextResponse.json({ error: "branch not found" }, { status: 404 });
    }

    return NextResponse.json(branch);
  } catch (error) {
    return handleApiError(error, "branch GET", "Failed to fetch branch");
  }
}

// PATCH /api/branch/:id
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const body = await req.json();

    const parsed = validateBody(updateBranchSchema, body, "branch PATCH");
    if (parsed.error) return parsed.error;

    const existing = await findOneOrThrow(id);
    if (!existing) {
      return NextResponse.json({ error: "branch not found" }, { status: 404 });
    }

    const branch = await prisma.branch.update({
      where: { id },
      data: {
        ...(parsed.data.name !== undefined && { name: parsed.data.name }),
      },
    });

    return NextResponse.json(branch);
  } catch (error) {
    return handleApiError(error, "branch PATCH", "Failed to update branch");
  }
}

// DELETE /api/branch/:id
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    // Cascade: everything under the branch — regions, families, members,
    // and user assignments (no DB-level onDelete: Cascade).
    const memberIds = await prisma.member.findMany({
      where: { family: { region: { branchId: id } } },
      select: { id: true },
    });

    await prisma.$transaction([
      prisma.user.updateMany({
        where: { region: { branchId: id } },
        data: { regionId: null },
      }),
      prisma.region.updateMany({
        where: { coordinatorMemberId: { in: memberIds.map((m) => m.id) } },
        data: { coordinatorMemberId: null },
      }),
      prisma.member.deleteMany({ where: { family: { region: { branchId: id } } } }),
      prisma.family.deleteMany({ where: { region: { branchId: id } } }),
      prisma.region.deleteMany({ where: { branchId: id } }),
      prisma.branch.delete({ where: { id } }),
    ]);

    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    return handleApiError(error, "branch DELETE", "Failed to delete branch");
  }
}
