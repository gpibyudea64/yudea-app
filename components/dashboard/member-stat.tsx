import { Users } from "lucide-react";
import { StatCard } from "./stat-card";
import { formatPelkatName } from "@/lib/client-helper";

export default function MemberStat({
  pelkatCounts,
}: {
  pelkatCounts?: Array<{ pelkat: string; total: number }>;
}) {
  return (
    <section className="space-y-3 sm:space-y-4">
      <div className="px-1">
        <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground sm:text-xs">
          Member Overview
        </p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight sm:mt-2 sm:text-2xl">
          Pelkat Distribution
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {pelkatCounts?.map((pelkat) => (
          <StatCard
            key={pelkat.pelkat}
            description="Warga Jemaat in this pelkat"
            quantity={pelkat.total}
            title={formatPelkatName(pelkat.pelkat)}
            icon={<Users className="h-4 w-4 text-blue-600 sm:h-5 sm:w-5" />}
          />
        ))}
      </div>
    </section>
  );
}
