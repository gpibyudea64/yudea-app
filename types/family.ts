import type { Region } from "./region";
import type { Member, MemberForm } from "./member";

export type Family = {
  id: string;
  familyName: string;
  address: string | null;
  provinsi: string | null;
  kotaKabupaten: string | null;
  kecamatan: string | null;
  kelurahan: string | null;
  regionId: string;
  createdAt: Date | string;
  region?: Region;
  members?: Member[];
};

export type FamilyForm = {
  familyName: string;
  address: string;
  provinsi: string;
  kotaKabupaten: string;
  kecamatan: string;
  kelurahan: string;
  regionId: string;
  members: MemberForm[];
};
