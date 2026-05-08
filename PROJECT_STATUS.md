# PROJECT STATUS - Salve Mundi Website (v7)

## 🤖 Agent Initialization (Mandatory)
Every new session **MUST** start with the following sequence:
1.  **Read `PROJECT_STATUS.md`**: Understand the current focus, technical stack, and pending tasks.
2.  **Read Rules**: Explicitly read all `.mdc` files in `.antigravity/rules/` to ensure compliance with the latest standards.
3.  **Check Context**: Verify if there are any active `implementation_plan.md` or `task.md` files before proceeding.
4.  **Strict Git Push Policy**: Never `git push` without explicit, per-instance permission. Always ask again, even if previously granted.

This file tracks the current state, technical stack, and pending verification tasks for the Salve Mundi Monorepo.

## 🚀 Project Overview
- **Type**: pnpm Monorepo
- **Node.js**: v22.13.1 (STABLE LTS - Fixes streaming bugs)
- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS 4, Framer Motion
- **Backend**: Fastify 5 (Multiple microservices)
- **Infrastructure**: Docker Compose, Azure (Identity), NetBird VPN
- **Package Manager**: pnpm (v9.15.9 installed via standalone script)
- **Terminal/Shell**: PowerShell 7 (v7.6.0 installed - MANDATORY for AI agents)
- **Essential Toolset**: `rg` (ripgrep), `fd` (fd-find), `jq` (JSON processor), `psql` (PostgreSQL), `tldr` (simplified help) - STANDARDIZED for all AI agent interactions.
- **Shared Utils**: `@salvemundi/validations`, `@salvemundi/validations-schemas`

## 🌐 Pipeline & Infrastructure
- **Network Architecture**: 
  - Localhost connects to the VPS via **NetBird VPN**.
  - Internal service ports (3001-3004) are bound to the VPN IP (`VPN_IP`) or `127.0.0.1` on the VPS.
  - Development often involves tunneling to use production/staging services hosted on the VPS.
- **Service Mesh**: 
  - Services communicate internally via Docker DNS using the `salve-mundi-v7-shared` network.
  - External access is managed via a `proxy-network`.

## 🛠 Tech Stack Details
| Layer | Technologies |
| :--- | :--- |
| **Package Manager** | `pnpm` (v9+) |
| **Frontend** | React 19, Next.js 16, Tailwind 4, Serwist (PWA) |
| **Backend** | Fastify 5, Drizzle ORM, Handlebars (Mail) |
| **Database** | PostgreSQL (Drizzle) |
| **Auth** | Better Auth 1.6 |

## 📐 Best Practices & Conventions
- **Rules**: 
  - Modular rules are defined in `.antigravity/rules/`
  - **Build Optimization**: If only frontend changes are made, build only the frontend using `pnpm --filter @salvemundi/frontend build`. Avoid `pnpm build` (which builds the whole project) unless packages or services were also modified.
- **Architecture**: Domain-driven design with services in `apps/services` and the main site in `apps/frontend`.
- **UI Architecture (Nuclear SSR)**: 
  - Standardized on **Zero-Skeleton** rendering. 
  - All data is pre-fetched on the server-side before flushing content to the client to eliminate flickering and page shifts.
  - Suspense fallbacks are removed in favor of atomic page loads.
- **Data Integrity (Zero-Any Policy)**:
  - `as any` is strictly forbidden. All data must be validated through **Zod schemas** from `@salvemundi/validations`.
  - Prefer schema-inferred types (`z.infer<typeof schema>`) for component props and API responses.
- **Backend Strategy (SQL-First)**:
  - Use **Knex SQL** via `query()` for any query involving JOINs, aggregates, or complex relations. 
  - Directus SDK is reserved only for simple CRUD operations on single items.
- **Admin UI Standard**:
  - Typography: 16px base size, `font-semibold` for headers (no `font-black`).
  - Case: Use natural case (no forced `uppercase` or `lowercase` tracking).
  - Modals: Standardized on [AdminModal.tsx](file:///c:/Users/roanf/Documents/website/apps/frontend/src/components/ui/admin/AdminModal.tsx) for all creation and complex edit flows.
  - Performance: Implement **Optimistic UI Updates** for data mutations (Creation/Deletion) to ensure an "instant" feel.
  - Date Logic: Use `startOfDay`/`endOfDay` (from `date-fns`) for all status-related date comparisons to prevent boundary/timezone bugs.
- **Resilience & Error Handling**:
  - **No Dumb Fallbacks**: Do not use `try-catch` with empty fallbacks (`[]`, `null`) just to satisfy build-time constraints. Errors should propagate unless they represent a valid business state.
  - **Global Build Safety**: Centralize build-time environmental constraints (like missing databases in CI) in core utilities (e.g., `db.ts`) rather than scattering workarounds in business logic.
  - Implemented `fetchWithRetry` for all Directus SDK calls (3 attempts max).
  - Centralized error logging to PostgreSQL for observability.

## 📍 Current Focus and To-Do
- [x] **Coupon Modernization**: Successfully migrated coupon management to a premium modal-based flow with optimistic updates.
- [ ] **Build Verification**: Final full `pnpm build` verification of the entire monorepo.
- [ ] **Production Deployment**: Execute final deployment to PROD environment.
- [ ] **Post-Launch Monitoring**: Monitor PostgreSQL logs for any `DirectusError` entries post-deployment.

---
*Note: This file is automatically updated by Antigravity to track pending tasks and context.*
