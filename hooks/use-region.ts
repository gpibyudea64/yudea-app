import {
  createRegion,
  deleteRegion,
  getRegion,
  getRegionMemberCounts,
  getRegions,
  updateRegion,
} from "@/lib/api/region";
import { RegionForm } from "@/types/region";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const QUERY_KEY = "region";

// ── queries ───────────────────────────────────────────────

export function useRegions(
  page = 1,
  limit = 10,
  search = "",
  sortBy = "name",
  sortOrder: "asc" | "desc" = "asc",
) {
  return useQuery({
    queryKey: [QUERY_KEY, page, limit, search, sortBy, sortOrder],
    queryFn: () => getRegions(page, limit, search, sortBy, sortOrder),
    staleTime: 30_000,
  });
}

export function useRegion(id: string) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => getRegion(id),
    enabled: !!id,
    staleTime: 60_000,
  });
}

export function useMemberPerRegions() {
  return useQuery({
    queryKey: [QUERY_KEY, "member-count"],
    queryFn: () => getRegionMemberCounts(),
    staleTime: 60_000,
  });
}

// ── mutations ─────────────────────────────────────────────

export function useCreateRegion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RegionForm) => createRegion(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY], refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: ["birthday-members"], refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: ["dashboard"], refetchType: "all" });
    },
  });
}

export function useUpdateRegion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<RegionForm> }) =>
      updateRegion(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY], refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: ["birthday-members"], refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: ["dashboard"], refetchType: "all" });
    },
  });
}

export function useDeleteRegion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteRegion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY], refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: ["birthday-members"], refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: ["dashboard"], refetchType: "all" });
    },
  });
}
