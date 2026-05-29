"use client";

import { useRegionsCount } from "@/services/region";
import { StatCard } from "./stat-card";

export default function RegionStat() {
  const { data } = useRegionsCount();
  const totalFamilies = data?.reduce(
    (sum, region) => sum + (region.totalFamilies ?? 0),
    0,
  );

  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
          Region Overview
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">
          Families in every region
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard
          description="Total regions"
          quantity={data?.length ?? 0}
          title="All Regions"
        />
        <StatCard
          description="Total families across all regions"
          quantity={totalFamilies ?? 0}
          title="All Families"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {data?.map((item) => (
          <StatCard
            key={item.id}
            description="Families in this region"
            quantity={item?.totalFamilies ?? 0}
            title={item.regionName}
          />
        ))}
      </div>
    </section>
  );
}
