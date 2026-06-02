# Yudea App

Yudea App is a church administration dashboard for managing branches, regions, families, members, Pelkat grouping, attendance, users, and role-based access settings.

The project is built with Next.js 16 App Router, React 19, Prisma 7, PostgreSQL, NextAuth v5, TanStack Query, shadcn/Radix UI components, Tailwind CSS 4, and Vitest.

## Features

- Dashboard statistics for members, regions, and branches.
- Branch, Sektor Pelayanan, family, member, attendance, and user management.
- Member Pelkat classification derived from age, gender, marital/family role, and active/deceased status.
- Credentials-based authentication with NextAuth and Prisma.
- Role-based page access and edit permissions for `ADMIN`, `STAFF`, `COORDINATOR`, and `MEMBER`.
- Admin settings page for persisted RBAC route access overrides.
- API route handlers for CRUD, counts, and RBAC configuration.

## Project Structure

```text
app/                    Next.js App Router pages, layouts, and API routes
components/             Feature components and shared UI primitives
hooks/                  React Query and page access hooks
lib/                    Auth, Prisma, RBAC, helper, and client API utilities
nav/                    Dashboard navigation configuration
prisma/                 Prisma schema, migrations, and seed data
schemas/                Zod schemas
services/               Service-level utilities
tests/                  Vitest tests
types/                  Shared TypeScript models
proxy.ts                Next.js 16 request proxy for auth redirects
```

For this repository, follow `AGENTS.md`: Next.js APIs and conventions may differ from older versions, so read the relevant files in `node_modules/next/dist/docs/` before changing Next-specific code.

## Requirements

- Node.js 20 or newer
- npm
- PostgreSQL database

## Environment

Create a local `.env` file with at least:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
NEXTAUTH_URL="https://your-site.netlify.app"
NEXTAUTH_SECRET="replace-with-a-secure-random-secret"
```

`DATABASE_URL` is used by Prisma, `lib/prisma.ts`, and `auth.ts`. `NEXTAUTH_URL` and `NEXTAUTH_SECRET` are required by NextAuth in production.

On Netlify, add the same variables in Site settings under Environment variables. If you still use `AUTH_SECRET`, the app will also read it as a fallback.

## Setup

Install dependencies:

```bash
npm install
```

Generate the Prisma client:

```bash
npx prisma generate
```

Apply database migrations:

```bash
npx prisma migrate dev
```

Seed demo data:

```bash
npx prisma db seed
```

Start the development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Demo Accounts

The seed script creates:

| Email               | Password   | Role    |
| ------------------- | ---------- | ------- |
| `admin@example.com` | `admin123` | `ADMIN` |
| `demo@example.com`  | `demo1234` | `STAFF` |

Use these only for local development.

## Scripts

| Command              | Purpose                                    |
| -------------------- | ------------------------------------------ |
| `npm run dev`        | Start the Next.js development server       |
| `npm run build`      | Build the production app                   |
| `npm run start`      | Start the production server after building |
| `npm run lint`       | Run ESLint                                 |
| `npm run test`       | Run Vitest once                            |
| `npm run test:watch` | Run Vitest in watch mode                   |

## Documentation

- [API Reference](docs/API.md)
- [Data Model](docs/DATA_MODEL.md)
- [Authentication and RBAC](docs/AUTH_RBAC.md)

## Development Notes

- `proxy.ts` handles route-level redirects for dashboard and login pages. In Next.js 16, `proxy.ts` replaces the older middleware convention.
- `auth.config.ts` contains shared NextAuth configuration. `auth.ts` adds the Prisma adapter and credentials provider.
- `lib/rbac.ts` defines default route permissions and helpers. `lib/rbac-settings.ts` persists admin overrides in `AppSetting`.
- Generated Prisma client code is configured to output to `app/generated/prisma`.
- List endpoints return `{ data, meta }`, where `meta` contains pagination details.

## Verification

Before shipping changes, run:

```bash
npm run lint
npm run test
npm run build
```
