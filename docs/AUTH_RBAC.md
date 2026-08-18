# Authentication & RBAC

## Authentication Flow

Authentication uses **NextAuth v5** with a credentials provider.

```
auth.config.ts              Shared config (signIn page, JWT strategy, secret)
auth.ts                     Prisma adapter + credentials provider + callbacks
app/api/auth/[...nextauth]/route.ts   NextAuth route handlers
```

### Login Flow

1. User submits email + password via the login form at `/public/login`
2. `signIn("credentials", ...)` calls the `authorize` function in `auth.ts`
3. `prisma.user.findUnique({ where: { email } })` looks up the user
4. `bcrypt.compare()` validates the password against the stored hash
5. On success, the JWT callback copies `id`, `role`, and `regionId` into the token
6. The session callback copies these into the session object
7. The client-side `SessionSync` component persists the session to localStorage and fetches the RBAC config

### Session Configuration (`auth.config.ts`)

```typescript
{
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  trustHost: true,
  pages: { signIn: "/public/login" },
  session: { strategy: "jwt" },  // No database sessions, JWT-based
}
```

### Credentials Provider Behavior (`auth.ts`)

- Returns `null` if email/password is missing, user not found, password not set, or password doesn't match
- On success, returns `{ id, email, name, role, regionId }` with `normalizeAppRole()` applied
- The `jwt` callback copies `token.id`, `token.role`, `token.regionId` from the authorize return
- The `session` callback copies these into `session.user`

---

## Server-Side Guards (`lib/server-auth.ts`)

| Function | Returns | Description |
|----------|---------|-------------|
| `getSessionUser()` | `{ id, email?, name?, role, regionId? } \| null` | Calls `auth()`, returns parsed user with normalized role |
| `requireAuth()` | `{ user, error }` | Returns `401 Unauthorized` response if no session |
| `requireAdmin()` | `{ user, error }` | Returns `403 Forbidden` if role is not `ADMIN` |
| `requireEditAccess(pathname)` | `{ user, error }` | Returns `403 Forbidden` if the user's role is not in the route's persisted `edit` list |
| `requireViewAccess(pathname)` | `{ user, error }` | Returns `403 Forbidden` if the user's role is not in the route's persisted `view` list |

Used in API routes:
- `/api/user` (user CRUD) — `requireAdmin()`
- `/api/settings/rbac` (PUT) — `requireAdmin()`
- `/api/settings/rbac` (GET) — `requireAuth()` (bootstrap for all roles; must stay role-agnostic)
- **All write endpoints** (member/family/region/branch/attendance create, update, delete, status, split) — `requireEditAccess("/dashboard/<route>")`
- **All read endpoints** (member/family/region/branch/attendance lists and single items, presbyter, dashboard counts, region member-count, family count, birthday, report) — `requireViewAccess("/dashboard/<route>")`

> **Server-side enforcement:** the middleware only checks authentication (401). Role permissions are enforced per-route by `requireEditAccess()` (writes) and `requireViewAccess()` (reads) using the persisted RBAC config, so a `MEMBER` role user cannot read family/region/dashboard/report data or mutate anything through direct API calls even though the UI hides the buttons.

---

## Client-Side Guards

### RbacGuard (`components/auth/rbac-guard.tsx`)

Wraps the dashboard layout (`app/dashboard/layout.tsx`). For every navigation:

1. Reads the current user from `useStoredUser()` (localStorage via `auth-session.ts`)
2. Reads the role access config from `useStoredRoleAccessConfig()` (localStorage via `rbac-config.ts`)
3. Compares the current path against the config using `canViewPath()`
4. If access is denied, renders an "Access Restricted" card with a button to the user's default dashboard

### usePageAccess (`hooks/use-page-access.ts`)

Returns `{ canView, canEdit, role }` for the current path. Feature components use this to conditionally show/hide edit buttons, action columns, and form controls.

---

## Session Sync (`components/auth/session-sync.tsx`)

This component runs inside the `SessionProvider` and handles three tasks:

1. **On authentication:** Calls `persistAuthSession()` to write the user to localStorage and cookies (`user_role`, `user_email`, `user_name`, `user_region_id`)
2. **On authentication:** Fetches the RBAC config from `/api/settings/rbac` and calls `persistRoleAccessConfig()` to mirror it to localStorage and a cookie
3. **On sign-out:** Calls `clearAuthSession()` to remove localStorage entries and cookies

### Provider Stack (`lib/providers.tsx`)

```
Providers
└── SessionProvider (NextAuth)
    └── SessionSync
        └── children
```

---

## Client Persistence

### Auth Session (`lib/auth-session.ts`)

| Function | Description |
|----------|-------------|
| `persistAuthSession({ token?, user })` | Stores to localStorage + cookies, dispatches `auth-session-updated` event |
| `clearAuthSession()` | Removes from localStorage + cookies, dispatches event |
| `getStoredUser()` | Reads user from localStorage (cached) |
| `useStoredUser()` | React hook using `useSyncExternalStore` for reactive reads |

Dispatched events are picked up by `subscribeToAuthSession` which listens for both custom events and `storage` events (cross-tab sync).

### RBAC Config (`lib/rbac-config.ts`)

| Function | Description |
|----------|-------------|
| `getStoredRoleAccessConfig()` | Reads config from localStorage, parses, caches |
| `getStoredRoleAccessMap()` | Returns view-only map (for sidebar) |
| `persistRoleAccessConfig(config)` | Saves to localStorage + cookie, dispatches `role-access-config-updated` |
| `resetStoredRoleAccessConfig()` | Restores defaults |
| `useStoredRoleAccessConfig()` | React hook via `useSyncExternalStore` |
| `useStoredRoleAccessMap()` | Derived view map hook |

---

## Roles

| Role | Access Level |
|------|-------------|
| `ADMIN` | Full access to all pages and settings |
| `STAFF` | CRUD on members, families, regions, attendance |
| `COORDINATOR` | View/edit members and families in their assigned region only |
| `MEMBER` | View-only access to members page |

### Coordinator Scoping

When a user has `role === "COORDINATOR"` and `regionId` set on their User record:

- **Family queries** (`/api/family`): `where.regionId` is scoped
- **Member queries** (`/api/member`): `where.family.regionId` is scoped
- **Region queries** (`/api/region/member-count`): raw SQL `WHERE r.id = regionId`
- **Birthday queries** (`/api/birthday`): raw SQL `AND r.id = regionId`
- **Dashboard region table**: Only shows the coordinator's region

The `regionId` on the User model links a coordinator to their sector.

---

## Default Route Permissions

Defaults are defined in `defaultProtectedRoutes` in `lib/rbac.ts`. The sidebar routes are in `nav/const.ts`.

| Route | View | Edit | Sidebar Label |
|-------|------|------|---------------|
| `/dashboard` | ADMIN, STAFF, COORDINATOR | ADMIN, STAFF | Dashboard |
| `/dashboard/birthday` | ADMIN, STAFF, COORDINATOR | ADMIN, STAFF, COORDINATOR | Ulang Tahun |
| `/dashboard/branches` | ADMIN, STAFF | ADMIN, STAFF | Wilayah Pelayanan |
| `/dashboard/regions` | ADMIN, STAFF, COORDINATOR | ADMIN, STAFF | Sektor Pelayanan |
| `/dashboard/families` | ADMIN, STAFF, COORDINATOR | ADMIN, STAFF, COORDINATOR | Keluarga |
| `/dashboard/members` | ADMIN, STAFF, COORDINATOR, MEMBER | ADMIN, STAFF, COORDINATOR | Warga Jemaat |
| `/dashboard/presbytery` | ADMIN, STAFF, COORDINATOR, MEMBER | ADMIN, STAFF, COORDINATOR | Majelis Jemaat |
| `/dashboard/pelkat-members` | ADMIN, STAFF | ADMIN, STAFF | Pelkat Members |
| `/dashboard/report` | ADMIN, STAFF | ADMIN, STAFF | — (direct URL only) |
| `/dashboard/attendance` | ADMIN, STAFF | ADMIN, STAFF | Attendance |
| `/dashboard/users` | ADMIN | ADMIN | Users |
| `/dashboard/settings` | ADMIN | ADMIN | Settings |

### Admin Route Hard-Coding

`/dashboard/settings` is **hard-coded as admin-only** — even if persisted RBAC overrides grant other roles access, the `resolveRoleAccessConfig()` function always resets this path to `{ view: ["ADMIN"], edit: ["ADMIN"] }`.

### Default Dashboard Redirect

| Role | Redirect Path |
|------|--------------|
| `ADMIN` | `/dashboard` |
| `STAFF` | `/dashboard` |
| `COORDINATOR` | `/dashboard/families` |
| `MEMBER` | `/dashboard/members` |

---

## RBAC Configuration Persistence

### Config Shape

```typescript
type RouteAccessEntry = { view: string[]; edit: string[] };
type RoleAccessConfig = Record<string, RouteAccessEntry>;
```

Older array-only configs are still accepted for migration compatibility via `parseRoleAccessConfig()`.

### Lifecycle

1. **Admin edits permissions** in the role-access-matrix UI at `/dashboard/settings`
2. **Saved to database** via `PUT /api/settings/rbac` → stored in `AppSetting` under key `role_access_config`
3. **Response is mirrored to client** by `persistRoleAccessConfig()` in `lib/rbac-config.ts`
4. **Mirrored data** goes to `localStorage` (key: `role_access_config`) and a cookie (same key, 30-day expiry)
5. **`role-access-config-updated` event** is dispatched to notify subscribers
6. **Sidebar** (`nav/const.ts`) and **RbacGuard** read from the stored config reactively

### Key Functions (`lib/rbac.ts`)

| Function | Description |
|----------|-------------|
| `normalizeAppRole(role)` | Normalizes "admin" → "ADMIN", handles null/undefined |
| `hasRequiredRole(role, allowedRoles?)` | Checks user role against allowed list — **denies when the list is empty or missing** (never fail-open) |
| `resolveRoleAccessConfig(overrides?)` | Merges overrides with defaults, enforces admin-only routes |
| `getRouteAccessForPath(pathname, config?)` | Returns `{ view, edit }` for a path (longest match wins) |
| `canViewPath(role, pathname, config?)` / `canEditPath(...)` | Permission check helpers |
| `getDefaultDashboardPath(role)` | Returns redirect path per role |
| `parseRoleAccessConfig(rawConfig?)` | Parses JSON config, accepts both `RouteAccessEntry` and legacy `string[]` formats |
| `serializeRoleAccessConfig(config)` | Serializes merged config to JSON |
| `configToViewMap(config)` | Derives view-only `RoleAccessMap` from full config |

### Server-Side Persistence (`lib/rbac-settings.ts`)

```typescript
getRoleAccessConfigFromDb()     // Reads from AppSetting, returns merged config
saveRoleAccessConfigToDb(raw)   // Parses, normalizes, upserts to AppSetting
```
