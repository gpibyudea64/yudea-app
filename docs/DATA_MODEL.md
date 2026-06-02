# Data Model

The Prisma schema is in `prisma/schema.prisma`. PostgreSQL is the configured datasource, and the generated Prisma client is written to `app/generated/prisma`.

## Core Entities

### User

Application login account.

- `email` is unique.
- `role` defaults to `ADMIN`.
- Related to NextAuth `Session` and `Account` records.
- Passwords are hashed with `bcryptjs` for credentials login.

### AppSetting

Stores application-level settings as key/value strings.

- `key` is unique.
- RBAC settings use the key `role_access_config`.

### Branch

Top-level church grouping.

- Has many `Region` records.

### Region

Belongs to a branch and contains families.

- Has many `Family` records.
- Can have one coordinator member through `coordinatorMemberId`.
- The coordinator relation is unique, so a member can coordinate only one region.

### Family

Belongs to a region and contains members.

- Required `familyName`.
- Optional `address`.

### Member

Belongs to a family.

- Required `name`, `gender`, `birthDate`, `role`, and `familyId`.
- Optional contact details.
- `isActive` defaults to `true`.
- `isDeceased` defaults to `false`.
- May coordinate one region through the `RegionCoordinator` relation.

### Attendance

Stores counts for a service.

- Required `serviceDate`, `serviceType`, `maleCount`, `femaleCount`, and `totalCount`.
- Unique by `serviceDate` and `serviceType`.

## Enums

### App Roles

App roles are defined in `lib/rbac.ts`, not as a Prisma enum:

- `ADMIN`
- `STAFF`
- `COORDINATOR`
- `MEMBER`

### MemberRole

- `FAMILY_HEAD`
- `WIFE`
- `CHILD`
- `OTHER`

### Gender

- `MALE`
- `FEMALE`

### MemberPelkat

- `PELAYANAN_ANAK`
- `PERSEKUTUAN_TARUNA`
- `GERAKAN_PEMUDA`
- `PERSEKUTUAN_KAUM_BAPAK`
- `PERSEKUTUAN_KAUM_PEREMPUAN`
- `PERSEKUTUAN_KAUM_LANJUT_USIA`

Pelkat is derived at runtime from member age, gender, role, and active/deceased state. The logic is in `determinePelkat()` and `buildPelkatWhere()` in `lib/helper.ts`.

## Seed Data

`prisma/seed.ts` creates:

- An admin user: `admin@example.com` / `admin123`
- A staff user: `demo@example.com` / `demo1234`
- Two branches
- Three regions
- Five families
- Fifty members
- Two attendance records

The seed script clears users, attendance, members, families, regions, and branches before inserting demo data.
