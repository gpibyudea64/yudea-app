import type { Branch } from "@/types/branch";
import type { BranchForm } from "@/types/branch";
import type { PaginatedResponse } from "@/types/shared";

export async function getBranches(
  page = 1,
  limit = 10,
  search = "",
): Promise<PaginatedResponse<Branch>> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (search) params.set("search", search);

  const res = await fetch(`/api/branch?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch branch");
  return res.json();
}

export async function getBranch(id: string): Promise<Branch> {
  const res = await fetch(`/api/branch/${id}`);
  if (!res.ok) throw new Error("Failed to fetch branch");
  return res.json();
}

export async function createBranch(payload: BranchForm): Promise<Branch> {
  const res = await fetch("/api/branch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create branch");
  return res.json();
}

export async function updateBranch(
  id: string,
  payload: Partial<BranchForm>,
): Promise<Branch> {
  const res = await fetch(`/api/branch/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update branch");
  return res.json();
}

export async function deleteBranch(id: string): Promise<void> {
  const res = await fetch(`/api/branch/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete branch");
}
