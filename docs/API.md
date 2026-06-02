# API Reference

All API handlers live under `app/api`. Most list endpoints accept:

- `page`: positive integer, default `1`
- `limit`: positive integer, default `10`
- `search`: optional text filter

Paginated responses use:

```ts
{
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
```

## Authentication

| Route | Method | Description |
| --- | --- | --- |
| `/api/auth/[...nextauth]` | NextAuth handlers | Credentials login, JWT session handling, sign-in/sign-out callbacks |

Dashboard page redirects are handled by `proxy.ts`, while protected API handlers call `requireAuth()` or `requireAdmin()` from `lib/server-auth.ts`.

## Branches

| Route | Method | Description |
| --- | --- | --- |
| `/api/branch` | `GET` | List branches with regions |
| `/api/branch` | `POST` | Create a branch |
| `/api/branch/:id` | `GET` | Get a branch by id |
| `/api/branch/:id` | `PATCH` | Update a branch |
| `/api/branch/:id` | `DELETE` | Delete a branch |

Create/update fields:

- `name` required

## Regions

| Route | Method | Description |
| --- | --- | --- |
| `/api/region` | `GET` | List regions with branch, families, and coordinator |
| `/api/region` | `POST` | Create a region |
| `/api/region/:id` | `GET` | Get a region by id |
| `/api/region/:id` | `PATCH` | Update a region |
| `/api/region/:id` | `DELETE` | Delete a region |

Create fields:

- `name` required
- `branchId` required

Region records can optionally link a coordinator member through `coordinatorMemberId`.

## Families

| Route | Method | Description |
| --- | --- | --- |
| `/api/family` | `GET` | List families with region and members |
| `/api/family` | `POST` | Create a family, optionally with nested members |
| `/api/family/:id` | `GET` | Get a family by id |
| `/api/family/:id` | `PATCH` | Update a family and member list |
| `/api/family/:id` | `DELETE` | Delete a family |
| `/api/family/count` | `GET` | Return total family count |

Create fields:

- `familyName` required
- `regionId` required
- `address` optional
- `members` optional array of member payloads

## Members

| Route | Method | Description |
| --- | --- | --- |
| `/api/member` | `GET` | List members with family and derived `pelkat` |
| `/api/member` | `POST` | Create a member |
| `/api/member/:id` | `GET` | Get a member by id |
| `/api/member/:id` | `PATCH` | Update a member |
| `/api/member/:id` | `DELETE` | Delete a member |
| `/api/member/count` | `GET` | Return all, female, and male member counts |
| `/api/member/pelkat-count` | `GET` | Return counts grouped by Pelkat |

Create fields:

- `name` required
- `gender` required: `MALE` or `FEMALE`
- `birthDate` required
- `role` required: `FAMILY_HEAD`, `WIFE`, `CHILD`, or `OTHER`
- `familyId` required
- `phone`, `email`, `isActive`, `isDeceased`, and `deathDate` optional

Pelkat values are derived in `lib/helper.ts`; they are not stored directly on the member model.

## Attendance

| Route | Method | Description |
| --- | --- | --- |
| `/api/attendance` | `GET` | List attendance records |
| `/api/attendance` | `POST` | Create an attendance record |
| `/api/attendance/:id` | `GET` | Get an attendance record by id |
| `/api/attendance/:id` | `PATCH` | Update an attendance record |
| `/api/attendance/:id` | `DELETE` | Delete an attendance record |

Create fields:

- `serviceDate` required
- `serviceType` required
- `maleCount` required
- `femaleCount` required

`totalCount` is calculated by the API. The database enforces one record per `serviceDate` and `serviceType`.

## Users

| Route | Method | Description | Access |
| --- | --- | --- | --- |
| `/api/user` | `GET` | List users | `ADMIN` |
| `/api/user` | `POST` | Create a user | `ADMIN` |
| `/api/user/:id` | `PATCH` | Update a user | `ADMIN` |
| `/api/user/:id` | `DELETE` | Delete a user | `ADMIN` |

Roles are normalized against `ADMIN`, `STAFF`, `COORDINATOR`, and `MEMBER`.

## RBAC Settings

| Route | Method | Description | Access |
| --- | --- | --- | --- |
| `/api/settings/rbac` | `GET` | Load route access configuration | Authenticated users |
| `/api/settings/rbac` | `PUT` | Save route access configuration | `ADMIN` |

The persisted payload is normalized by `saveRoleAccessConfigToDb()` before storing it in `AppSetting` under the key `role_access_config`.
