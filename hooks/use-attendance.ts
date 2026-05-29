import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAttendance,
  deleteAttendance,
  getAttendance,
  getAttendances,
  updateAttendance,
} from "@/lib/api/attendance";
import { AttendanceForm } from "@/types/attendance";

const QUERY_KEY = "attendance";

// ── queries ───────────────────────────────────────────────

export function useAttendances(page = 1, limit = 10) {
  return useQuery({
    queryKey: [QUERY_KEY, page, limit],
    queryFn: () => getAttendances(page, limit),
  });
}

export function useAttendance(id: string) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => getAttendance(id),
    enabled: !!id,
  });
}

// ── mutations ─────────────────────────────────────────────

export function useCreateAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AttendanceForm) => createAttendance(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useUpdateAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AttendanceForm> }) =>
      updateAttendance(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useDeleteAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAttendance(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}
