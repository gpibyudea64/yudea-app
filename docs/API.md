# API Reference

All API handlers live under `app/api/`.

## Response Format

All paginated list endpoints return:

```typescript
{
  data: T[];
  meta: {
    total: number;       // Total matching records
    page: number;        // Current page (1-indexed)
    limit: number;       // Items per page
    totalPages: number;  // Total number of pages
  };
}
```

## Common Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | `1` | Page number (1-indexed) |
| `limit` | number | `10` | Items per page |
| `search` | string | `""` | Text search across relevant fields |

## Authentication

| Route | Method | Description |
| --- | --- | --- |
| `/api/auth/[...nextauth]` | NextAuth handlers | Credentials login, JWT session callbacks, sign-in/sign-out |

Protected API handlers call `requireAuth()` or `requireAdmin()` from `lib/server-auth.ts`.

## Dashboard

| Route | Method | Description | Auth |
| --- | --- | --- | --- |
| `/api/dashboard/counts` | `GET` | Aggregated dashboard stats | Required |

Returns:
```typescript
{
  totalMembers: number;
  totalFamilies: number;
  totalRegions: number;
  totalBranches: number;
  genderCounts: { female: number; male: number };
  bloodTypeCounts: { A: number; B: number; AB: number; O: number };
  pelkatCounts: Array<{ pelkat: MemberPelkat; total: number }>;
}
```

## Branches

| Route | Method | Description | Auth |
| --- | --- | --- | --- |
| `/api/branch` | `GET` | List branches with regions included | Required |
| `/api/branch` | `POST` | Create a branch | Required |
| `/api/branch/:id` | `GET` | Get a branch by ID | Required |
| `/api/branch/:id` | `PATCH` | Update a branch | Required |
| `/api/branch/:id` | `DELETE` | Delete a branch | Required |

Create/update fields:
- `name` (string, required)

## Regions

| Route | Method | Description | Auth |
| --- | --- | --- | --- |
| `/api/region` | `GET` | List regions with branch, families, and coordinator | Required |
| `/api/region` | `POST` | Create a region | Required |
| `/api/region/:id` | `GET` | Get a region by ID | Required |
| `/api/region/:id` | `PATCH` | Update a region | Required |
| `/api/region/:id` | `DELETE` | Delete a region | Required |
| `/api/region/member-count` | `GET` | Members per region (raw SQL query) | Required |

Create fields:
- `name` (string, required)
- `branchId` (string, required)

`GET /api/region/member-count` returns `{ data: Array<{ regionId, regionName, memberCount }> }`. Scoped by coordinator's `regionId` when user role is `COORDINATOR`.

## Families

| Route | Method | Description | Auth |
| --- | --- | --- | --- |
| `/api/family` | `GET` | List families with region and members; supports `sortBy` and `sortOrder` | Required |
| `/api/family` | `POST` | Create a family, optionally with nested member creation | Required |
| `/api/family/:id` | `GET` | Get a family by ID | Required |
| `/api/family/:id` | `PATCH` | Update a family | Required |
| `/api/family/:id` | `DELETE` | Delete a family | Required |
| `/api/family/:id/status` | `PATCH` | Cascade `isActive` (and optional `tanggalPindah`) to all family members | Required |
| `/api/family/count` | `GET` | Total family count | Required |
| `/api/family/split` | `POST` | Split a family — move members to a new family, promote one as FAMILY_HEAD | Required |

### GET /api/family

Supports `sortBy` (values: `familyName`, `regionName`, `address`) and `sortOrder` (`asc` / `desc`). Scoped by coordinator's `regionId`.

### POST /api/family

Create fields:
- `familyName` (string, required)
- `address` (string, required)
- `provinsi` (string, required)
- `kotaKabupaten` (string, required)
- `kecamatan` (string, required)
- `kelurahan` (string, required)
- `regionId` (string, required)
- `members` (array, optional) — nested member payloads with the same fields as `POST /api/member`

### PATCH /api/family/:id/status

Request body:
- `isActive` (boolean, required) — applied to all members
- `tanggalPindah` (string, optional) — ISO date; set when marking as inactive

### POST /api/family/split

Request body:
- `originalFamilyId` (string, required)
- `newHeadMemberId` (string, required) — member promoted to FAMILY_HEAD
- `movedMemberIds` (string[], optional) — defaults to `[newHeadMemberId]`
- `familyName` (string, required)
- `address`, `provinsi`, `kotaKabupaten`, `kecamatan`, `kelurahan` (optional)
- `regionId` (string, required)

Validates that all moved members belong to the original family.

## Members

| Route | Method | Description | Auth |
| --- | --- | --- | --- |
| `/api/member` | `GET` | List members with family, region, and derived `pelkat` | Required |
| `/api/member` | `POST` | Create a member | Required |
| `/api/member/:id` | `GET` | Get a member by ID | Required |
| `/api/member/:id` | `PATCH` | Update a member | Required |
| `/api/member/:id` | `DELETE` | Delete a member | Required |
| `/api/member/presbyter` | `GET` | List presbyters (isPresbyter=true) with region filter | Required |
| `/api/member/gender-count` | `GET` | Gender distribution counts | Required |
| `/api/member/blood-type-count` | `GET` | Blood type distribution counts | Required |
| `/api/member/pelkat-count` | `GET` | Pelkat group counts | Required |

### GET /api/member

Supports additional query params:
- `region` (string) — filter by region ID; `"all"` for no filter
- `pelkat` (string) — filter by pelkat enum value; `"all"` for no filter
- `sortBy` (string) — `firstName`, `role`, `familyRegionName`, `pelkat`, `isActive`
- `sortOrder` (`asc` / `desc`)

Note: `pelkat` filtering and `pelkat` sorting happen in-memory because pelkat is a computed field.

Scoped by coordinator's `regionId` when user role is `COORDINATOR`.

### GET /api/member/presbyter

Supports same pagination + search params, plus `region` filter.

### POST /api/member

Create fields:
- `firstName` (string, required)
- `lastName` (string, optional)
- `birthCity` (string, required)
- `gender` (`MALE` / `FEMALE`, required)
- `birthDate` (string/Date, required)
- `phone` (string, required)
- `role` (`FAMILY_HEAD` / `WIFE` / `CHILD` / `OTHER` / `ORANG_TUA` / `CUCU` / `KAKAK_ADIK_KANDUNG` / `FAMILI_LAIN`, required)
- `familyId` (string, required)
- `email` (string, optional)
- `isActive` (boolean, default `true`)
- `isDeceased` (boolean, default `false`)
- `isPresbyter` (boolean, default `false`)
- `deathDate` (string/Date, optional)
- `childNumber` (number, optional — only for `CHILD` role)
- `sameAddressAsFamily` (boolean, default `true`)
- `memberAddress`, `memberProvinsi`, `memberKotaKabupaten`, `memberKecamatan`, `memberKelurahan` (strings, optional)
- **Baptis:** `statusBaptis` (`SUDAH`/`BELUM`), `lokasiBaptis`, `tanggalBaptis`
- **Sidi:** `statusSidi` (`SUDAH`/`BELUM`), `lokasiSidi`, `tanggalSidi`
- **Perkawinan:** `statusPerkawinan` (`BELUM_MENIKAH`/`JANDA`/`DUDA`/`MENIKAH`), `lokasiPemberkatanGereja`, `tanggalPemberkatanGereja`, `lokasiPerkawinanSipil`, `tanggalPerkawinanSipil`
- **Jabatan:** `jabatan` (`DIAKEN`/`PENATUA`/`PENGURUS_PELKAT`/`PENGURUS_KOMISI`)
- **Additional:** `gerejaAsal`, `pendidikanTerakhir`, `pekerjaan`, `tahunDaftar`, `pengalamanGereja`, `pengalamanOrganisasi`, `keteranganLain`

Returns the created member with computed `pelkat` attached.

## Attendance

| Route | Method | Description | Auth |
| --- | --- | --- | --- |
| `/api/attendance` | `GET` | List attendance records, searchable by `serviceType` | Required |
| `/api/attendance` | `POST` | Create an attendance record | Required |
| `/api/attendance/:id` | `GET` | Get by ID | Required |
| `/api/attendance/:id` | `PATCH` | Update | Required |
| `/api/attendance/:id` | `DELETE` | Delete | Required |

Create fields:
- `serviceDate` (string/Date, required)
- `serviceType` (string, required)
- `maleCount` (number, required)
- `femaleCount` (number, required)

`totalCount` is calculated server-side. The database enforces a unique constraint on `(serviceDate, serviceType)`.

## Users

| Route | Method | Description | Access |
| --- | --- | --- | --- |
| `/api/user` | `GET` | List users (name, email, role only) | `ADMIN` |
| `/api/user` | `POST` | Create a user | `ADMIN` |
| `/api/user/:id` | `PATCH` | Update a user | `ADMIN` |
| `/api/user/:id` | `DELETE` | Delete a user | `ADMIN` |

Roles are validated against `ADMIN`, `STAFF`, `COORDINATOR`, `MEMBER`. Returns user list without passwords.

## Birthday

| Route | Method | Description | Auth |
| --- | --- | --- | --- |
| `/api/birthday` | `GET` | Weekly birthday members | Required |

Query params:
- `date` (string, optional) — ISO date to compute the week from; defaults to today

Returns:
```typescript
{
  data: Array<{
    id, firstName, lastName, birthDate,
    regionName, familyName, address, kotaKabupaten, kecamatan, pelkat
  }>;
  meta: { start: string; end: string };  // Computed week range
}
```

Uses raw SQL with `to_char(m."birthDate", 'MM-DD')` for cross-year date matching. Supports year-end crossover (e.g., Dec 30 week includes Jan 1 birthdays).

Scoped by coordinator's `regionId` when user role is `COORDINATOR`.

## Report

| Route | Method | Description | Auth |
| --- | --- | --- | --- |
| `/api/report` | `GET` | Member report with pelkat/region filter | Required |

Query params:
- `pelkat` (string, optional) — `"all"` or a `MemberPelkat` enum value
- `region` (string, optional) — `"all"` or a region ID

Returns flat member list with family information formatted for export:
```typescript
{
  data: Array<{
    familyName, firstName, lastName, fullName, address, birthDate,
    regionName, pelkat
  }>;
}
```

Scoped by coordinator's `regionId` when user role is `COORDINATOR`.

## RBAC Settings

| Route | Method | Description | Access |
| --- | --- | --- | --- |
| `/api/settings/rbac` | `GET` | Load persisted route access configuration | Authenticated |
| `/api/settings/rbac` | `PUT` | Save route access configuration | `ADMIN` |

Request body for PUT:
```typescript
{ config: RoleAccessConfig }
// or
{ config: string }  // Pre-serialized JSON
```

The persisted payload is normalized by `parseRoleAccessConfig()` and stored in `AppSetting` under key `role_access_config`.

## Indonesian Administrative Regions

| Route | Method | Description |
| --- | --- | --- |
| `/api/region-indonesia/provinces` | `GET` | All provinces |
| `/api/region-indonesia/regencies?provinceCode=...` | `GET` | Regencies by province code |
| `/api/region-indonesia/districts?regencyCode=...` | `GET` | Districts by regency code |
| `/api/region-indonesia/villages?districtCode=...` | `GET` | Villages by district code |

Data sourced from the `idn-area-data` npm package. Cached indefinitely on the client.

## API Client Library (`lib/api/`)

Client-side fetch wrappers for all major endpoints. Each file exports typed functions that handle request serialization and error handling:

| File | Functions |
|------|-----------|
| `lib/api/member.ts` | `getMembers`, `getPresbyters`, `getMember`, `createMember`, `updateMember`, `deleteMember` |
| `lib/api/family.ts` | `getFamilies`, `getFamily`, `createFamily`, `updateFamily`, `deleteFamily` |
| `lib/api/region.ts` | `getRegions`, `getRegion`, `createRegion`, `updateRegion`, `deleteRegion`, `getRegionMemberCounts` |
| `lib/api/branch.ts` | `getBranches`, `getBranch`, `createBranch`, `updateBranch`, `deleteBranch` |
| `lib/api/attendance.ts` | `getAttendances`, `getAttendance`, `createAttendance`, `updateAttendance`, `deleteAttendance` |
| `lib/api/user.ts` | `getUsers`, `createUser`, `updateUser`, `deleteUser` |
| `lib/api/birthday.ts` | `getBirthdayMembers` |
| `lib/api/rbac-settings.ts` | `fetchRoleAccessConfig`, `saveRoleAccessConfig` |

All functions throw `Error` on non-OK responses.
