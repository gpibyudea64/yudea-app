"use client";

import { GitBranch } from "lucide-react";
import { StatCard } from "./stat-card";
import { useMembers } from "@/hooks/use-member";
import { useFamilies } from "@/hooks/use-family";
import { useRegions } from "@/hooks/use-region";

export default function OverviewStat() {
  const { data: membersData } = useMembers(1, 999);
  const { data: familiesData } = useFamilies(1, 999);
  const { data: regionsData } = useRegions(1, 999);

  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
          Wilayah Pelayanan Overview
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">
          Sektor Pelayanan per Wilayah
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
        <StatCard
          description="Total Warga Jemaat"
          quantity={membersData?.meta.total ?? 0}
          title="Total Warga Jemaat "
          icon={<GitBranch className="h-5 w-5 text-blue-600" />}
        />
        <StatCard
          description="Total Kepala Keluarga"
          quantity={familiesData?.meta.total ?? 0}
          title="Total kepala Keluarga"
          icon={<GitBranch className="h-5 w-5 text-blue-600" />}
        />
        <StatCard
          description="Total Sektor Pelayanan"
          quantity={regionsData?.meta.total ?? 0}
          title="Total Sektor Pelayanan"
          icon={<GitBranch className="h-5 w-5 text-blue-600" />}
        />
      </div>
    </section>
  );
}
