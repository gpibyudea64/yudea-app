import { Branch } from "./branch";

export type RegionForm = {
  name: string;
  branchId: string;
};

export type Region = {
  id: string;
  name: string;
  branchId: string;
  coordinatorMemberId: string | null;
  createdAt: Date;
  branch?: Branch;
  families?: unknown[];
  coordinator?: null;
};

export type RegionMemberCount = {
  regionId: string;
  regionName: string;
  memberCount: number;
};
