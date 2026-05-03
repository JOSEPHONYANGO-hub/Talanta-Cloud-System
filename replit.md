# Talanta-Cloud EMS Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.
This project is the **Talanta-Cloud Solutions Employee Management System (EMS)** — a full-stack multi-tenant SaaS web app for managing employees, departments, branches, with AI features and photo uploads. Different organizations can sign up, get isolated data, and customize their brand colors.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React 19 + Vite (`artifacts/talanta-ems`)
- **Backend**: Express 5 (`artifacts/api-server`)
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: Clerk (per-user auth + org membership resolution)
- **Object Storage**: GCS via Replit Object Storage (`lib/object-storage-web`)
- **AI**: OpenAI via Replit AI Integrations (auto-generate summaries, smart search)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec in `lib/api-spec`)
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Charts**: Recharts (dashboard)

## Artifacts

| Artifact | Kind | Path | Description |
|---|---|---|---|
| `talanta-ems` | web | `/` | React frontend EMS app |
| `api-server` | api | `/api` | Express REST API server |

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## DB Schema (`lib/db/src/schema/`)

### Multi-tenant tables
- `organizations` — id, name, slug (unique), logoUrl, primaryColor, accentColor, industry, ownerId (Clerk user ID), createdAt, updatedAt
- `organizationMembers` — id, orgId, userId (Clerk), role (owner/admin/member), joinedAt; unique on (orgId, userId)

### Data tables (all scoped by orgId)
- `departments` — id, orgId, name, description, createdAt
- `branches` — id, orgId, name, location, createdAt
- `employees` — id, orgId, fullName, jobTitle, departmentId, branchId, phone, email, dateOfEmployment, status, photoUrl, summary, createdAt, updatedAt

## Multi-tenancy Architecture

### API (`artifacts/api-server/src/`)
- **`middlewares/requireOrg.ts`** — resolves `req.orgId` from Clerk `userId` via `organization_members` table; returns 403 with `code: "NO_ORG"` if user has no org
- All data routes (employees, departments, branches, dashboard) apply `requireOrg` middleware and scope all DB queries with `eq(table.orgId, req.orgId)`
- **`routes/organizations.ts`** — `GET /api/organizations/me`, `POST /api/organizations`, `PUT /api/organizations/me`

### Frontend (`artifacts/talanta-ems/src/`)
- **`context/orgContext.ts`** — defines `OrgContext`, `Organization` type, `OrgContextValue` interface (no circular deps)
- **`context/OrgContext.tsx`** — `OrgProvider` component: loads org, applies brand CSS vars (`--primary`, `--sidebar`, `--ring`, `--chart-1`, `--chart-3`) dynamically from org's hex colors using hex→HSL conversion
- **`hooks/useOrg.ts`** — `useOrg()`, `useGetMyOrg()`, `useCreateOrg()`, `useUpdateOrg()` hooks
- **`pages/OrgSetup.tsx`** — onboarding wizard: company name, slug, industry, color swatches (8 primary + 6 accent), logo URL, live preview
- **`pages/OrgSettings.tsx`** — settings page (sidebar → Settings): update profile + brand colors with live preview

### Auth & Routing Flow
1. User signs in via Clerk
2. `OrgProvider` calls `GET /api/organizations/me` (enabled when signed in)
3. If no org (404 → `null`): `needsSetup = true` → `ProtectedRoute` redirects to `/org-setup`
4. On `/org-setup`: user fills form → `POST /api/organizations` → org created → cache set immediately → redirect to `/dashboard`
5. Subsequent logins: org loaded from cache/API → branding CSS vars applied → app renders with org colors

## API Routes (`artifacts/api-server/src/routes/`)

### Organizations (no requireOrg for GET/POST — auth only)
- `GET /api/organizations/me` — get current user's org (404 if none)
- `POST /api/organizations` — create org + add creator as owner member
- `PUT /api/organizations/me` — update org settings (requireOrg)

### Data routes (all require requireOrg middleware)
- `GET/POST /api/employees` — list/create employees (org-scoped)
- `GET/PUT/DELETE /api/employees/:id` — read/update/delete employee (org-scoped)
- `PATCH /api/employees/bulk-status` — bulk status update (org-scoped)
- `GET /api/employees/export` — CSV export (org-scoped)
- `GET/POST /api/departments` — list/create (org-scoped)
- `PUT/DELETE /api/departments/:id` — update/delete (org-scoped)
- `GET/POST /api/branches` — list/create (org-scoped)
- `PUT/DELETE /api/branches/:id` — update/delete (org-scoped)
- `GET /api/dashboard/stats` — aggregated stats (org-scoped)
- `GET /api/dashboard/employees-by-department` — chart data (org-scoped)
- `GET /api/dashboard/employees-by-branch` — chart data (org-scoped)
- `GET /api/dashboard/recent-employees` — recent hires (org-scoped)
- `POST /api/ai/summary` — AI-generate employee summary
- `POST /api/ai/search` — smart AI search

## Frontend Pages (`artifacts/talanta-ems/src/pages/`)

- `Landing.tsx` — public landing page with Sign In
- `OrgSetup.tsx` — onboarding for new organizations (color swatches, logo, preview)
- `OrgSettings.tsx` — organization profile + brand identity settings
- `Dashboard.tsx` — stats cards + Recharts bar/pie charts + recent hires
- `Employees.tsx` — employee directory with AI smart search + bulk status change
- `EmployeeProfile.tsx` — employee detail with AI summary generation
- `EmployeeForm.tsx` — add/edit employee form with photo upload (Uppy + GCS)
- `Departments.tsx` — department CRUD with table + dialogs
- `Branches.tsx` — branch CRUD with table + dialogs

## Super Admin Panel (`/super-admin`)

- Gated by `SUPER_ADMIN_USER_IDS` env var (comma-separated Clerk user IDs)
- `GET /api/super-admin/check` — returns `{ isSuperAdmin, userId }` (no guard, helps with setup)
- `GET /api/super-admin/stats` — global totals (orgs, employees, members, departments)
- `GET /api/super-admin/organizations` — all orgs with member/employee counts
- `GET /api/super-admin/organizations/:id` — org detail (members, recent employees, counts)
- `DELETE /api/super-admin/organizations/:id` — cascade-delete org + all data
- `PATCH /api/super-admin/organizations/:id` — update org fields
- Frontend: `SuperAdminLayout` (slate sidebar), `SuperAdmin.tsx` (table + delete), `SuperAdminOrgDetail.tsx`
- Sidebar shows "Super Admin" link only when `useCheckSuperAdmin()` returns `isSuperAdmin: true`

## Org Admin Hub (`/admin`)

- Per-org management hub at `/admin` (protected route, requires org)
- Shows org stats + cards linking to Employees, Departments, Branches, Settings
- Accessible from sidebar under the "Admin" section ("Org Admin Hub" link)

## Codegen Notes

- Orval config: `lib/api-spec/orval.config.ts`
- After codegen, `lib/api-zod/src/index.ts` is overwritten with `export * from "./generated/api";`
- Generated React Query hooks live in `lib/api-client-react/src/generated/`

## Dependency Notes

- Root `package.json` has pnpm overrides to pin `react` and `react-dom` to `19.1.0` (required by Uppy compatibility)
- `lib/object-storage-web` is composite and referenced in root `tsconfig.json`
- **CRITICAL**: Never use `import { z } from "zod/v4"` in `api-server` routes — esbuild cannot resolve it. Use manual validation or `@workspace/api-zod` schemas instead. `zod/v4` is fine in `lib/db` (compiled by tsc).

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
