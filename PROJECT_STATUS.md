# PROJECT STATUS - Salve Mundi Website (v7)

## 🤖 Agent Initialization (Mandatory)
Every new session **MUST** start with the following sequence:
1.  **Read `PROJECT_STATUS.md`**: Understand the current focus, technical stack, and pending tasks.
2.  **Read Rules**: Explicitly read all `.mdc` files in `.antigravity/rules/` to ensure compliance with the latest standards.
3.  **Check Context**: Verify if there are any active `implementation_plan.md` or `task.md` files before proceeding.

This file tracks the current state, technical stack, and pending verification tasks for the Salve Mundi Monorepo.

## 🚀 Project Overview
- **Type**: pnpm Monorepo
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
- **Commands**: 
  - `pnpm dev`: Start the frontend (development mode)
  - `pnpm build`: Build all packages
  - `pnpm lint`: Run linting across the monorepo
- **Rules**: Modular rules are defined in `.antigravity/rules/`
- **Architecture**: Domain-driven design with services in `apps/services` and the main site in `apps/frontend`.
- **UI Architecture (Nuclear SSR)**: 
  - Standardized on **Zero-Skeleton** rendering. 
  - All data is pre-fetched on the server-side before flushing content to the client to eliminate flickering and page shifts.
  - Suspense fallbacks are removed in favor of atomic page loads.
   - **Status**: Transitioned to Nuclear SSR (Zero-Skeleton) across all public and admin pages.

## 📍 Current Focus and To-Do (Remove items that are Done)
- [x] **Monitoring**: Implemented systematic `DirectusError` logging to PostgreSQL and added a `fetchWithRetry` resilience layer (3 attempts max).
- [x] **Analysis**: Reviewed `/beheer/logging`. Findings: System is highly stable; zero `system_error_directus` entries found in ~3000 logs, confirming efficiency of the resilience layer.
- [x] **Bugfix**: Normalized phone number input in `EventSignupIsland.tsx` using `formatPhoneNumber` to ensure consistency with other forms and correct mask behavior.
- [x] **UI Cleanup**: Removed redundant header bars in `/beheer/activiteiten/[id]/aanmeldingen` and cleaned up component code and prop types.
- [x] **Auth/Lookup**: Transitioned to **Email-only lookup** for activity signups and tickets to fix visibility issues and ensure consistency across the profile.
- [x] **UX**: Implemented proactive signup detection on the activity detail page to hide the signup form and show the ticket QR when already registered.
- [x] **Auth/Lookup Fix**: Resolved ticket visibility issue by implementing case-insensitive email lookup in SQL and normalizing field names (`date_created`) for the UI.
- [x] **Admin Fix**: Resolved check-in button state sync issue by adding `router.refresh()` and redesigned the registration list UI with clearer labels and timestamps.
- [ ] **Next Steps**: Awaiting new priorities from the USER.

---
*Note: This file is automatically updated by Antigravity to track pending tasks and context.*
