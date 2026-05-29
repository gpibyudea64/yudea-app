"use client";

import { useBranches } from "@/hooks/use-branch";
import { GitBranch } from "lucide-react";
import { StatCard } from "./stat-card";

export default function BranchStat() {
  const { data } = useBranches(1, 999);
  const branches = data?.data ?? [];

  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
          Branch Overview
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">
          Regions across each branch
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
        <StatCard
          description="Total branch records"
          quantity={data?.meta.total ?? 0}
          title="All Branches"
          icon={<GitBranch className="h-5 w-5 text-blue-600" />}
        />
        {branches.map((item) => (
          <StatCard
            key={item.id}
            description="Regions in this branch"
            quantity={item.regions?.length ?? 0}
            title={item.name}
          />
        ))}
      </div>
    </section>
  );
}
