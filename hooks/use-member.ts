import {
  createMember,
  deleteMember,
  getMember,
  getMembers,
  getPresbyters,
  updateMember,
} from "@/lib/api/member";
import type {
  BloodTypeCount,
  MemberCount,
  MemberForm,
  PelkatCount,
} from "@/types/member";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const QUERY_KEY = "member";

export function useMembers({
  page = 1,
  limit = 10,
  search = "",
  region = "all",
  pelkat = "all",
}: {
  page: number;
  limit: number;
  search?: string;
  region?: string;
  pelkat?: string;
}) {
  return useQuery({
    queryKey: [QUERY_KEY, page, limit, search, region, pelkat],
    queryFn: () => getMembers(page, limit, search, region, pelkat),
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

export function usePresbyters({
  page = 1,
  limit = 10,
  search = "",
  region = "all",
}: {
  page: number;
  limit: number;
  search: string;
  region: string;
}) {
  return useQuery({
    queryKey: [QUERY_KEY, page, limit, search, region],
    queryFn: () => getPresbyters(page, limit, search, region),
  });
}

export function useMembersGenderCount() {
  return useQuery({
    queryKey: [QUERY_KEY, "count"],
    queryFn: async (): Promise<MemberCount> => {
      const res = await fetch("/api/member/gender-count");
      if (!res.ok) throw new Error("Failed to fetch member counts");
      return res.json();
    },
  });
}

export function useMembersBloodTypeCount() {
  return useQuery({
    queryKey: [QUERY_KEY, "count"],
    queryFn: async (): Promise<BloodTypeCount> => {
      const res = await fetch("/api/member/blood-type-count");
      if (!res.ok) throw new Error("Failed to fetch member blood type counts");
      return res.json();
    },
  });
}

export function useAllPelkatCounts() {
  return useQuery({
    queryKey: [QUERY_KEY, "pelkat-count"],
    queryFn: async (): Promise<PelkatCount[]> => {
      const res = await fetch("/api/member/pelkat-count");
      if (!res.ok) throw new Error("Failed to fetch pelkat counts");
      return res.json();
    },
  });
}
