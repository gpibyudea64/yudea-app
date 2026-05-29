import BranchStat from "./branch-stat";
import MemberStat from "./member-stat";
import RegionStat from "./region-stat";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto space-y-8 px-4 py-8">
        <div className="space-y-1">
          <h1 className="bg-linear-to-r from-slate-900 to-slate-700 bg-clip-text text-3xl font-bold text-transparent dark:from-slate-100 dark:to-slate-300">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Overview of branches, regions, families, and members
          </p>
        </div>

        <BranchStat />
        <RegionStat />
        <MemberStat />
      </div>
    </div>
  );
}
