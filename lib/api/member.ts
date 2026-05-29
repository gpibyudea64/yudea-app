import type { Member, MemberForm } from "@/types/member";
import type { PaginatedResponse } from "@/types/shared";

export async function getMembers(
  page = 1,
  limit = 10,
  search = "",
): Promise<PaginatedResponse<Member>> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (search) params.set("search", search);

  const res = await fetch(`/api/member?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch members");
  return res.json();
}

export async function getMember(id: string): Promise<Member> {
  const res = await fetch(`/api/member/${id}`);
  if (!res.ok) throw new Error("Failed to fetch member");
  return res.json();
}

export async function createMember(payload: MemberForm): Promise<Member> {
  const res = await fetch("/api/member", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create member");
  return res.json();
}

export async function updateMember(
  id: string,
  payload: Partial<MemberForm>,
): Promise<Member> {
  const res = await fetch(`/api/member/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update member");
  return res.json();
}

export async function deleteMember(id: string): Promise<void> {
  const res = await fetch(`/api/member/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete member");
}
