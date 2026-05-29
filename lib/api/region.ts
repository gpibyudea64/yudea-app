import type { Region, RegionForm } from "@/types/region";
import type { PaginatedResponse } from "@/types/shared";

export async function getRegions(
  page = 1,
  limit = 10,
  search = "",
): Promise<PaginatedResponse<Region>> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (search) params.set("search", search);

  const res = await fetch(`/api/region?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch regions");
  return res.json();
}

export async function getRegion(id: string): Promise<Region> {
  const res = await fetch(`/api/region/${id}`);
  if (!res.ok) throw new Error("Failed to fetch region");
  return res.json();
}

export async function createRegion(payload: RegionForm): Promise<Region> {
  const res = await fetch("/api/region", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create region");
  return res.json();
}

export async function updateRegion(
  id: string,
  payload: Partial<RegionForm>,
): Promise<Region> {
  const res = await fetch(`/api/region/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update region");
  return res.json();
}

export async function deleteRegion(id: string): Promise<void> {
  const res = await fetch(`/api/region/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete region");
}
