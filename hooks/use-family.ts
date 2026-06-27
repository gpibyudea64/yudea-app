import {
  createFamily,
  deleteFamily,
  getFamilies,
  getFamily,
  updateFamily,
} from "@/lib/api/family";
import { FamilyForm } from "@/types/family";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const QUERY_KEY = "family";

// ── queries ───────────────────────────────────────────────

export function useFamilies(
  page = 1,
  limit = 10,
  search = "",
  sortBy = "familyName",
  sortOrder: "asc" | "desc" = "asc",
) {
  return useQuery({
    queryKey: [QUERY_KEY, page, limit, search, sortBy, sortOrder],
    queryFn: () => getFamilies(page, limit, search, sortBy, sortOrder),
    staleTime: 30_000,
  });
}

export function useFamily(id: string) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => getFamily(id),
    enabled: !!id,
    staleTime: 60_000,
  });
}

// ── mutations ─────────────────────────────────────────────

export function useCreateFamily() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: FamilyForm) => createFamily(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useUpdateFamily() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FamilyForm> }) =>
      updateFamily(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useDeleteFamily() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFamily(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}
