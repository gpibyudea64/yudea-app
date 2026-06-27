import { StatCard } from "./stat-card";
import { formatPelkatName } from "@/lib/client-helper";

export default function MemberStat({
  pelkatCounts,
}: {
  pelkatCounts?: Array<{ pelkat: string; total: number }>;
}) {

  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
          Member Overview
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">
          Member totals and pelkat distribution
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {pelkatCounts?.map((pelkat) => (
          <StatCard
            key={pelkat.pelkat}
            description="Warga Jemaat in this pelkat"
            quantity={pelkat.total}
            title={formatPelkatName(pelkat.pelkat)}
          />
        ))}
      </div>
    </section>
  );
}
