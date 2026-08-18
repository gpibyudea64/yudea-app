import type { AttendanceForm } from "@/types/attendance";
import type { PaginatedResponse } from "@/types/shared";
import { Attendance } from "@prisma/client";

export async function getAttendances(
  page = 1,
  limit = 10,
  search = "",
  sortBy = "serviceDate",
  sortOrder: "asc" | "desc" = "desc",
): Promise<PaginatedResponse<Attendance>> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    sortBy,
    sortOrder,
  });
  if (search) params.set("search", search);

  const res = await fetch(`/api/attendance?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch attendance");
  return res.json();
}

export async function getAttendance(id: string): Promise<Attendance> {
  const res = await fetch(`/api/attendance/${id}`);
  if (!res.ok) throw new Error("Failed to fetch attendance");
  return res.json();
}

/**
 * Reads the `{ error }` message from a failed API response so callers can
 * surface e.g. the 409 duplicate-attendance message instead of a generic error.
 */
async function getApiErrorMessage(res: Response, fallback: string) {
  try {
    const body = (await res.json()) as { error?: unknown };
    if (typeof body?.error === "string" && body.error) return body.error;
  } catch {
    // Response body was not JSON — fall through to the generic message.
  }
  return fallback;
}

export async function createAttendance(
  payload: AttendanceForm,
): Promise<Attendance> {
  const res = await fetch("/api/attendance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await getApiErrorMessage(res, "Failed to create attendance"));
  return res.json();
}

export async function updateAttendance(
  id: string,
  payload: Partial<AttendanceForm>,
): Promise<Attendance> {
  const res = await fetch(`/api/attendance/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await getApiErrorMessage(res, "Failed to update attendance"));
  return res.json();
}

export async function deleteAttendance(id: string): Promise<void> {
  const res = await fetch(`/api/attendance/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete attendance");
}
