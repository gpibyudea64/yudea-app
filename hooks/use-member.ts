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
  sortBy = "firstName",
  sortOrder = "asc",
}: {
  page: number;
  limit: number;
  search?: string;
  region?: string;
  pelkat?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) {
  return useQuery({
    queryKey: [QUERY_KEY, page, limit, search, region, pelkat, sortBy, sortOrder],
    queryFn: () => getMembers(page, limit, search, region, pelkat, sortBy, sortOrder),
    staleTime: 30_000,
  });
}

export function useMember(id: string) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => getMember(id),
    enabled: !!id,
    staleTime: 60_000,
  });
}

export function useCreateMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: MemberForm) => createMember(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY], refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: ["family"], refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: ["birthday-members"], refetchType: "all" });
    },
  });
}

export function useUpdateMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MemberForm> }) =>
      updateMember(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY], refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: ["family"], refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: ["birthday-members"], refetchType: "all" });
    },
  });
}

export function useDeleteMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMember(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY], refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: ["family"], refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: ["birthday-members"], refetchType: "all" });
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
    staleTime: 30_000,
  });
}

export function useMembersGenderCount() {
  return useQuery({
    queryKey: ["member", "count", "gender"],
    queryFn: async (): Promise<MemberCount> => {
      const res = await fetch("/api/member/gender-count");
      if (!res.ok) throw new Error("Failed to fetch member counts");
      return res.json();
    },
    staleTime: 60_000,
  });
}

export function useMembersBloodTypeCount() {
  return useQuery({
    queryKey: ["member", "count", "blood-type"],
    queryFn: async (): Promise<BloodTypeCount> => {
      const res = await fetch("/api/member/blood-type-count");
      if (!res.ok) throw new Error("Failed to fetch member blood type counts");
      return res.json();
    },
    staleTime: 60_000,
  });
}

export function useAllPelkatCounts() {
  return useQuery({
    queryKey: ["member", "pelkat-count"],
    queryFn: async (): Promise<PelkatCount[]> => {
      const res = await fetch("/api/member/pelkat-count");
      if (!res.ok) throw new Error("Failed to fetch pelkat counts");
      return res.json();
    },
    staleTime: 60_000,
  });
}
