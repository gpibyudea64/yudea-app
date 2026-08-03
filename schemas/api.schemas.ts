import { z } from "zod";
import {
  Gender,
  MemberRole,
  BaptisStatus,
  SidiStatus,
  PerkawinanStatus,
  Jabatan,
} from "@prisma/client";

// ── Prisma-native Zod enums ────────────────────────────
// Using z.nativeEnum() so that Zod-inferred types match
// what Prisma expects — no more "as never" casts needed
// for these fields in route handlers.

const genderSchema = z.nativeEnum(Gender);
const memberRoleSchema = z.nativeEnum(MemberRole);
const baptisStatusSchema = z.nativeEnum(BaptisStatus);
const sidiStatusSchema = z.nativeEnum(SidiStatus);
const perkawinanStatusSchema = z.nativeEnum(PerkawinanStatus);

// ── Member ──────────────────────────────────────────────

export const createMemberSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional().default(""),
  birthCity: z.string().min(1, "Birth city is required"),
  gender: genderSchema,
  birthDate: z.string().min(1, "Birth date is required"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().optional().default(""),
  role: memberRoleSchema,
  childNumber: z.coerce.number().int().min(0).optional().default(0),
  sameAddressAsFamily: z.boolean().optional().default(true),
  memberAddress: z.string().optional().default(""),
  memberProvinsi: z.string().optional().default(""),
  memberKotaKabupaten: z.string().optional().default(""),
  memberKecamatan: z.string().optional().default(""),
  memberKelurahan: z.string().optional().default(""),
  statusBaptis: baptisStatusSchema.optional().default("BELUM"),
  lokasiBaptis: z.string().optional().default(""),
  tanggalBaptis: z.string().optional().default(""),
  statusSidi: sidiStatusSchema.optional().default("BELUM"),
  lokasiSidi: z.string().optional().default(""),
  tanggalSidi: z.string().optional().default(""),
  statusPerkawinan: perkawinanStatusSchema.optional().default("BELUM_MENIKAH"),
  lokasiPemberkatanGereja: z.string().optional().default(""),
  tanggalPemberkatanGereja: z.string().optional().default(""),
  lokasiPerkawinanSipil: z.string().optional().default(""),
  tanggalPerkawinanSipil: z.string().optional().default(""),
  jabatan: z.union([z.nativeEnum(Jabatan), z.literal("")]).optional().default(""),
  gerejaAsal: z.string().optional().default(""),
  pendidikanTerakhir: z.string().optional().default(""),
  pekerjaan: z.string().optional().default(""),
  tahunDaftar: z.string().optional().default(""),
  pengalamanGereja: z.string().optional().default(""),
  pengalamanOrganisasi: z.string().optional().default(""),
  keteranganLain: z.string().optional().default(""),
  isActive: z.boolean().optional().default(true),
  isDeceased: z.boolean().optional().default(false),
  deathDate: z.string().optional().default(""),
  tanggalPindah: z.string().optional().default(""),
  familyId: z.string().min(1, "Family is required"),
});

/**
 * Schema for updating a member (PATCH /api/member/:id).
 *
 * ⚠️  Deliberately defined separately from createMemberSchema — using
 * `.partial()` on a schema with `.default()` values would cause absent
 * fields to be populated with defaults, silently overwriting existing data.
 * Every field here is a bare `.optional()` (no `.default()`) so that
 * omitted keys remain `undefined` and the handler can skip them.
 */
export const updateMemberSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  birthCity: z.string().optional(),
  gender: genderSchema.optional(),
  birthDate: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  role: memberRoleSchema.optional(),
  childNumber: z.coerce.number().int().min(0).optional(),
  sameAddressAsFamily: z.boolean().optional(),
  memberAddress: z.string().optional(),
  memberProvinsi: z.string().optional(),
  memberKotaKabupaten: z.string().optional(),
  memberKecamatan: z.string().optional(),
  memberKelurahan: z.string().optional(),
  statusBaptis: baptisStatusSchema.optional(),
  lokasiBaptis: z.string().optional(),
  tanggalBaptis: z.string().optional(),
  statusSidi: sidiStatusSchema.optional(),
  lokasiSidi: z.string().optional(),
  tanggalSidi: z.string().optional(),
  statusPerkawinan: perkawinanStatusSchema.optional(),
  lokasiPemberkatanGereja: z.string().optional(),
  tanggalPemberkatanGereja: z.string().optional(),
  lokasiPerkawinanSipil: z.string().optional(),
  tanggalPerkawinanSipil: z.string().optional(),
  jabatan: z.union([z.nativeEnum(Jabatan), z.literal("")]).optional(),
  gerejaAsal: z.string().optional(),
  pendidikanTerakhir: z.string().optional(),
  pekerjaan: z.string().optional(),
  tahunDaftar: z.string().optional(),
  pengalamanGereja: z.string().optional(),
  pengalamanOrganisasi: z.string().optional(),
  keteranganLain: z.string().optional(),
  isActive: z.boolean().optional(),
  isDeceased: z.boolean().optional(),
  deathDate: z.string().optional(),
  tanggalPindah: z.string().optional(),
  familyId: z.string().optional(),
});

// ── Family ──────────────────────────────────────────────

const memberInputSchema = z.object({
  firstName: z.string().min(1, "Member first name is required"),
  lastName: z.string().optional().nullable(),
  birthCity: z.string().optional().default(""),
  gender: genderSchema,
  birthDate: z.string().min(1, "Member birth date is required"),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  role: memberRoleSchema,
  childNumber: z.coerce.number().int().min(0).optional().nullable(),
  sameAddressAsFamily: z.boolean().optional().default(true),
  memberAddress: z.string().optional().nullable(),
  memberProvinsi: z.string().optional().nullable(),
  memberKotaKabupaten: z.string().optional().nullable(),
  memberKecamatan: z.string().optional().nullable(),
  memberKelurahan: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
  isDeceased: z.boolean().optional().default(false),
  deathDate: z.string().optional().nullable(),
  statusBaptis: z.string().optional(),
  lokasiBaptis: z.string().optional().nullable(),
  tanggalBaptis: z.string().optional().nullable(),
  statusSidi: z.string().optional(),
  lokasiSidi: z.string().optional().nullable(),
  tanggalSidi: z.string().optional().nullable(),
  statusPerkawinan: z.string().optional(),
  lokasiPemberkatanGereja: z.string().optional().nullable(),
  tanggalPemberkatanGereja: z.string().optional().nullable(),
  lokasiPerkawinanSipil: z.string().optional().nullable(),
  tanggalPerkawinanSipil: z.string().optional().nullable(),
  jabatan: z.string().optional().nullable(),
  gerejaAsal: z.string().optional().nullable(),
  pendidikanTerakhir: z.string().optional().nullable(),
  pekerjaan: z.string().optional().nullable(),
  tahunDaftar: z.string().optional().nullable(),
  pengalamanGereja: z.string().optional().nullable(),
  pengalamanOrganisasi: z.string().optional().nullable(),
  keteranganLain: z.string().optional().nullable(),
});

const addressSchema = z.string().optional().default("");

export const createFamilySchema = z.object({
  familyName: z.string().min(1, "Family name is required"),
  address: addressSchema,
  provinsi: addressSchema,
  kotaKabupaten: addressSchema,
  kecamatan: addressSchema,
  kelurahan: addressSchema,
  regionId: z.string().min(1, "Region is required"),
  members: z.array(memberInputSchema).optional().default([]),
});

export const updateFamilySchema = z.object({
  familyName: z.string().optional(),
  address: z.string().optional(),
  provinsi: z.string().optional().nullable(),
  kotaKabupaten: z.string().optional().nullable(),
  kecamatan: z.string().optional().nullable(),
  kelurahan: z.string().optional().nullable(),
  regionId: z.string().optional(),
  members: z.array(memberInputSchema).optional(),
});

export const familyStatusSchema = z.object({
  isActive: z.boolean(),
  tanggalPindah: z.string().optional(),
});

export const splitFamilySchema = z.object({
  originalFamilyId: z.string().min(1),
  newHeadMemberId: z.string().min(1),
  movedMemberIds: z.array(z.string()).optional().default([]),
  familyName: z.string().min(1, "New family name is required"),
  address: z.string().optional(),
  provinsi: z.string().optional(),
  kotaKabupaten: z.string().optional(),
  kecamatan: z.string().optional(),
  kelurahan: z.string().optional(),
  regionId: z.string().min(1, "Region is required"),
});

// ── Branch ──────────────────────────────────────────────

export const createBranchSchema = z.object({
  name: z.string().min(1, "Branch name is required"),
});

export const updateBranchSchema = z.object({
  name: z.string().min(1, "Branch name is required").optional(),
});

// ── Region ──────────────────────────────────────────────

export const createRegionSchema = z.object({
  name: z.string().min(1, "Region name is required"),
  branchId: z.string().min(1, "Branch is required"),
});

export const updateRegionSchema = z.object({
  name: z.string().optional(),
  branchId: z.string().optional(),
});

// ── Attendance ──────────────────────────────────────────

export const createAttendanceSchema = z.object({
  serviceDate: z.string().min(1, "Service date is required"),
  serviceType: z.string().min(1, "Service type is required"),
  maleCount: z.coerce.number().int().min(0),
  femaleCount: z.coerce.number().int().min(0),
});

export const updateAttendanceSchema = z.object({
  serviceDate: z.string().optional(),
  serviceType: z.string().optional(),
  maleCount: z.coerce.number().int().min(0).optional(),
  femaleCount: z.coerce.number().int().min(0).optional(),
});

// ── User ────────────────────────────────────────────────

const appRoleSchema = z.enum(["ADMIN", "STAFF", "COORDINATOR", "MEMBER"]);

export const createUserSchema = z.object({
  name: z.string().optional().default(""),
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: appRoleSchema,
  regionId: z.string().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().optional(),
  email: z.string().email("Valid email is required").optional(),
  password: z.string().min(6).optional(),
  role: appRoleSchema.optional(),
  regionId: z.string().optional().nullable(),
});

// ── RBAC settings ───────────────────────────────────────

export const rbacSettingsSchema = z.object({
  config: z.union([z.string(), z.record(z.string(), z.any())]),
});
