import { Attendance } from "@/app/generated/prisma/client";
import { AttendanceForm } from "@/types/attendance";
import { PaginatedResponse } from "@/types/shared";

export async function getAttendances(
  page = 1,
  limit = 10,
): Promise<PaginatedResponse<Attendance>> {
  const res = await fetch(`/api/attendance?page=${page}&limit=${limit}`);
  if (!res.ok) throw new Error("Failed to fetch attendance");
  return res.json();
}

export async function getAttendance(id: string): Promise<Attendance> {
  const res = await fetch(`/api/attendance/${id}`);
  if (!res.ok) throw new Error("Failed to fetch attendance");
  return res.json();
}

export async function createAttendance(
  payload: AttendanceForm,
): Promise<Attendance> {
  const res = await fetch("/api/attendance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create attendance");
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
  if (!res.ok) throw new Error("Failed to update attendance");
  return res.json();
}

export async function deleteAttendance(id: string): Promise<void> {
  const res = await fetch(`/api/attendance/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete attendance");
}
