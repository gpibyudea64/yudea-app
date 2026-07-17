import { Droplets } from "lucide-react";
import { StatCard } from "./stat-card";

export default function BloodTypeStat({
  bloodTypeCounts,
}: {
  bloodTypeCounts?: { A: number; B: number; AB: number; O: number };
}) {
  return (
    <section className="space-y-3 sm:space-y-4">
      <div className="px-1">
        <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground sm:text-xs">
          Warga Jemaat Overview
        </p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight sm:mt-2 sm:text-2xl">
          Golongan Darah
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <StatCard
          description="Golongan Darah"
          quantity={bloodTypeCounts?.A ?? 0}
          title="A"
          icon={<Droplets className="h-4 w-4 text-red-500 sm:h-5 sm:w-5" />}
        />
        <StatCard
          description="Golongan Darah"
          quantity={bloodTypeCounts?.B ?? 0}
          title="B"
          icon={<Droplets className="h-4 w-4 text-red-500 sm:h-5 sm:w-5" />}
        />
        <StatCard
          description="Golongan Darah"
          quantity={bloodTypeCounts?.AB ?? 0}
          title="AB"
          icon={<Droplets className="h-4 w-4 text-red-500 sm:h-5 sm:w-5" />}
        />
        <StatCard
          description="Golongan Darah"
          quantity={bloodTypeCounts?.O ?? 0}
          title="O"
          icon={<Droplets className="h-4 w-4 text-red-500 sm:h-5 sm:w-5" />}
        />
      </div>
    </section>
  );
}
