# Authentication and RBAC

## Authentication Flow

Authentication is implemented with NextAuth v5.

- `auth.config.ts` holds shared config such as the custom sign-in page and JWT session strategy.
- `auth.ts` adds the Prisma adapter and credentials provider.
- `app/api/auth/[...nextauth]/route.ts` exports the NextAuth route handlers.
- `proxy.ts` redirects unauthenticated dashboard users to `/public/login` and redirects logged-in users away from the login page.

Credentials login checks:

1. The submitted email and password exist.
2. The user exists in the database.
3. The user has a stored password hash.
4. `bcrypt.compare()` validates the password.
5. The role is normalized with `normalizeAppRole()`.

JWT and session callbacks copy the user id and normalized role into the token/session.

## Server-Side Guards

`lib/server-auth.ts` provides API helpers:

- `getSessionUser()` returns the authenticated session user or `null`.
- `requireAuth()` returns a `401 Unauthorized` JSON response if the user is missing.
- `requireAdmin()` returns a `403 Forbidden` JSON response unless the user role is `ADMIN`.

The user and RBAC settings APIs use these helpers.

## Client-Side Guards

`components/auth/rbac-guard.tsx` wraps dashboard pages. It checks the current path against the stored role access config and shows an access restricted screen if the user's role cannot view that page.

`hooks/use-page-access.ts` returns:

- `canView`
- `canEdit`
- `role`

Feature components use this hook to hide or disable edit actions.

## Default Route Access

Defaults are defined in `defaultProtectedRoutes` in `lib/rbac.ts`.

| Route | View Roles | Edit Roles |
| --- | --- | --- |
| `/dashboard` | `ADMIN`, `STAFF`, `COORDINATOR` | `ADMIN`, `STAFF` |
| `/dashboard/branches` | `ADMIN`, `STAFF` | `ADMIN`, `STAFF` |
| `/dashboard/regions` | `ADMIN`, `STAFF`, `COORDINATOR` | `ADMIN`, `STAFF` |
| `/dashboard/families` | `ADMIN`, `STAFF`, `COORDINATOR` | `ADMIN`, `STAFF`, `COORDINATOR` |
| `/dashboard/members` | `ADMIN`, `STAFF`, `COORDINATOR`, `MEMBER` | `ADMIN`, `STAFF`, `COORDINATOR` |
| `/dashboard/pelkat-members` | `ADMIN`, `STAFF` | `ADMIN`, `STAFF` |
| `/dashboard/attendance` | `ADMIN`, `STAFF` | `ADMIN`, `STAFF` |
| `/dashboard/users` | `ADMIN` | `ADMIN` |
| `/dashboard/settings` | `ADMIN` | `ADMIN` |

`/dashboard/settings` remains admin-only even when overrides are merged.

## Persisted Access Settings

Admins can save route access settings through `/api/settings/rbac`.

Persistence path:

1. The settings UI sends a `RoleAccessConfig`.
2. `saveRoleAccessConfigToDb()` parses and normalizes it.
3. The config is stored in `AppSetting` under `role_access_config`.
4. Client state is mirrored into localStorage and a cookie by `lib/rbac-config.ts`.

The config shape is:

```ts
type RoleAccessConfig = Record<
  string,
  {
    view: string[];
    edit: string[];
  }
>;
```

Older array-only settings are still accepted by `parseRoleAccessConfig()` for migration compatibility.
