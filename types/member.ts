import type { Family } from "./family";

export type Gender = "MALE" | "FEMALE";

export type MemberRole =
  | "FAMILY_HEAD"
  | "WIFE"
  | "CHILD"
  | "OTHER"
  | "ORANG_TUA"
  | "CUCU"
  | "KAKAK_ADIK_KANDUNG"
  | "FAMILI_LAIN";

export type MemberPelkat =
  | "PELAYANAN_ANAK"
  | "PERSEKUTUAN_TARUNA"
  | "GERAKAN_PEMUDA"
  | "PERSEKUTUAN_KAUM_BAPAK"
  | "PERSEKUTUAN_KAUM_PEREMPUAN"
  | "PERSEKUTUAN_KAUM_LANJUT_USIA";

export type BaptisStatus = "SUDAH" | "BELUM";
export type SidiStatus = "SUDAH" | "BELUM";
export type PerkawinanStatus = "BELUM_MENIKAH" | "JANDA" | "DUDA" | "MENIKAH";
export type Jabatan =
  | "WARGA_JEMAAT"
  | "DIAKEN"
  | "PENATUA"
  | "PENGURUS_PELKAT"
  | "PENGURUS_KOMISI";

export type Member = {
  id: string;
  firstName: string;
  lastName: string | null;
  birthCity: string;
  gender: Gender;
  birthDate: Date | string;
  phone: string;
  email: string | null;
  role: MemberRole;
  childNumber: number | null;
  sameAddressAsFamily: boolean;
  memberAddress: string | null;
  memberProvinsi: string | null;
  memberKotaKabupaten: string | null;
  memberKecamatan: string | null;
  memberKelurahan: string | null;
  // Baptis
  statusBaptis?: BaptisStatus | null;
  lokasiBaptis?: string | null;
  tanggalBaptis?: Date | string | null;
  // Sidi
  statusSidi?: SidiStatus | null;
  lokasiSidi?: string | null;
  tanggalSidi?: Date | string | null;
  // Perkawinan
  statusPerkawinan?: PerkawinanStatus | null;
  lokasiPemberkatanGereja?: string | null;
  tanggalPemberkatanGereja?: Date | string | null;
  lokasiPerkawinanSipil?: string | null;
  tanggalPerkawinanSipil?: Date | string | null;
  // Other
  jabatan?: Jabatan | null;
  gerejaAsal?: string | null;
  pendidikanTerakhir?: string | null;
  pekerjaan?: string | null;
  tahunDaftar?: string | null;
  pengalamanGereja?: string | null;
  pengalamanOrganisasi?: string | null;
  keteranganLain?: string | null;
  isActive: boolean;
  isDeceased: boolean;
  deathDate: Date | string | null;
  tanggalPindah?: Date | string | null;
  familyId: string;
  createdAt: Date | string;
  family?: Family;
  pelkat?: MemberPelkat;
};

export type MemberForm = {
  firstName: string;
  lastName: string;
  birthCity: string;
  gender: Gender;
  birthDate: string;
  phone: string;
  email: string;
  role: MemberRole;
  childNumber: number;
  sameAddressAsFamily: boolean;
  memberAddress: string;
  memberProvinsi: string;
  memberKotaKabupaten: string;
  memberKecamatan: string;
  memberKelurahan: string;
  // Baptis
  statusBaptis: BaptisStatus;
  lokasiBaptis: string;
  tanggalBaptis: string;
  // Sidi
  statusSidi: SidiStatus;
  lokasiSidi: string;
  tanggalSidi: string;
  // Perkawinan
  statusPerkawinan: PerkawinanStatus;
  lokasiPemberkatanGereja: string;
  tanggalPemberkatanGereja: string;
  lokasiPerkawinanSipil: string;
  tanggalPerkawinanSipil: string;
  // Other
  jabatan: Jabatan | "";
  gerejaAsal: string;
  pendidikanTerakhir: string;
  pekerjaan: string;
  tahunDaftar: string;
  pengalamanGereja: string;
  pengalamanOrganisasi: string;
  keteranganLain: string;
  isActive: boolean;
  isDeceased: boolean;
  deathDate: string;
  tanggalPindah: string;
  familyId: string;
};

export const genderOptions: Array<{ label: string; value: Gender }> = [
  { label: "Laki-laki", value: "MALE" },
  { label: "Perempuan", value: "FEMALE" },
];

export const memberRoleOptions: Array<{ label: string; value: MemberRole }> = [
  { label: "Kepala Keluarga", value: "FAMILY_HEAD" },
  { label: "Istri", value: "WIFE" },
  { label: "Anak", value: "CHILD" },
  { label: "Orang Tua", value: "ORANG_TUA" },
  { label: "Cucu", value: "CUCU" },
  { label: "Kakak/Adik Kandung", value: "KAKAK_ADIK_KANDUNG" },
  { label: "Famili Lain", value: "FAMILI_LAIN" },
  { label: "Lainnya", value: "OTHER" },
];

export const baptisStatusOptions: Array<{ label: string; value: BaptisStatus }> = [
  { label: "Sudah", value: "SUDAH" },
  { label: "Belum", value: "BELUM" },
];

export const sidiStatusOptions: Array<{ label: string; value: SidiStatus }> = [
  { label: "Sudah", value: "SUDAH" },
  { label: "Belum", value: "BELUM" },
];

export const perkawinanStatusOptions: Array<{ label: string; value: PerkawinanStatus }> = [
  { label: "Belum Menikah", value: "BELUM_MENIKAH" },
  { label: "Janda", value: "JANDA" },
  { label: "Duda", value: "DUDA" },
  { label: "Menikah", value: "MENIKAH" },
];

export const jabatanOptions: Array<{ label: string; value: Jabatan }> = [
  { label: "Warga Jemaat", value: "WARGA_JEMAAT" },
  { label: "Diaken", value: "DIAKEN" },
  { label: "Penatua", value: "PENATUA" },
  { label: "Pengurus PELKAT", value: "PENGURUS_PELKAT" },
  { label: "Pengurus Komisi", value: "PENGURUS_KOMISI" },
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
