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

export function useBranches(page = 1, limit = 10) {
  return useQuery({
    queryKey: [QUERY_KEY, page, limit],
    queryFn: () => getBranches(page, limit),
  });
}

export function useBranch(id: string) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => getBranch(id),
    enabled: !!id,
  });
}

// ── mutations ─────────────────────────────────────────────

export function useCreateBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BranchForm) => createBranch(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useUpdateBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BranchForm> }) =>
      updateBranch(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useDeleteBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBranch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}
