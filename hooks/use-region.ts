import {
  createRegion,
  deleteRegion,
  getRegion,
  getRegions,
  updateRegion,
} from "@/lib/api/region";
import { RegionForm } from "@/types/region";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const QUERY_KEY = "region";

// ── queries ───────────────────────────────────────────────

export function useRegions(page = 1, limit = 10, search = "") {
  return useQuery({
    queryKey: [QUERY_KEY, page, limit, search],
    queryFn: () => getRegions(page, limit, search),
  });
}

export function useRegion(id: string) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => getRegion(id),
    enabled: !!id,
  });
}

// ── mutations ─────────────────────────────────────────────

export function useCreateRegion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RegionForm) => createRegion(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useUpdateRegion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<RegionForm> }) =>
      updateRegion(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useDeleteRegion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteRegion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}
