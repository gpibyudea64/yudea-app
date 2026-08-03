import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";

/**
 * Generic hook for paginated list queries.
 */
export function useCrudList<T>(
  key: string,
  fetcher: () => Promise<T>,
  deps: unknown[],
  options?: Partial<UseQueryOptions<T>>,
) {
  return useQuery<T>({
    queryKey: [key, ...deps],
    queryFn: fetcher,
    staleTime: 30_000,
    ...options,
  });
}

/**
 * Generic hook for single-resource queries.
 */
export function useCrudOne<T>(
  key: string,
  id: string,
  fetcher: () => Promise<T>,
  options?: Partial<UseQueryOptions<T>>,
) {
  return useQuery<T>({
    queryKey: [key, id],
    queryFn: fetcher,
    enabled: !!id,
    staleTime: 60_000,
    ...options,
  });
}

/**
 * Factory that creates standard CRUD mutations (create, update, delete)
 * all sharing a single invalidation pattern.
 */
export function useCrudMutations<TData, TCreatePayload, TUpdatePayload>(
  key: string,
  {
    create,
    update,
    remove,
  }: {
    create?: (payload: TCreatePayload) => Promise<TData>;
    update?: (args: { id: string; data: TUpdatePayload }) => Promise<TData>;
    remove?: (id: string) => Promise<void>;
  },
) {
  const queryClient = useQueryClient();

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: [key], refetchType: "all" });
  }

  const createMutation = useMutation({
    mutationFn: create,
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: update,
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: remove,
    onSuccess: invalidate,
  });

  return { createMutation, updateMutation, deleteMutation };
}
