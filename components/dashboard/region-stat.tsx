"use client";

import { useRegions } from "@/hooks/use-region";
import { MapPin } from "lucide-react";
import { StatCard } from "./stat-card";

export default function RegionStat() {
  const { data } = useRegions(1, 999);
  const regions = data?.data ?? [];
  const totalFamilies = regions.reduce(
    (sum, region) => sum + (region.families?.length ?? 0),
    0,
  );

  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
          Sektor Pelayanan Overview
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">
          Keluarga in every Sektor Pelayanan
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard
          description="Total regions"
          quantity={data?.meta.total ?? 0}
          title="All Regions"
          icon={<MapPin className="h-5 w-5 text-blue-600" />}
        />
        <StatCard
          description="Total Keluarga across all regions"
          quantity={totalFamilies ?? 0}
          title="All Keluarga"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {regions.map((item) => (
          <StatCard
            key={item.id}
            description="Keluarga in this Sektor Pelayanan"
            quantity={item.families?.length ?? 0}
            title={item.name}
          />
        ))}
      </div>
    </section>
  );
}
