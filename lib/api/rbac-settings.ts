import type { RoleAccessConfig } from "@/lib/rbac";

export async function fetchRoleAccessConfig(): Promise<RoleAccessConfig> {
  const res = await fetch("/api/settings/rbac");
  if (!res.ok) throw new Error("Failed to load role access settings");
  const data = await res.json();
  return data.config;
}

export async function saveRoleAccessConfig(
  config: RoleAccessConfig,
): Promise<RoleAccessConfig> {
  const res = await fetch("/api/settings/rbac", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ config }),
  });
  if (!res.ok) throw new Error("Failed to save role access settings");
  const data = await res.json();
  return data.config;
}
