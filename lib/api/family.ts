import type { Family, FamilyForm } from "@/types/family";
import type { PaginatedResponse } from "@/types/shared";

export async function getFamilies(
  page = 1,
  limit = 10,
  search = "",
): Promise<PaginatedResponse<Family>> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (search) params.set("search", search);

  const res = await fetch(`/api/family?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch Keluarga");
  return res.json();
}

export async function getFamily(id: string): Promise<Family> {
  const res = await fetch(`/api/family/${id}`);
  if (!res.ok) throw new Error("Failed to fetch Sektor Pelayanan");
  return res.json();
}

export async function createFamily(payload: FamilyForm): Promise<Family> {
  const res = await fetch("/api/family", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create family");
  return res.json();
}

export async function updateFamily(
  id: string,
  payload: Partial<FamilyForm>,
): Promise<Family> {
  const res = await fetch(`/api/family/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update family");
  return res.json();
}

export async function deleteFamily(id: string): Promise<void> {
  const res = await fetch(`/api/family/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete family");
}
