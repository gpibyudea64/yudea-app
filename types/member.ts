import type { Family } from "./family";

export type Gender = "MALE" | "FEMALE";

export type MemberRole = "FAMILY_HEAD" | "WIFE" | "CHILD" | "OTHER";

export type MemberPelkat =
  | "PELAYANAN_ANAK"
  | "PERSEKUTUAN_TARUNA"
  | "GERAKAN_PEMUDA"
  | "PERSEKUTUAN_KAUM_BAPAK"
  | "PERSEKUTUAN_KAUM_PEREMPUAN"
  | "PERSEKUTUAN_KAUM_LANJUT_USIA";

export type Member = {
  id: string;
  name: string;
  gender: Gender;
  birthDate: Date | string;
  phone: string | null;
  email: string | null;
  role: MemberRole;
  isActive: boolean;
  isDeceased: boolean;
  deathDate: Date | string | null;
  familyId: string;
  createdAt: Date | string;
  family?: Family;
  pelkat?: MemberPelkat;
};

export type MemberForm = {
  name: string;
  gender: Gender;
  birthDate: string;
  phone: string;
  email: string;
  role: MemberRole;
  isActive: boolean;
  isDeceased: boolean;
  deathDate: string;
  familyId?: string;
  isPresbyter?: boolean;
};

export const genderOptions: Array<{ label: string; value: Gender }> = [
  { label: "Male", value: "MALE" },
  { label: "Female", value: "FEMALE" },
];

export const memberRoleOptions: Array<{ label: string; value: MemberRole }> = [
  { label: "Family Head", value: "FAMILY_HEAD" },
  { label: "Wife", value: "WIFE" },
  { label: "Child", value: "CHILD" },
  { label: "Other", value: "OTHER" },
];

export type MemberCount = {
  all: number;
  female: number;
  male: number;
};

export type BloodTypeCount = {
  A: number;
  B: number;
  AB: number;
  O: number;
};

export type PelkatCount = {
  pelkat: MemberPelkat;
  total: number;
};
