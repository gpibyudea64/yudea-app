"use client";

import { useAllPelkatCounts, useMembersCount } from "@/services/member";
import { Mars, Users, Venus } from "lucide-react";
import { StatCard } from "./stat-card";

export default function MemberStat() {
  const { data: dataMember } = useMembersCount();
  const { data: pelkatCounts } = useAllPelkatCounts();

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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          description="Total members across the church"
          quantity={dataMember?.all ?? 0}
          title="All Members"
          icon={<Users className="h-5 w-5 text-blue-600" />}
        />
        <StatCard
          description="Total female members"
          quantity={dataMember?.female ?? 0}
          title="Female Members"
          icon={<Venus className="h-5 w-5 text-pink-600" />}
        />
        <StatCard
          description="Total male members"
          quantity={dataMember?.male ?? 0}
          title="Male Members"
          icon={<Mars className="h-5 w-5 text-blue-600" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {pelkatCounts?.map((pelkat) => (
          <StatCard
            key={pelkat.pelkat}
            description="Members in this pelkat"
            quantity={pelkat.total}
            title={pelkat.pelkat}
          />
        ))}
      </div>
    </section>
  );
}
