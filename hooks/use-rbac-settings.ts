import {
  fetchRoleAccessConfig,
  saveRoleAccessConfig,
} from "@/lib/api/rbac-settings";
import type { RoleAccessConfig } from "@/lib/rbac";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const QUERY_KEY = "rbac-settings";

export function useRoleAccessSettings() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: fetchRoleAccessConfig,
  });
}

export function useSaveRoleAccessSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (config: RoleAccessConfig) => saveRoleAccessConfig(config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY], refetchType: "all" });
    },
  });
}
