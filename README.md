# Salve Mundi V7 Monorepo

Welkom bij de broncode van Salve Mundi V7. Dit project is een moderne monorepo-architectuur voor studievereniging Salve Mundi, gebouwd met Next.js (App Router), Mantine UI v9, Drizzle ORM, Directus CMS en Fastify microservices.

## Project Structuur

De repository is ingericht als een monorepo (gestuurd door `pnpm-workspace.yaml`):

- **`/apps/frontend`**: De hoofdapplicatie gebouwd met Next.js 16 (App Router) en Mantine UI v9. Bevat de publieke website, het ledenportaal en het beheerderspaneel (`/beheer`).
- **`/apps/services`**: Diverse Fastify/Node microservices voor specifieke taken (Finance, Azure Sync, Mail, Azure Management, Monitoring, Mobile Notifications).
- **`/infrastructure`**: Docker Compose configuraties voor de core infrastructuur (PostgreSQL, Redis, Directus).
- **`/packages`**: Gedeelde packages zoals `@salvemundi/db` (Drizzle schema & client) en `@salvemundi/validations` (Zod v4 schema's).

## Technologie Stack

- **Runtime & Build**: Node.js 24+, TypeScript 6.0, pnpm 11.
- **Frontend**: Next.js 16.4 (Turbopack), React 19, Mantine UI v9 (`@mantine/core`, `@mantine/dates`, `@mantine/notifications`), Tailwind CSS 4, MapLibre GL JS v6, Better Auth.
- **Design System**: Centrale Salve Mundi Brandguide-configuratie in `apps/frontend/src/lib/config/theme.ts` (`BRAND_COLORS`, `salveMundiTheme`, `salveMundiCssResolver`) en `apps/frontend/src/app/globals.css`.
- **Backend/CMS**: Directus 11, Fastify 5.
- **Database**: PostgreSQL via Drizzle ORM (`@salvemundi/db`).
- **Caching & Sessies**: Redis.
- **Monitoring**: Uptime Kuma (geautomatiseerde socket provisioning & Discord webhooks).
- **Infrastructuur & CI/CD**: Docker, Nginx Proxy Manager, GitHub Actions.

## Package Management & Security (pnpm v11)

Deze monorepo hanteert strikte regels via `pnpm-workspace.yaml` om compatibiliteit en veiligheid te garanderen:
- **`overrides`**: Dwingt specifieke, veilige versies af van transitieve dependencies over de gehele monorepo.
- **`allowBuilds`**: Uit veiligheidsoverwegingen zijn post-install scripts geblokkeerd (`false`) voor vrijwel alle packages.
- **`patchedDependencies`**: Bevat gerichte patches (in `/patches`) voor third-party packages.

## Lokale Ontwikkeling

1. **Clone de repository**:
   ```bash
   git clone https://github.com/salvemundi/website.git
   cd website
   ```

2. **Installeer afhankelijkheden**:
   ```bash
   pnpm install
   ```

3. **Configureer de omgeving**:
   Kopieer `.env.example` naar `.env` in de root en configureer `apps/frontend/.env.local` voor de Next.js frontend volgens de benodigde environment-variabelen.

4. **Start de development server**:
   ```bash
   pnpm dev
   ```
   *(Het `predev`/`prebuild` script `sync:maplibre-worker` kopieert automatisch de MapLibre v6 worker-bestanden naar `apps/frontend/public/map/worker/`.)*

5. **Validatie & kwaliteitscontrole**:
   ```bash
   pnpm --filter @salvemundi/frontend run validate
   ```
   Voert achtereenvolgens `tsc --noEmit`, `eslint src`, `knip` en `next build` uit.

## Deployment

Het project maakt gebruik van GitHub Actions voor geautomatiseerde deployment:

- **`v7-core.yml`**: Kern-infrastructuur (PostgreSQL, Redis, Directus).
- **`v7-stack.yml`**: Applicatielaag (Frontend & Microservices).
- **`monitoring.yml`**: Uptime Kuma monitoring service.

## Beveiliging & Bijdragen

- Geen hardcoded fallback-secrets in broncode; alle geheimen worden via environment-variabelen / GitHub Secrets beheerd.
- Werk via een feature branch en dien een Pull Request in naar `acceptance` voor review door andere developers.

*Copyright © Salve Mundi*
