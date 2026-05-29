import {
  createMember,
  deleteMember,
  getMember,
  getMembers,
  updateMember,
} from "@/lib/api/member";
import type { MemberForm } from "@/types/member";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const QUERY_KEY = "member";

export function useMembers(page = 1, limit = 10, search = "") {
  return useQuery({
    queryKey: [QUERY_KEY, page, limit, search],
    queryFn: () => getMembers(page, limit, search),
  });
}

export function useMember(id: string) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => getMember(id),
    enabled: !!id,
  });
}

export function useCreateMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: MemberForm) => createMember(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ["family"] });
    },
  });
}

export function useUpdateMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MemberForm> }) =>
      updateMember(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ["family"] });
    },
  });
}

export function useDeleteMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMember(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ["family"] });
    },
  });
}
