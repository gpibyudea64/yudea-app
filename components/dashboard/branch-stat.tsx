"use client";

import { StatCard } from "./stat-card";

export default function BranchStat() {
  const { data } = useBranchesCount();
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
      <StatCard
        description="Total Branch"
        quantity={data?.length ?? 0}
        title="Branches"
      />
      {data?.map((item) => (
        <StatCard
          key={item.id}
          description="Total Regions"
          quantity={item?.totalRegions}
          title={item.branchName}
        />
      ))}
    </div>
  );
}
