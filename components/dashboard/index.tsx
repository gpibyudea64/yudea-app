import BranchStat from "./branch-stat";
import MemberStat from "./member-stat";
import RegionStat from "./region-stat";

export default function Dashboard() {
  return (
    <div className="flex flex-col gap-4">
      <BranchStat />
      <RegionStat />
      <MemberStat />
    </div>
  );
}
