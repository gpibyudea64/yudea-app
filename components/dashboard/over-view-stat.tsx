import { GitBranch } from "lucide-react";
import { StatCard } from "./stat-card";

interface OverviewCounts {
  totalMembers: number;
  totalFamilies: number;
  totalRegions: number;
  totalBranches: number;
}

export default function OverviewStat({ counts }: { counts?: OverviewCounts }) {

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
          quantity={counts?.totalMembers ?? 0}
          title="Total Warga Jemaat"
          icon={<GitBranch className="h-5 w-5 text-blue-600" />}
        />
        <StatCard
          description="Total Kepala Keluarga"
          quantity={counts?.totalFamilies ?? 0}
          title="Total Kepala Keluarga"
          icon={<GitBranch className="h-5 w-5 text-blue-600" />}
        />
        <StatCard
          description="Total Sektor Pelayanan"
          quantity={counts?.totalRegions ?? 0}
          title="Total Sektor Pelayanan"
          icon={<GitBranch className="h-5 w-5 text-blue-600" />}
        />
      </div>
    </section>
  );
}
