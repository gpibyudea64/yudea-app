import {
  getRoleAccessConfigFromDb,
  saveRoleAccessConfigToDb,
} from "@/lib/rbac-settings";
import { serializeRoleAccessConfig } from "@/lib/rbac";
import { requireAdmin, requireAuth } from "@/lib/server-auth";
import { NextRequest, NextResponse } from "next/server";
import { validateBody, handleApiError } from "@/lib/api-validate";
import { rbacSettingsSchema } from "@/schemas/api.schemas";

export const runtime = "nodejs";

export async function GET() {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  try {
    const config = await getRoleAccessConfigFromDb();
    return NextResponse.json({ config });
  } catch (error) {
    return handleApiError(error, "rbac GET", "Failed to load access settings");
  }
}

export async function PUT(req: NextRequest) {
  const authResult = await requireAdmin();
  if (authResult.error) return authResult.error;

  try {
    const body = await req.json();

    const parsed = validateBody(rbacSettingsSchema, body, "rbac PUT");
    if (parsed.error) return parsed.error;

    const raw =
      typeof parsed.data.config === "string"
        ? parsed.data.config
        : serializeRoleAccessConfig(parsed.data.config as Parameters<typeof serializeRoleAccessConfig>[0]);

    const config = await saveRoleAccessConfigToDb(raw);
    return NextResponse.json({ config });
  } catch (error) {
    return handleApiError(error, "rbac PUT", "Failed to save access settings");
  }
}
