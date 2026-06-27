import { StatCard } from "./stat-card";
import { GitBranch } from "lucide-react";

export default function GenderStat({
  genderCounts,
}: {
  genderCounts?: { female: number; male: number };
}) {

  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
          Warga Jemaat Overview
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">Gender</h2>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
        <StatCard
          description="Total Warga Jemaat"
          quantity={genderCounts?.male ?? 0}
          title="Laki-laki"
          icon={<GitBranch className="h-5 w-5 text-blue-600" />}
        />
        <StatCard
          description="Total Perempuan"
          quantity={genderCounts?.female ?? 0}
          title="Perempuan"
          icon={<GitBranch className="h-5 w-5 text-blue-600" />}
        />
      </div>
    </section>
  );
}
