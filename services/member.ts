import { MemberPelkat } from "@/app/generated/prisma/enums";
import { useQuery } from "@tanstack/react-query";

type MemberCount = {
  all: number;
  female: number;
  male: number;
};

type PelkatCount = {
  pelkat: MemberPelkat;
  total: number;
};

export function useMembersGenderCount() {
  return useQuery({
    queryKey: ["member", "count"],
    queryFn: async (): Promise<MemberCount> => {
      const res = await fetch("/api/member/gender-count");
      if (!res.ok) throw new Error("Failed to fetch member counts");
      return res.json();
    },
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
  });
}
