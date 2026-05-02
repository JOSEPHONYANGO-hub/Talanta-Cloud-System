# Talanta-Cloud EMS Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.
This project is the **Talanta-Cloud Solutions Employee Management System (EMS)** — a full-stack web app for managing employees, departments, branches, with AI features and photo uploads.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React 19 + Vite (`artifacts/talanta-ems`)
- **Backend**: Express 5 (`artifacts/api-server`)
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: Clerk (admin-only access behind sign-in)
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

## DB Schema (`lib/db/src/schema/index.ts`)

- `departments` — id, name, description, createdAt
- `branches` — id, name, location, createdAt
- `employees` — id, fullName, jobTitle, departmentId, branchId, phone, email, dateOfEmployment, status, photoUrl, summary, createdAt, updatedAt

## API Routes (`artifacts/api-server/src/routes/`)

- `GET/POST /api/employees` — list/create employees (supports search, filters)
- `GET/PATCH/DELETE /api/employees/:id` — read/update/delete employee
- `GET/POST /api/departments` — list/create departments
- `PATCH/DELETE /api/departments/:id` — update/delete department
- `GET/POST /api/branches` — list/create branches
- `PATCH/DELETE /api/branches/:id` — update/delete branch
- `GET /api/dashboard/stats` — aggregated stats for dashboard
- `POST /api/ai/summary` — AI-generate employee summary via OpenAI
- `POST /api/ai/search` — smart AI search across employees
- `POST /api/storage/upload-url` — get presigned GCS upload URL

## Frontend Pages (`artifacts/talanta-ems/src/pages/`)

- `Landing.tsx` — public landing page with Sign In
- `Dashboard.tsx` — stats cards + Recharts bar/pie charts + recent hires
- `Employees.tsx` — employee directory with AI smart search + standard filters
- `EmployeeProfile.tsx` — employee detail with AI summary generation
- `EmployeeForm.tsx` — add/edit employee form with photo upload (Uppy + GCS)
- `Departments.tsx` — department CRUD with table + dialogs
- `Branches.tsx` — branch CRUD with table + dialogs

## Codegen Notes

- Orval config: `lib/api-spec/orval.config.ts`
- After codegen, `lib/api-zod/src/index.ts` is overwritten with `export * from "./generated/api";` (avoids duplicate export issues)
- Generated React Query hooks live in `lib/api-client-react/src/generated/`

## Dependency Notes

- Root `package.json` has pnpm overrides to pin `react` and `react-dom` to `19.1.0` (required by Uppy compatibility)
- `lib/object-storage-web` is composite and referenced in root `tsconfig.json`

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
