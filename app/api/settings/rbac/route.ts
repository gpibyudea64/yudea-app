import {
  getRoleAccessConfigFromDb,
  saveRoleAccessConfigToDb,
} from "@/lib/rbac-settings";
import { serializeRoleAccessConfig } from "@/lib/rbac";
import { requireAdmin, requireAuth } from "@/lib/server-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  try {
    const config = await getRoleAccessConfigFromDb();
    return NextResponse.json({ config });
  } catch {
    return NextResponse.json(
      { error: "Failed to load access settings" },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  const authResult = await requireAdmin();
  if (authResult.error) return authResult.error;

  try {
    const body = await req.json();
    const raw =
      typeof body.config === "string"
        ? body.config
        : serializeRoleAccessConfig(body.config);

    const config = await saveRoleAccessConfigToDb(raw);
    return NextResponse.json({ config });
  } catch {
    return NextResponse.json(
      { error: "Failed to save access settings" },
      { status: 500 },
    );
  }
}
