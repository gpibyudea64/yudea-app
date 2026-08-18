import type { PaginatedResponse } from "@/types/shared";
import type { UserForm, UserListItem } from "@/types/user";

export async function getUsers(
  page = 1,
  limit = 10,
  search = "",
  sortBy = "email",
  sortOrder: "asc" | "desc" = "asc",
): Promise<PaginatedResponse<UserListItem>> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    sortBy,
    sortOrder,
  });
  if (search) params.set("search", search);

  const res = await fetch(`/api/user?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}

export async function createUser(payload: UserForm): Promise<UserListItem> {
  const res = await fetch("/api/user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "Failed to create user");
  }
  return res.json();
}

export async function updateUser(
  id: string,
  payload: Partial<UserForm>,
): Promise<UserListItem> {
  const res = await fetch(`/api/user/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "Failed to update user");
  }
  return res.json();
}

export async function deleteUser(id: string): Promise<void> {
  const res = await fetch(`/api/user/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "Failed to delete user");
  }
}
