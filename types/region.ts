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
  families?: any[];
  coordinator?: null;
};
