import { Users, Home, MapPin } from "lucide-react";
import { StatCard } from "./stat-card";

interface OverviewCounts {
  totalMembers: number;
  totalFamilies: number;
  totalRegions: number;
  totalBranches: number;
}

export default function OverviewStat({ counts }: { counts?: OverviewCounts }) {
  return (
    <section className="space-y-3 sm:space-y-4">
      <div className="px-1">
        <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground sm:text-xs">
          Wilayah Pelayanan Overview
        </p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight sm:mt-2 sm:text-2xl">
          Sektor Pelayanan per Wilayah
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        <StatCard
          description="Total Warga Jemaat"
          quantity={counts?.totalMembers ?? 0}
          title="Total Warga Jemaat"
          icon={<Users className="h-4 w-4 text-blue-600 sm:h-5 sm:w-5" />}
        />
        <StatCard
          description="Total Kepala Keluarga"
          quantity={counts?.totalFamilies ?? 0}
          title="Total Kepala Keluarga"
          icon={<Home className="h-4 w-4 text-blue-600 sm:h-5 sm:w-5" />}
        />
        <StatCard
          description="Total Sektor Pelayanan"
          quantity={counts?.totalRegions ?? 0}
          title="Total Sektor Pelayanan"
          icon={<MapPin className="h-4 w-4 text-blue-600 sm:h-5 sm:w-5" />}
        />
      </div>
    </section>
  );
}
