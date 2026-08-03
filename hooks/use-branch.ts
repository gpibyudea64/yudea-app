import {
  createBranch,
  deleteBranch,
  getBranch,
  getBranches,
  updateBranch,
} from "@/lib/api/branch";
import { BranchForm } from "@/types/branch";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const QUERY_KEY = "branch";

// ── queries ───────────────────────────────────────────────

export function useBranches(page = 1, limit = 10, search = "") {
  return useQuery({
    queryKey: [QUERY_KEY, page, limit, search],
    queryFn: () => getBranches(page, limit, search),
    staleTime: 30_000,
  });
}

export function useBranch(id: string) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => getBranch(id),
    enabled: !!id,
    staleTime: 60_000,
  });
}

// ── mutations ─────────────────────────────────────────────

export function useCreateBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BranchForm) => createBranch(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY], refetchType: "all" });
    },
  });
}

export function useUpdateBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BranchForm> }) =>
      updateBranch(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY], refetchType: "all" });
    },
  });
}

export function useDeleteBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBranch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY], refetchType: "all" });
    },
  });
}
