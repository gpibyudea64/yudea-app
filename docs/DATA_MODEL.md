# Data Model

The Prisma schema is in `prisma/schema.prisma`. PostgreSQL is the configured datasource with both `DATABASE_URL` and `DIRECT_URL` environment variables (the latter for connection pooling, e.g., Supabase).

## Entity Relationship Diagram

```
Branch ──has_many──> Region ──has_many──> Family ──has_many──> Member
                          │                                        │
                          └──has_many──> User ──────────────── coordinator?
                                          (regionId FK)

Attendance (standalone, unique by serviceDate + serviceType)
AppSetting (key/value store for RBAC config)
Account, Session (NextAuth adapter tables)
```

## Core Entities

### User

Application login account. Used by NextAuth v5 with JWT sessions.

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID (PK) | `@default(uuid())` |
| `name` | String? | Display name |
| `email` | String (unique) | Login identifier |
| `password` | String? | bcrypt hash; `null` for OAuth accounts (not currently used) |
| `role` | String | `"ADMIN"` default — see [Roles](#roles) |
| `regionId` | String? | FK to Region — links coordinator users to their sector |

Relations: `Region` (via `regionId`), `Session[]`, `Account[]`

**Indexes:** `email`, `role`, `regionId`

### AppSetting

Key/value store for application-level settings.

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID (PK) | `@default(uuid())` |
| `key` | String (unique) | Setting key, e.g. `"role_access_config"` |
| `value` | String | JSON-serialized value |
| `updatedAt` | DateTime | Auto-updated |

### Account

NextAuth adapter table for OAuth/provider accounts. Not currently used (credentials-only login).

### Session

NextAuth adapter table for database sessions. Not currently used (JWT session strategy).

### Branch

Top-level church grouping.

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID (PK) | `@default(uuid())` |
| `name` | String | Branch name |
| `createdAt` | DateTime | `@default(now())` |

Relations: `Region[]`

**Indexes:** `name`

### Region

Sector / sub-branch region that contains families.

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID (PK) | `@default(uuid())` |
| `name` | String | Sector name |
| `branchId` | String (FK → Branch) | Parent branch |
| `coordinatorMemberId` | String? (unique) | FK to Member — one member can coordinate at most one region |
| `createdAt` | DateTime | `@default(now())` |

Relations:
- `Branch` (parent)
- `Family[]` (children)
- `User[]` (coordinators linked via `regionId`)
- `Member` (coordinator, via `RegionCoordinator` relation)

**Indexes:** `branchId`, `name`

### Family

Household grouping within a region.

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID (PK) | `@default(uuid())` |
| `familyName` | String | Surname / household name |
| `address` | String? | Street address |
| `provinsi` | String? | Indonesian province code |
| `kotaKabupaten` | String? | Regency/city code |
| `kecamatan` | String? | District code |
| `kelurahan` | String? | Village code |
| `regionId` | String (FK → Region) | Parent region |
| `createdAt` | DateTime | `@default(now())` |

Relations: `Region` (parent), `Member[]` (children)

**Indexes:** `regionId`, `familyName`, `kotaKabupaten`, `kecamatan`

### Member

Individual church member. This is the most complex entity with extensive fields for sacramental status, church positions, and personal data.

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID (PK) | `@default(uuid())` |
| `firstName` | String | Given name |
| `lastName` | String? | Family name |
| `birthCity` | String | Place of birth |
| `gender` | Gender enum | `MALE` / `FEMALE` |
| `birthDate` | DateTime | Date of birth |
| `phone` | String | Contact number |
| `email` | String? | Email address |
| `role` | MemberRole | Family role — see [MemberRole](#memberrole) |
| `childNumber` | Int? | Birth order (for CHILD role) |
| `sameAddressAsFamily` | Boolean | Default `true`; whether to use family address |
| `memberAddress` | String? | Individual address (when `sameAddressAsFamily=false`) |
| `memberProvinsi` | String? | Individual province |
| `memberKotaKabupaten` | String? | Individual regency/city |
| `memberKecamatan` | String? | Individual district |
| `memberKelurahan` | String? | Individual village |
| `isActive` | Boolean | Default `true` |
| `isDeceased` | Boolean | Default `false` |
| `deathDate` | DateTime? | Date of death |
| `isPresbyter` | Boolean | Default `false` — marks as church elder |
| `bloodType` | BloodType? | `A`, `B`, `AB`, or `O` |
| `pelkat` | MemberPelkat? | Cached computed value — set optionally; primary logic is runtime-computed |
| `tanggalPindah` | DateTime? | Date of transfer out (when family status set inactive) |
| `statusBaptis` | BaptisStatus? | `SUDAH` / `BELUM` (default `BELUM`) |
| `lokasiBaptis` | String? | Baptism location |
| `tanggalBaptis` | DateTime? | Baptism date |
| `statusSidi` | SidiStatus? | `SUDAH` / `BELUM` (default `BELUM`) |
| `lokasiSidi` | String? | Confirmation location |
| `tanggalSidi` | DateTime? | Confirmation date |
| `statusPerkawinan` | PerkawinanStatus? | `BELUM_MENIKAH` / `JANDA` / `DUDA` / `MENIKAH` (default `BELUM_MENIKAH`) |
| `lokasiPemberkatanGereja` | String? | Church wedding location |
| `tanggalPemberkatanGereja` | DateTime? | Church wedding date |
| `lokasiPerkawinanSipil` | String? | Civil marriage location |
| `tanggalPerkawinanSipil` | DateTime? | Civil marriage date |
| `jabatan` | Jabatan? | Church position — `DIAKEN` / `PENATUA` / `PENGURUS_PELKAT` / `PENGURUS_KOMISI` |
| `gerejaAsal` | String? | Previous church |
| `pendidikanTerakhir` | String? | Highest education |
| `pekerjaan` | String? | Occupation |
| `tahunDaftar` | String? | Registration year |
| `pengalamanGereja` | String? | Church experience notes |
| `pengalamanOrganisasi` | String? | Organization experience notes |
| `keteranganLain` | String? | Other notes |
| `familyId` | String (FK → Family) | Parent family |
| `createdAt` | DateTime | `@default(now())` |

Relations:
- `Family` (parent)
- `Region` (optional, via `RegionCoordinator` relation — if member coordinates a region)

**Indexes:** `familyId`, `firstName`, `lastName`, `isActive`, `isPresbyter`, `gender`, `pelkat`, `birthDate`

### Attendance

Stores attendance counts for church services.

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID (PK) | `@default(uuid())` |
| `serviceDate` | DateTime | Date of service |
| `serviceType` | String | e.g. "Sunday Service", "Wednesday Service" |
| `maleCount` | Int | Male attendees |
| `femaleCount` | Int | Female attendees |
| `totalCount` | Int | Calculated server-side: `maleCount + femaleCount` |
| `createdAt` | DateTime | `@default(now())` |

**Unique constraint:** `(serviceDate, serviceType)` — one record per service type per day

**Indexes:** `serviceDate`, `serviceType`

## Enums

### Gender

| Value | Label (Indonesian) |
|-------|--------------------|
| `MALE` | Laki-laki |
| `FEMALE` | Perempuan |

### MemberRole

| Value | Label (Indonesian) | Description |
|-------|--------------------|-------------|
| `FAMILY_HEAD` | Kepala Keluarga | Head of household |
| `WIFE` | Istri | Spouse |
| `CHILD` | Anak | Child |
| `OTHER` | Lainnya | Other |
| `ORANG_TUA` | Orang Tua | Parent of the head |
| `CUCU` | Cucu | Grandchild |
| `KAKAK_ADIK_KANDUNG` | Kakak/Adik Kandung | Sibling |
| `FAMILI_LAIN` | Famili Lain | Other relative |

### MemberPelkat

Computed at runtime from member age, gender, and role. Also stored as a cached field on the Member model.

| Value | Label | Criteria |
|-------|-------|----------|
| `PELAYANAN_ANAK` | Pelayanan Anak | Age 0–12, not married |
| `PERSEKUTUAN_TARUNA` | Persekutuan Taruna | Age 13–16, not married |
| `GERAKAN_PEMUDA` | Gerakan Pemuda | Age 17–35, not married |
| `PERSEKUTUAN_KAUM_BAPAK` | Persekutuan Kaum Bapak | Male, age 36–59, OR married male under 36 |
| `PERSEKUTUAN_KAUM_PEREMPUAN` | Persekutuan Kaum Perempuan | Female, age 36–59, OR married female under 36 |
| `PERSEKUTUAN_KAUM_LANJUT_USIA` | Persekutuan Kaum Lanjut Usia | Age 60+ |

Computation logic is in `determinePelkat()` and `buildPelkatWhere()` in `lib/helper.ts`.

### BloodType

| Value |
|-------|
| `A` |
| `B` |
| `AB` |
| `O` |

### BaptisStatus

| Value | Label |
|-------|-------|
| `SUDAH` | Already baptized |
| `BELUM` | Not yet baptized |

### SidiStatus

| Value | Label |
|-------|-------|
| `SUDAH` | Already confirmed |
| `BELUM` | Not yet confirmed |

### PerkawinanStatus

| Value | Label |
|-------|-------|
| `BELUM_MENIKAH` | Not married |
| `JANDA` | Widow |
| `DUDA` | Widower |
| `MENIKAH` | Married |

### Jabatan (Church Position)

| Value | Label |
|-------|-------|
| `DIAKEN` | Deacon |
| `PENATUA` | Elder |
| `PENGURUS_PELKAT` | Pelkat Organizer |
| `PENGURUS_KOMISI` | Commission Organizer |

## Roles

App roles are defined as TypeScript constants in `lib/rbac.ts`, not as a Prisma enum:

| Role | Access Level |
|------|-------------|
| `ADMIN` | Full access |
| `STAFF` | CRUD on most resources |
| `COORDINATOR` | Scoped to assigned region |
| `MEMBER` | View-only |

## Pelkat Computation

The `pelkat` field on Member can be cached/stored, but the primary approach is **runtime computation**:

1. **`determinePelkat(member)`** in `lib/helper.ts` — pure function computing pelkat from `birthDate`, `gender`, and `role`
2. **`attachPelkat(member)`** — wraps a Member with the computed pelkat field
3. **`buildPelkatWhere(pelkat)`** — constructs Prisma `where` clauses for dashboard count queries

## Seed Data

`prisma/seed.ts` creates:

| Entity | Count | Details |
|--------|-------|---------|
| Users | **5** | 1 admin, 1 STAFF, 3 COORDINATORs (one per region) |
| Branches | **2** | Central Branch, West Branch |
| Regions | **3** | Region A (branch 1), Region B (branch 1), Region C (branch 2) |
| Families | **9** | 3 per region |
| Members | **90** | 10 per family (9 families × 10 members) |
| Attendance | **2** | Sunday Service, Evening Service |

The first member of the first family is linked as the coordinator of Region A.

`prisma/seed-birthday.ts` is a separate script that adds sample members with birthdays in the current week for testing the birthday dashboard.

### Demo Accounts

| Email | Password | Role |
|-------|----------|------|
| `admin@example.com` | `admin123` | `ADMIN` |
| `demo@example.com` | `demo1234` | `STAFF` |
| `coordinator-a@example.com` | `coordinator123` | `COORDINATOR` (Region A) |
| `coordinator-b@example.com` | `coordinator123` | `COORDINATOR` (Region B) |
| `coordinator-c@example.com` | `coordinator123` | `COORDINATOR` (Region C) |
