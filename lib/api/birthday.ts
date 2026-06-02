import type { BirthdayMemberResponse } from "@/types/birthday";

export async function getBirthdayMembers(
  date?: string,
): Promise<BirthdayMemberResponse> {
  const params = new URLSearchParams();
  if (date) params.set("date", date);

  const url = `/api/birthday${params.toString() ? `?${params.toString()}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch birthday members");
  }
  return res.json();
}
