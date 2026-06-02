import { prisma } from "@/lib/prisma";
import {
  defaultRoleAccessConfig,
  parseRoleAccessConfig,
  serializeRoleAccessConfig,
} from "@/lib/rbac";

export const RBAC_SETTINGS_KEY = "role_access_config";

export async function getRoleAccessConfigFromDb() {
  const setting = await prisma.appSetting.findUnique({
    where: { key: RBAC_SETTINGS_KEY },
  });

  if (!setting?.value) {
    return defaultRoleAccessConfig;
  }

  return parseRoleAccessConfig(setting.value);
}

export async function saveRoleAccessConfigToDb(rawConfig: string) {
  const normalized = serializeRoleAccessConfig(
    parseRoleAccessConfig(rawConfig),
  );

  await prisma.appSetting.upsert({
    where: { key: RBAC_SETTINGS_KEY },
    create: { key: RBAC_SETTINGS_KEY, value: normalized },
    update: { value: normalized },
  });

  return parseRoleAccessConfig(normalized);
}
