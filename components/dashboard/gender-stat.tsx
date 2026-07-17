import { User, UserCheck } from "lucide-react";
import { StatCard } from "./stat-card";

export default function GenderStat({
  genderCounts,
}: {
  genderCounts?: { female: number; male: number };
}) {
  return (
    <section className="space-y-3 sm:space-y-4">
      <div className="px-1">
        <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground sm:text-xs">
          Warga Jemaat Overview
        </p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight sm:mt-2 sm:text-2xl">
          Gender
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        <StatCard
          description="Total Laki-laki"
          quantity={genderCounts?.male ?? 0}
          title="Laki-laki"
          icon={<User className="h-4 w-4 text-blue-600 sm:h-5 sm:w-5" />}
        />
        <StatCard
          description="Total Perempuan"
          quantity={genderCounts?.female ?? 0}
          title="Perempuan"
          icon={<UserCheck className="h-4 w-4 text-pink-600 sm:h-5 sm:w-5" />}
        />
      </div>
    </section>
  );
}
