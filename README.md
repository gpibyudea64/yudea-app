# Yudea App

> Church administration dashboard for managing branches, regions, families, members, Pelkat grouping, attendance, users, and role-based access control.

**Stack:** Next.js 16 App Router · React 19 · TypeScript · Prisma 7 (PostgreSQL) · NextAuth v5 · TanStack Query v5 · shadcn/Radix UI · Tailwind CSS 4 · Vitest

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Getting Started](#getting-started)
3. [Project Structure](#project-structure)
4. [Data Model](#data-model)
5. [API Reference](#api-reference)
6. [Authentication & RBAC](#authentication--rbac)
7. [Component Library](#component-library)
8. [Hooks Reference](#hooks-reference)
9. [Lib Utilities](#lib-utilities)
10. [State & Session Management](#state--session-management)
11. [Dynamic Routing & Proxying](#dynamic-routing--proxying)
12. [Testing](#testing)
13. [Development Workflow](#development-workflow)
14. [Deployment](#deployment)

---

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│                  Browser                     │
│  Next.js App (React 19, Tailwind CSS 4)     │
├─────────────────────────────────────────────┤
│             Next.js 16 App Router            │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐ │
│  │ Pages    │  │ API      │  │ proxy.ts  │ │
│  │ (RSC)    │  │ Routes   │  │ (redirect)│ │
│  └──────────┘  └──────────┘  └───────────┘ │
├─────────────────────────────────────────────┤
│           NextAuth v5 (JWT Sessions)         │
├─────────────────────────────────────────────┤
│               Prisma 7 + PostgreSQL          │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌────────────┐ │
│  │ User │ │Family│ │Member│ │ Attendance │ │
│  │Branch│ │Region│ │AppSet│ │ ...        │ │
│  └──────┘ └──────┘ └──────┘ └────────────┘ │
└─────────────────────────────────────────────┘
```

**Key architectural decisions:**

- **API Routes (not Server Components):** All data fetching is done client-side via TanStack Query through API route handlers. This provides a clean separation between frontend and backend logic.
- **Client-side RBAC:** Role-based access is enforced on both the client (UI guards, sidebar filtering) and server (API route guards).
- **Prisma as ORM:** PostgreSQL schema is managed through Prisma migrations. The Prisma client is instantiated as a singleton via the global object pattern.
- **JWT Sessions:** Authentication uses JWT-based sessions (no database sessions), with user role stored in the token.

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database
- npm

### Environment Variables

Create a `.env` file:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"  # For connection pooling
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secure-random-secret"
```

`AUTH_SECRET` is also accepted as a fallback for `NEXTAUTH_SECRET`.

### Setup

```bash
npm install
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Open `http://localhost:3000`.

### Demo Accounts

| Email | Password | Role |
|-------|----------|------|
| `admin@example.com` | `admin123` | `ADMIN` |
| `demo@example.com` | `demo1234` | `STAFF` |

---

## Project Structure

```
app/                          # Next.js App Router
├── api/                      # API route handlers
│   ├── auth/[...nextauth]/   # NextAuth handlers
│   ├── branch/               # CRUD + ID routes
│   ├── region/               # CRUD + member-count
│   ├── family/               # CRUD + count + split + status
│   ├── member/               # CRUD + gender/birthday/pelkat/presbyter
│   ├── attendance/           # CRUD + ID routes
│   ├── user/                 # CRUD (admin only)
│   ├── birthday/             # Weekly birthday lookups
│   ├── report/               # Combined report with pelkat/region filter
│   ├── dashboard/counts/     # Aggregated dashboard stats
│   ├── settings/rbac/        # RBAC configuration persistence
│   └── region-indonesia/     # Indonesian admin regions (provinces → villages)
├── dashboard/                # Protected dashboard pages
│   ├── layout.tsx            # Sidebar + navbar + RbacGuard wrapper
│   ├── page.tsx              # Dashboard overview (stats)
│   ├── branches/             # Branch management
│   ├── regions/              # Region management + data export
│   ├── families/             # Family management
│   ├── members/              # Member CRUD + filters
│   ├── presbytery/           # Presbyter list (filtered members)
│   ├── pelkat-members/       # Members grouped by Pelkat
│   ├── attendance/           # Attendance records + stats
│   ├── birthday/             # Weekly birthday dashboard
│   ├── users/                # User management (admin only)
│   ├── settings/             # RBAC role matrix config (admin only)
│   └── report/               # Report export tool
├── public/
│   ├── page.tsx              # Redirects to /public/login
│   └── login/page.tsx        # Login form page
├── layout.tsx                # Root layout (fonts, sidebar provider)
├── page.tsx                  # Redirects to /public/login
└── globals.css               # Tailwind + shadcn theme variables

components/
├── ui/                       # shadcn/Radix UI primitives
│   ├── button.tsx, input.tsx, select.tsx, dialog.tsx
│   ├── table.tsx, badge.tsx, card.tsx, sheet.tsx
│   ├── sidebar.tsx, navbar.tsx, avatar.tsx
│   ├── tooltip.tsx, dropdown-menu.tsx, skeleton.tsx
│   ├── data-table-controls.tsx  # Shared pagination/search bar
│   ├── pelkat-select.tsx        # Pelkat dropdown filter
│   └── button-group.tsx
├── dashboard/                # Dashboard overview widgets
│   ├── index.tsx             # Dashboard page (fetches all stat data)
│   ├── over-view-stat.tsx    # Total members/families/regions cards
│   ├── member-stat.tsx       # Pelkat distribution cards
│   ├── gender-stat.tsx       # Male/female count cards
│   ├── blood-type-stat.tsx   # Blood type distribution cards
│   ├── region-table.tsx      # Members per region table
│   ├── birthday.tsx          # Weekly birthday dashboard
│   ├── stat-card.tsx         # Reusable stat card (memoized)
│   └── entity-manager.tsx    # Generic CRUD manager (legacy)
├── members/                  # Members list + CRUD
│   ├── index.tsx             # Members page with quick-edit dialogs
│   ├── member-dialog.tsx     # Create/edit member dialog
│   └── data-table-member-control.tsx  # Search + region/pelkat filters
├── family/
│   ├── index.tsx             # Families page with status cascade
│   ├── family-dialog.tsx     # Create/edit family with nested member forms
│   ├── split-family-dialog.tsx  # Split a family into two
├── region/
│   ├── index.tsx             # Regions page + export section
│   ├── region-dialog.tsx     # Create/edit region
├── branch/
│   ├── index.tsx             # Branches CRUD page
│   ├── branch-dialog.tsx     # Create/edit branch
├── attendance/
│   ├── index.tsx             # Attendance records + stats cards
│   ├── attendance-dialog.tsx # Create/edit attendance
│   ├── attendance-card.tsx   # Metric display card
├── pelkat/
│   ├── index.tsx             # Pelkat members list with export
│   ├── data-table-pelkat-control.tsx  # Pelkat filter controls
├── presbyter/
│   ├── index.tsx             # Presbyter list view
│   ├── data-table-presbyter-control.tsx  # Region filter for presbyters
├── users/
│   ├── index.tsx             # Users CRUD page
│   ├── user-dialog.tsx       # Create/edit user
├── settings/
│   ├── index.tsx             # Settings page
│   ├── role-access-matrix.tsx    # Role/permission matrix editor
├── report/
│   ├── index.tsx             # Report export page
├── auth/
│   ├── rbac-guard.tsx        # Route-level RBAC guard
│   ├── auth-provider.tsx     # Session provider wrapper
│   ├── session-sync.tsx      # Session sync component
├── login/
│   └── form.tsx              # Login form

hooks/                        # TanStack Query hooks
├── use-member.ts             # Members CRUD + presbyters
├── use-family.ts             # Families CRUD
├── use-region.ts             # Regions CRUD + member counts
├── use-branch.ts             # Branches CRUD
├── use-attendance.ts         # Attendance CRUD
├── use-user.ts               # Users CRUD
├── use-birthday.ts           # Weekly birthday fetch
├── use-rbac-settings.ts      # RBAC config fetch/save
├── use-indonesia-region.ts   # Cascading region selects
├── use-page-access.ts        # Can view/edit for current path
├── use-dialog-form.ts        # Form reset on dialog open
└── use-mobile.ts             # Mobile breakpoint detection

lib/
├── prisma.ts                 # Prisma client singleton
├── helper.ts                 # Server-side utilities (pelkat, age, pagination)
├── client-helper.ts          # Client-side utilities (formatting, colors)
├── rbac.ts                   # RBAC config types, defaults, helpers
├── rbac-config.ts            # Client-side RBAC persistence (localStorage + cookie)
├── rbac-settings.ts          # Server-side RBAC persistence (Prisma/AppSetting)
├── auth-session.ts           # Client-side auth session persistence
├── server-auth.ts            # Server-side auth guards (requireAuth, requireAdmin)
├── proxy-config.ts           # Proxy/middleware matcher config
├── utils.ts                  # cn() utility (clsx + tailwind-merge)
├── providers.tsx             # TanStack Query + Auth provider wrapper
└── api/                      # API client functions
    ├── member.ts, family.ts, region.ts, branch.ts
    ├── attendance.ts, user.ts, birthday.ts
    └── rbac-settings.ts

types/                        # Shared TypeScript types
├── member.ts                 # Member, MemberForm, enums, option arrays
├── family.ts, region.ts      # Family, Region types + forms
├── branch.ts, user.ts        # Branch, User types + forms
├── attendance.ts             # Attendance + form types
├── birthday.ts               # Birthday response types
└── shared.ts                 # PaginatedResponse, PaginationMeta

schemas/                      # Zod validation schemas
├── auth.schema.ts            # Login form validation
└── user.schema.ts            # User form validation

nav/
└── const.ts                  # Sidebar menu items with role restrictions

services/                     # (Deprecated - use hooks instead)
└── member.ts                 # Removed - functionality in hooks/use-member.ts

tests/                        # Vitest test files (20 files, 386 tests)
├── utils.test.ts             # cn() utility
├── helper.test.ts            # Server helpers (pelkat, pagination, parsePagination)
├── client-helper.test.ts     # Client formatting helpers
├── schemas.test.ts           # Zod schemas (auth, user, member incl. bloodType)
├── api-validate.test.ts      # validateBody / handleApiError machinery
├── components.test.tsx       # Component rendering
├── components-additional.test.tsx  # Page rendering with mocked hooks
├── hooks.test.tsx            # TanStack Query hooks
├── use-dialog-form.test.tsx  # Dialog form reset hook
├── use-page-access.test.tsx  # Page access hook
├── use-mobile.test.tsx       # Mobile breakpoint hook
├── use-indonesia-region.test.tsx  # Indonesian region cascade hooks
├── auth-session.test.ts      # Client auth session
├── server-auth.test.ts       # Server auth guards (incl. requireEditAccess)
├── auth-config.test.ts       # NextAuth config
├── rbac.test.ts              # RBAC logic
├── rbac-config.test.ts       # RBAC client config
├── integration-rbac-settings.test.ts  # RBAC server persistence
├── proxy.test.ts             # Proxy config matcher
└── api-client.test.ts        # API client functions
```

---

## Data Model

### Entity Relationship Diagram

```
Branch ──has_many──> Region ──has_many──> Family ──has_many──> Member
                          │                                        │
                          └──has_many──> User ──────────────── coordinator?

Attendance (standalone, indexed by serviceDate + serviceType)

AppSetting (key/value store for RBAC config)
```

### Core Entities

#### User
| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | Primary key |
| `email` | String (unique) | Login identifier |
| `password` | String? | bcrypt hash; null for OAuth |
| `role` | String | `ADMIN`, `STAFF`, `COORDINATOR`, `MEMBER` (default: `ADMIN`) |
| `regionId` | String? | Links coordinator to their region |

Relations: `Session[]`, `Account[]`, `Region`

#### Branch
| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | Primary key |
| `name` | String | Church branch name |

Relations: `Region[]`

#### Region
| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | Primary key |
| `name` | String | Sector name |
| `branchId` | String | FK to Branch |
| `coordinatorMemberId` | String? | Unique - one member coordinates one region |

Relations: `Branch`, `Family[]`, `User[]`, `Member` (coordinator)

#### Family
| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | Primary key |
| `familyName` | String | Surname/household name |
| `address` | String? | Street address |
| `provinsi` through `kelurahan` | String? | Indonesian admin regions |
| `regionId` | String | FK to Region |

Relations: `Region`, `Member[]`

#### Member
| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | Primary key |
| `firstName`, `lastName` | String | Full name |
| `birthCity` | String | Place of birth |
| `gender` | Gender enum | `MALE` / `FEMALE` |
| `birthDate` | DateTime | Date of birth |
| `phone` | String | Contact number |
| `role` | MemberRole | `FAMILY_HEAD`, `WIFE`, `CHILD`, etc. |
| `isActive` | Boolean | Default true |
| `isDeceased` | Boolean | Default false |
| `bloodType` | BloodType? | A, B, AB, O — set via the member form |
| `pelkat` | MemberPelkat? | Computed from age/gender/role; not persisted by the form |
| `statusBaptis` / `statusSidi` / `statusPerkawinan` | Enums | Sacramental status |
| `jabatan` | Jabatan? | Church position; `DIAKEN`/`PENATUA` = presbyter |
| `familyId` | String | FK to Family |
| `tanggalPindah` | DateTime? | Date of transfer out |

Relations: `Family`, `Region` (coordinator, optional)

> **Presbyters** are derived from `jabatan` (`DIAKEN` or `PENATUA`) — there is no `isPresbyter` column (removed in a 2026 migration).

**Database indexes:** familyId, firstName, lastName, isActive, gender, pelkat, birthDate

#### Attendance
| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | Primary key |
| `serviceDate` | DateTime | Date of service |
| `serviceType` | String | e.g. "Sunday Service", "Wednesday Service" |
| `maleCount` / `femaleCount` / `totalCount` | Int | Attendance breakdown |

**Unique constraint:** `(serviceDate, serviceType)`

### Pelkat (Member Classification)

Pelkat is a computed categorization derived from member age, gender, and family role:

| Pelkat | Criteria |
|--------|----------|
| `PELAYANAN_ANAK` | Age 0–12, not married |
| `PERSEKUTUAN_TARUNA` | Age 13–16, not married |
| `GERAKAN_PEMUDA` | Age 17–35, not married |
| `PERSEKUTUAN_KAUM_BAPAK` | Male, age 36–59, OR married male under 36 |
| `PERSEKUTUAN_KAUM_PEREMPUAN` | Female, age 36–59, OR married female under 36 |
| `PERSEKUTUAN_KAUM_LANJUT_USIA` | Age 60+ |

Logic lives in `determinePelkat()` and `buildPelkatWhere()` in `lib/helper.ts`.

### Enums

```typescript
enum Gender { MALE, FEMALE }
enum MemberRole { FAMILY_HEAD, WIFE, CHILD, OTHER, ORANG_TUA, CUCU, KAKAK_ADIK_KANDUNG, FAMILI_LAIN }
enum BloodType { A, B, AB, O }
enum BaptisStatus { SUDAH, BELUM }
enum SidiStatus { SUDAH, BELUM }
enum PerkawinanStatus { BELUM_MENIKAH, JANDA, DUDA, MENIKAH }
enum Jabatan { DIAKEN, PENATUA, PENGURUS_PELKAT, PENGURUS_KOMISI }
enum MemberPelkat { PELAYANAN_ANAK, PERSEKUTUAN_TARUNA, GERAKAN_PEMUDA, PERSEKUTUAN_KAUM_BAPAK, PERSEKUTUAN_KAUM_PEREMPUAN, PERSEKUTUAN_KAUM_LANJUT_USIA }
```

---

## API Reference

### Response Format

All list endpoints return a consistent paginated response:

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

### Common Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | `1` | Page number (1-indexed) |
| `limit` | number | `10` | Items per page |
| `search` | string | `""` | Text search across relevant fields |

### Endpoints

#### Dashboard

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/api/dashboard/counts` | Aggregated stats: total members, families, regions, branches + gender, blood type, pelkat counts | Required |

#### Branches

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/api/branch` | List with search + pagination + region includes | Required |
| `POST` | `/api/branch` | Create (`name` required) | Required |
| `GET` | `/api/branch/:id` | Get by ID | Required |
| `PATCH` | `/api/branch/:id` | Update | Required |
| `DELETE` | `/api/branch/:id` | Delete | Required |

#### Regions

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/api/region` | List with branch, family, coordinator includes | Required |
| `POST` | `/api/region` | Create (`name`, `branchId` required) | Required |
| `GET/PATCH/DELETE` | `/api/region/:id` | CRUD by ID | Required |
| `GET` | `/api/region/member-count` | Members per region (raw SQL query) | Required |
| `GET` | `/api/region/member-count` | Filters by coordinator's region when role=COORDINATOR | Required |

#### Families

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/api/family` | List with region + member includes, sortable by `familyName`, `regionName`, `address` | Required |
| `POST` | `/api/family` | Create with optional nested member creation | Required |
| `GET/PATCH/DELETE` | `/api/family/:id` | CRUD by ID | Required |
| `PATCH` | `/api/family/:id/status` | Cascade status (isActive) update to all members | Required |
| `GET` | `/api/family/count` | Total family count | Required |
| `POST` | `/api/family/split` | Split family: moves members to new family, promotes one as FAMILY_HEAD | Required |

#### Members

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/api/member` | List with family+region includes, filterable by `region`, `pelkat`; sortable by `firstName`, `role`, `familyRegionName`, `pelkat`, `isActive` | Required |
| `POST` | `/api/member` | Create (firstName, gender, birthDate, role, familyId required) | Required |
| `GET/PATCH/DELETE` | `/api/member/:id` | CRUD by ID | Required |
| `GET` | `/api/member/presbyter` | List only presbyters with region filter | Required |

**Filtering per coordinator role:** When the user role is `COORDINATOR`, members are automatically filtered by the coordinator's assigned region.

**Pelkat filtering:** When `pelkat` query param is provided, members are fetched (with pelkat computed server-side via `attachPelkat()`) and filtered in-memory since pelkat is a derived field.

#### Attendance

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/api/attendance` | List with search by serviceType | Required |
| `POST` | `/api/attendance` | Create (serviceDate, serviceType, maleCount, femaleCount required) | Required |
| `GET/PATCH/DELETE` | `/api/attendance/:id` | CRUD by ID | Required |

#### Users

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/api/user` | List (name, email, role only) | `ADMIN` |
| `POST` | `/api/user` | Create (email, password, role required) | `ADMIN` |
| `PATCH/DELETE` | `/api/user/:id` | Update/Delete | `ADMIN` |

#### Settings

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/api/settings/rbac` | Load persisted RBAC config | Required |
| `PUT` | `/api/settings/rbac` | Save RBAC config | `ADMIN` |

#### Birthday

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/api/birthday` | Weekly birthday members (optionally filtered by `date`) | Required |

Uses raw SQL with `to_char(m."birthDate", 'MM-DD')` for cross-year date matching. Returns `meta.start` and `meta.end` for the computed week range.

#### Report

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/api/report` | Member report filtered by `pelkat` and `region` (flat list with family info) | Required |

#### Indonesian Regions

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/region-indonesia/provinces` | All provinces |
| `GET` | `/api/region-indonesia/regencies?provinceCode=...` | Regencies by province |
| `GET` | `/api/region-indonesia/districts?regencyCode=...` | Districts by regency |
| `GET` | `/api/region-indonesia/villages?districtCode=...` | Villages by district |

Data sourced from the `idn-area-data` npm package.

---

## Authentication & RBAC

### Authentication Flow

Authentication uses **NextAuth v5** with a credentials provider:

1. User submits email + password via login form
2. `signIn("credentials", ...)` calls the authorize function in `auth.ts`
3. Prisma looks up the user by email
4. `bcrypt.compare()` validates the password against the stored hash
5. On success, JWT callback copies `id`, `role`, and `regionId` into the token
6. Session callback copies these into the session object
7. Client-side `auth-session.ts` persists the session to localStorage and dispatches a custom event

### Session Configuration (`auth.config.ts`)

```typescript
{
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  trustHost: true,
  pages: { signIn: "/public/login" },
  session: { strategy: "jwt" },  // No database sessions
}
```

### Server-Side Guards (`lib/server-auth.ts`)

| Function | Returns | Description |
|----------|---------|-------------|
| `getSessionUser()` | `{ id, email, name, role, regionId } \| null` | Parsed session user with normalized role |
| `requireAuth()` | `{ user, error }` | Returns 401 if unauthenticated |
| `requireAdmin()` | `{ user, error }` | Returns 403 if role is not ADMIN |
| `requireEditAccess(pathname)` | `{ user, error }` | Returns 403 if the user's role is not in the route's persisted `edit` list |
| `requireViewAccess(pathname)` | `{ user, error }` | Returns 403 if the user's role is not in the route's persisted `view` list |

Used in API routes: `requireAdmin()` on user management and RBAC settings, `requireEditAccess()` on every write endpoint (member/family/region/branch/attendance create, update, delete, status, split), and `requireViewAccess()` on every read endpoint (lists, single items, counts, birthday, report, dashboard) so the API enforces the same role lists as the client UI.

> **Server-side RBAC:** Client-side guards hide buttons, but the API enforces the same view/edit lists server-side (defaults merged with the persisted `role_access_config`). A view-only `MEMBER` role user can no longer read family/region/dashboard/report data or mutate records by calling the API directly.

### Client-Side Guards

**`RbacGuard`** (`components/auth/rbac-guard.tsx`): Wraps dashboard layout pages. Checks the current path against the stored role access config. Shows "Access Restricted" page if the user's role lacks view permission.

**`usePageAccess()`** hook: Returns `{ canView, canEdit, role }` for the current path. Used by feature components to conditionally show/hide edit buttons and actions.

### Roles

| Role | Access Level |
|------|-------------|
| `ADMIN` | Full access to all pages and settings |
| `STAFF` | CRUD on members, families, regions, attendance |
| `COORDINATOR` | View/edit members and families in their assigned region |
| `MEMBER` | View-only access to members page |

### Default Route Permissions

| Route | View | Edit |
|-------|------|------|
| `/dashboard` | ADMIN, STAFF, COORDINATOR | ADMIN, STAFF |
| `/dashboard/branches` | ADMIN, STAFF | ADMIN, STAFF |
| `/dashboard/regions` | ADMIN, STAFF, COORDINATOR | ADMIN, STAFF |
| `/dashboard/birthday` | ADMIN, STAFF, COORDINATOR | ADMIN, STAFF, COORDINATOR |
| `/dashboard/families` | ADMIN, STAFF, COORDINATOR | ADMIN, STAFF, COORDINATOR |
| `/dashboard/members` | ADMIN, STAFF, COORDINATOR, MEMBER | ADMIN, STAFF, COORDINATOR |
| `/dashboard/presbytery` | ADMIN, STAFF, COORDINATOR, MEMBER | ADMIN, STAFF, COORDINATOR |
| `/dashboard/pelkat-members` | ADMIN, STAFF | ADMIN, STAFF |
| `/dashboard/report` | ADMIN, STAFF | ADMIN, STAFF |
| `/dashboard/attendance` | ADMIN, STAFF | ADMIN, STAFF |
| `/dashboard/users` | ADMIN | ADMIN |
| `/dashboard/settings` | ADMIN | ADMIN |

Route `/dashboard/settings` is hardcoded as admin-only — even persisted overrides cannot change this.

### RBAC Persistence

1. **Admin edits permissions** via the role-access-matrix UI in `/dashboard/settings`
2. Config is **saved to the database** via `PUT /api/settings/rbac` → stored in `AppSetting` under key `role_access_config`
3. On save, the response is **mirrored to localStorage and a cookie** by `lib/rbac-config.ts`
4. The sidebar (`nav/const.ts`) and RbacGuard read from the persisted config
5. A custom event `role-access-config-updated` is dispatched to notify subscribers

### Coordinator Scoping

When a user has `role === "COORDINATOR"` and a `regionId` set on their account:
- Family, member, and region API queries are automatically scoped to their region
- **Writes are scoped too:** creating a member requires a family in their region, and updating/deleting members, families, or changing family status/splitting is rejected (403) when the target family is outside their region
- Birthday queries filter to their region's members
- Dashboard counts, gender/blood-type/pelkat breakdowns, and the region table only reflect their region

---

## Component Library

### UI Primitives (`components/ui/`)

All built with **Radix UI** primitives, **Tailwind CSS 4**, and styled via the shadcn theming system.

| Component | Radix Primitive | Description |
|-----------|----------------|-------------|
| `Button` | - | Variants: default, secondary, destructive, outline, ghost, link |
| `Input` | - | Form input with focus ring |
| `Select` | `@radix-ui/react-select` | Dropdown with search |
| `Dialog` | `@radix-ui/react-dialog` | Modal overlay |
| `Table` | - | Data table with sticky headers |
| `Badge` | - | Status badge with color variants |
| `Card` | - | Content card with header/content/footer |
| `DropdownMenu` | `@radix-ui/react-dropdown-menu` | Context menus |
| `Sidebar` | - | Collapsible sidebar with mobile overlay |
| `Tooltip` | `@radix-ui/react-tooltip` | Hover tooltips |
| `Avatar` | `@radix-ui/react-avatar` | User avatar with initials fallback |
| `Skeleton` | - | Loading skeleton |
| `Sheet` | `@radix-ui/react-dialog` | Slide-out panel |
| `Switch` | `@radix-ui/react-switch` | Toggle switch |
| `Separator` | `@radix-ui/react-separator` | Visual divider |
| `DataTableControls` | - | Shared pagination/search bar |
| `PelkatSelect` | - | Pelkat dropdown filter |
| `ButtonGroup` | - | Inline button grouping |

### Feature Components

#### Dashboard (`components/dashboard/`)

| Component | Purpose |
|-----------|---------|
| `Dashboard` | Main dashboard overview — fetches all counts, renders stat sections |
| `OverviewStat` | Total members, families, regions stat cards |
| `GenderStat` | Male/female distribution cards |
| `BloodTypeStat` | Blood type (A/B/AB/O) distribution cards |
| `MemberStat` | Pelkat distribution breakdown cards |
| `RegionTable` | Members per region table (clickable to filter members page) |
| `BirthdayDashboard` | Weekly birthday display with date picker + XLS export |
| `StatCard` | Memoized card component for displaying a metric |
| `EntityManager` | Generic CRUD manager (used by legacy pages) |

#### Members (`components/members/`)

- **MembersPage**: Full member list with sorting (name, role, region, pelkat, status), search, region/pelkat filters, and quick-edit dialogs for status and split-family operations
- **MemberDialog**: Comprehensive create/edit form with sacramental data, church position, and additional info
- **DataTableMemberControls**: Search bar + pagination + region/pelkat filter dropdowns

#### Families (`components/family/`)

- **FamiliesPage**: Family list with sortable columns, member count, and status display
- **FamilyDialog**: Create/edit family with Indonesian admin region cascading selects and inline member creation
- **SplitFamilyDialog**: Split a family into two — select members to move, set new family name and region

#### Reports (`components/report/`)

- ReportPage: Filter by Pelkat and Region → export to XLSX or print-to-PDF

### Theming

The app uses a gold/navy color palette with CSS custom properties in `app/globals.css`:

```css
:root {
  --background: oklch(0.985 0.01 84);
  --foreground: oklch(0.24 0.03 252);
  --primary: oklch(0.43 0.13 243);       /* Navy */
  --accent: oklch(0.79 0.13 74);          /* Gold */
  --sidebar: oklch(0.24 0.04 247);        /* Dark navy sidebar */
  --sidebar-primary: oklch(0.8 0.13 74); /* Gold accent on sidebar */
  --radius: 0.75rem;
}
```

Both light and dark mode are supported.

---

## Hooks Reference

### TanStack Query Hooks

All hooks follow a consistent pattern:
- `use{Entity}` for list queries
- `use{Entity}(id)` for single entity queries
- `useCreate{Entity}`, `useUpdate{Entity}`, `useDelete{Entity}` for mutations
- Mutations automatically invalidate their query keys on success

#### Members (`hooks/use-member.ts`)

| Hook | Query Key | Notes |
|------|-----------|-------|
| `useMembers({ page, limit, search, region, pelkat, sortBy, sortOrder })` | `['member', ...params]` | Paginated, filterable member list |
| `useMember(id)` | `['member', id]` | Single member, disabled for empty id |
| `usePresbyters({ page, limit, search, region, sortBy, sortOrder })` | `['member', ...params]` | Presbyter-only list |
| `useCreateMember()` | invalidates `['member']`, `['family']` | |
| `useUpdateMember()` | invalidates `['member']`, `['family']` | |
| `useDeleteMember()` | invalidates `['member']`, `['family']` | |


#### Families (`hooks/use-family.ts`)

| Hook | Query Key |
|------|-----------|
| `useFamilies(page, limit, search, sortBy, sortOrder)` | `['family', ...params]` |
| `useFamily(id)` | `['family', id]` |
| `useCreateFamily()` | invalidates `['family']` |
| `useUpdateFamily()` | invalidates `['family']` |
| `useDeleteFamily()` | invalidates `['family']` |

#### Regions (`hooks/use-region.ts`)

| Hook | Query Key |
|------|-----------|
| `useRegions(page, limit, search, sortBy, sortOrder)` | `['region', ...params]` |
| `useRegion(id)` | `['region', id]` |
| `useMemberPerRegions()` | `['region', 'member-count']` |
| `useCreateRegion()` / `useUpdateRegion()` / `useDeleteRegion()` | invalidates `['region']` |

#### Branches, Attendance, Users

These follow the same pattern as Families.

#### Birthday (`hooks/use-birthday.ts`)

| Hook | Query Key |
|------|-----------|
| `useBirthdayMembers(date?)` | `['birthday-members', date]` |

#### RBAC Settings (`hooks/use-rbac-settings.ts`)

| Hook | Query Key |
|------|-----------|
| `useRoleAccessSettings()` | `['rbac-settings']` |
| `useSaveRoleAccessSettings()` | invalidates `['rbac-settings']` |

### Utility Hooks

#### `useDialogForm(reset, defaultValues, { editing, open })`
Resets a react-hook-form when `editing` or `open` changes. Handles Date-to-string conversion for date inputs. Eliminates the identical `useEffect` pattern duplicated across dialog components.

#### `usePageAccess(pathname?)`
Returns `{ canView, canEdit, role }` by reading the current user and RBAC config from stored client state. Used throughout feature components to conditionally show/hide edit capabilities.

#### `useIsMobile()`
Returns `true` when viewport width < 768px. Uses `matchMedia` for reactive updates.

#### `useUrlSort(initialSortBy, initialSortOrder)`
Returns `{ sortBy, sortOrder, handleSort }` for sortable table headers. Initial values come from the server page (which reads `searchParams`), and sorting writes `?sortBy=...&sortOrder=...` into the URL via `history.replaceState` (preserving existing params) so sort state survives refresh and navigation. Used by every sortable dashboard table.

#### `useProvinces()`, `useRegencies()`, `useDistricts()`, `useVillages(provinceCode|regencyCode|districtCode)`
Cascading Indonesian administrative region selects. Data is cached indefinitely (`staleTime: Infinity, gcTime: Infinity`) since region data is stable.

### Query Client Configuration (`lib/providers.tsx`)

```typescript
new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,           // 30s before refetch
      gcTime: 5 * 60 * 1000,       // 5min in cache
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})
```

React Query Devtools are enabled in development mode.

---

## Lib Utilities

### Server-Side (`lib/helper.ts`)

| Function | Description |
|----------|-------------|
| `toTitleCase(str)` | Converts "member management" → "Member Management" |
| `getErrorMessage(error, fallback)` | Extracts error message from API response, Error instance, or falls back |
| `toPaginatedResult(payload, page, limit)` | Normalizes various pagination payload shapes into `{ items, meta }` |
| `attachPelkat(member)` | Returns member with computed `pelkat` field attached |
| `determinePelkat(member)` | Pure function computing pelkat from age, gender, role |
| `calculateAge(birthDate)` | Age calculation accounting for month/day |
| `buildPelkatWhere(pelkat)` | Builds Prisma `where` clause for Pelkat grouping (used by dashboard counts) |

### Client-Side (`lib/client-helper.ts`)

| Function | Description |
|----------|-------------|
| `getServiceTypeColor(type)` | Maps service types to badge variants |
| `formatPelkatName(input)` | Converts `PELAYANAN_ANAK` → `Pelayanan Anak` |
| `formatDate(value)` | Formats Date/string to locale date string |
| `formatLabel(value)` | Replaces underscores with spaces |
| `buildMemberAddress(member)` | Constructs address string from family/member fields, respecting `sameAddressAsFamily` flag |

### Shared (`lib/utils.ts`)

| Function | Description |
|----------|-------------|
| `cn(...inputs)` | Tailwind class merging via `clsx` + `tailwind-merge` |

### RBAC (`lib/rbac.ts`)

Key types:

```typescript
type AppRole = "ADMIN" | "STAFF" | "COORDINATOR" | "MEMBER";
type RouteAccessEntry = { view: string[]; edit: string[] };
type RoleAccessConfig = Record<string, RouteAccessEntry>;
```

Key functions:

| Function | Description |
|----------|-------------|
| `normalizeAppRole(role)` | Normalizes role strings (e.g., "admin" → "ADMIN") |
| `hasRequiredRole(role, allowedRoles)` | Checks if user's role is in allowed list |
| `resolveRoleAccessConfig(overrides)` | Merges overrides with defaults, enforces admin-only routes |
| `getRouteAccessForPath(pathname, config)` | Returns `{ view, edit }` for a given path |
| `canViewPath(role, pathname, config)` / `canEditPath(...)` | Permission checks |
| `getDefaultDashboardPath(role)` | Returns redirect path per role |

---

## State & Session Management

### Auth Session (`lib/auth-session.ts`)

Persistence layer for auth state on the client:

| Function | Description |
|----------|-------------|
| `persistAuthSession({ token?, user })` | Stores to localStorage, dispatches `auth-session-updated` event |
| `clearAuthSession()` | Removes from localStorage, dispatches event |
| `getStoredUser()` | Reads user from localStorage |
| `subscribeToAuthSession(callback)` | Subscribes to storage & custom events |

Used by `useStoredUser()` hook for reactive session reads.

### RBAC Config (`lib/rbac-config.ts`)

Client-side mirror of the RBAC configuration:

| Function | Description |
|----------|-------------|
| `getStoredRoleAccessConfig()` | Reads from localStorage, parses and caches |
| `persistRoleAccessConfig(config)` | Saves to localStorage + cookie, dispatches `role-access-config-updated` |
| `resetStoredRoleAccessConfig()` | Restores defaults |
| `useStoredRoleAccessConfig()` | React hook (uses `useSyncExternalStore`) |
| `useStoredRoleAccessMap()` | View-only map derived from config |

### Provider Stack (`lib/providers.tsx`)

```
Providers
├── QueryClientProvider (TanStack Query)
│   ├── SessionProvider (NextAuth)  → wraps AuthProvider
│   │   └── children
│   └── ReactQueryDevtools (dev only)
```

---

## Dynamic Routing & Proxying

### `proxy.ts`

In Next.js 16, route-level redirects replace the older middleware convention. The proxy:

- Redirects unauthenticated users from dashboard pages to `/public/login`
- Redirects authenticated users away from the login page to their default dashboard
- Skips Next.js internals (`_next/*`) and static files

### `lib/proxy-config.ts`

Matcher pattern used in tests:

```typescript
export const proxyConfig = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon\\.ico|login|register|public).*)"],
}
```

### Indonesian Region Routes

Dynamic cascading select data sourced from `idn-area-data`:

```
/api/region-indonesia/provinces       → All 34+ provinces
/api/region-indonesia/regencies?provinceCode=31  → Regencies in Jakarta
/api/region-indonesia/districts?regencyCode=3171 → Districts in Jakarta Pusat
/api/region-indonesia/villages?districtCode=317101 → Villages in Gambir
```

---

## Testing

### Test Suite

- **Framework:** Vitest 4
- **Environment:** jsdom (for component/hook tests)
- **Total tests:** 386 across 20 test files

### Running Tests

```bash
npm run test          # Run all tests once
npm run test:watch    # Watch mode
```

### Test Coverage

| File | Tests | Description |
|------|-------|-------------|
| `utils.test.ts` | 5 | `cn()` utility |
| `helper.test.ts` | 19 | Server helpers (pelkat, age, pagination, parsePagination) |
| `client-helper.test.ts` | 15 | Client formatting (title case, dates, labels) |
| `schemas.test.ts` | 17 | Zod validation schemas (auth, user, member/bloodType) |
| `api-validate.test.ts` | 22 | `validateBody` / `handleApiError` machinery |
| `components.test.tsx` | 12 | Component rendering |
| `components-additional.test.tsx` | 24 | Page rendering with mocked hooks |
| `hooks.test.tsx` | 46 | TanStack Query hook behaviors |
| `use-dialog-form.test.tsx` | 14 | Dialog form reset hook |
| `use-page-access.test.tsx` | 7 | Page access hook |
| `use-mobile.test.tsx` | 6 | Mobile breakpoint hook |
| `use-indonesia-region.test.tsx` | 15 | Indonesian region cascade hooks |
| `auth-session.test.ts` | 27 | Client auth session persistence |
| `server-auth.test.ts` | 15 | Server auth guards (incl. requireEditAccess) |
| `auth-config.test.ts` | 3 | NextAuth config structure |
| `rbac.test.ts` | 19 | RBAC logic (normalize, hasRequired, access checks) |
| `rbac-config.test.ts` | 21 | Client RBAC config persistence |
| `integration-rbac-settings.test.ts` | 6 | RBAC server persistence with Prisma |
| `proxy.test.ts` | 2 | Proxy matcher config |
| `api-client.test.ts` | 83 | API client fetch functions |

### Testing Patterns

- API functions are mocked with `vi.mock()` at the module level
- Hooks are tested with `renderHook()` from `@testing-library/react`
- Each test creates a fresh `QueryClient` with `retry: false` and `gcTime: 0`
- Mock localStorage for tests that depend on browser storage

---

## Development Workflow

### Available Scripts

```bash
npm run dev              # Start development server
npm run build            # Build for production (generates Prisma client first)
npm run start            # Start production server
npm run lint             # Run ESLint
npm run test             # Run Vitest
npm run test:watch       # Run Vitest in watch mode
npm run prisma:generate  # Regenerate Prisma client
npm run prisma:migrate   # Apply database migrations
npm run prisma:seed      # Seed demo data (safe re-run; refuses to wipe existing data)
npm run prisma:seed -- --reset  # Wipe existing data and reseed from scratch
```

### Lint Status

The project uses ESLint 9 with `eslint-config-next` (core-web-vitals + TypeScript rules).

- **Passes with 0 errors.** `@typescript-eslint/no-explicit-any` is relaxed for `tests/**` (mock data) and the one-off diagnostic scripts in `scripts/qa/**` are ignored entirely.
- The only remaining item is a single `react-hooks/incompatible-library` warning for `useForm().watch()` in `user-dialog.tsx` — intentional (see Code Quality Notes).

### Code Quality Notes

- **React Compiler:** React 19's compiler may warn about ref access during render and setState-in-effect patterns. The codebase handles these appropriately where needed.
- **React Hook Form:** The `useForm().watch()` API is incompatible with React Compiler's memoization in `user-dialog.tsx` — the component is intentionally excluded from optimization.
- **Coordinates:** API route handlers use `catch` without capturing unused error variables for cleaner lint output. Routes that use the error (for console.error or instanceof checks) still capture it.

### Pagination Strategy

1. API routes receive `page`, `limit`, and optional `search` parameters
2. Prisma `$transaction([findMany, count])` runs both queries atomically
3. Response uses `{ data, meta }` format with pagination metadata
4. Client-side `DataTableControls` or `DataTableMemberControls` component manages page state
5. Search resets to page 1, limit changes reset to page 1

### Pelkat Computation

Pelkat is **not stored by default** in the database (though the `pelkat` field exists on the schema). The primary approach is:
1. **Server-side:** `attachPelkat()` is called in API routes after fetching members
2. **Dashboard counts:** `buildPelkatWhere()` constructs Prisma where clauses for each pelkat group
3. **Derived from:** birthDate, gender, role, isActive, isDeceased

---

## Deployment

### Environment Variables

Required on the production server:

```bash
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."          # For connection pooling (e.g., Supabase)
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-secure-secret"
```

### Build

```bash
npm run build
```

The build step runs `prisma generate` before `next build` to compile the Prisma client.

### Netlify Deployment

The `AUTH_SECRET` environment variable is available as a fallback for `NEXTAUTH_SECRET`. Add all environment variables in Netlify's Site settings → Environment variables.

---

## Useful Links

- [API Reference](docs/API.md)
- [Data Model](docs/DATA_MODEL.md)
- [Authentication & RBAC](docs/AUTH_RBAC.md)
- [AGENTS.md](AGENTS.md) — Next.js 16 specific conventions
