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

export function useAttendances(page = 1, limit = 10, search = "") {
  return useQuery({
    queryKey: [QUERY_KEY, page, limit, search],
    queryFn: () => getAttendances(page, limit, search),
    staleTime: 30_000,
  });
}

export function useAttendance(id: string) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => getAttendance(id),
    enabled: !!id,
    staleTime: 60_000,
  });
}

// ── mutations ─────────────────────────────────────────────

export function useCreateAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AttendanceForm) => createAttendance(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY], refetchType: "all" });
    },
  });
}

export function useUpdateAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AttendanceForm> }) =>
      updateAttendance(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY], refetchType: "all" });
    },
  });
}

export function useDeleteAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAttendance(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY], refetchType: "all" });
    },
  });
}
