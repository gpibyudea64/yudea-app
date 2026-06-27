import { StatCard } from "./stat-card";
import { GitBranch } from "lucide-react";

export default function BloodTypeStat({
  bloodTypeCounts,
}: {
  bloodTypeCounts?: { A: number; B: number; AB: number; O: number };
}) {

  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
          Warga Jemaat Overview
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">
          Golongan Darah
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
        <StatCard
          description="Total Warga Jemaat"
          quantity={bloodTypeCounts?.A ?? 0}
          title="A"
          icon={<GitBranch className="h-5 w-5 text-blue-600" />}
        />
        <StatCard
          description="Total Perempuan"
          quantity={bloodTypeCounts?.B ?? 0}
          title="B"
          icon={<GitBranch className="h-5 w-5 text-blue-600" />}
        />
        <StatCard
          description="Total Laki-laki"
          quantity={bloodTypeCounts?.AB ?? 0}
          title="AB"
          icon={<GitBranch className="h-5 w-5 text-blue-600" />}
        />
        <StatCard
          description="Total Laki-laki"
          quantity={bloodTypeCounts?.O ?? 0}
          title="O"
          icon={<GitBranch className="h-5 w-5 text-blue-600" />}
        />
      </div>
    </section>
  );
}
