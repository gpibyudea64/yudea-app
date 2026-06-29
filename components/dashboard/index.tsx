"use client";

import { useQuery } from "@tanstack/react-query";
import OverviewStat from "./over-view-stat";
import MemberStat from "./member-stat";
import GenderStat from "./gender-stat";
import BloodTypeStat from "./blood-type-stat";
import RegionTable from "./region-table";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface DashboardData {
  totalMembers: number;
  totalFamilies: number;
  totalRegions: number;
  totalBranches: number;
  genderCounts: { female: number; male: number };
  bloodTypeCounts: { A: number; B: number; AB: number; O: number };
  pelkatCounts: Array<{ pelkat: string; total: number }>;
}

export default function Dashboard() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/public/login");
    }
  }, [status, router]);

  const { data } = useQuery<DashboardData>({
    queryKey: ["dashboard", "counts"],
    queryFn: () => fetch("/api/dashboard/counts").then((r) => r.json()),
    staleTime: 60_000,
    enabled: status === "authenticated",
  });

  if (status === "loading" || status === "unauthenticated") return null;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto space-y-8 px-4 py-8">
        <div className="space-y-1">
          <h1 className="bg-linear-to-r from-slate-900 to-slate-700 bg-clip-text text-3xl font-bold text-transparent dark:from-slate-100 dark:to-slate-300">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Overview of Wilayah Pelayanan, regions, Keluarga, and Warga Jemaat
          </p>
        </div>

        <OverviewStat counts={data} />
        <GenderStat genderCounts={data?.genderCounts} />
        <BloodTypeStat bloodTypeCounts={data?.bloodTypeCounts} />
        <MemberStat pelkatCounts={data?.pelkatCounts} />
        <RegionTable />
      </div>
    </div>
  );
}
