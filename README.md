# Salve Mundi V7 Monorepo

Welkom bij de broncode van Salve Mundi V7.
Dit project is een moderne monorepo-architectuur voor studievereniging Salve Mundi, gebouwd met Next.js (App Router), Mantine UI v9, Drizzle ORM, Directus CMS en Fastify microservices.

## Project Structuur

De repository is ingericht als een monorepo (gestuurd door `pnpm-workspace.yaml`):

- **`/apps/frontend`**: De hoofdapplicatie gebouwd met Next.js 16 (App Router) en Mantine UI v9.
  Bevat de publieke website, het ledenportaal en het beheerderspaneel (`/beheer`).
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

### Vereisten

- Node.js ≥ 22.13 (de `mobile-notification-service` vraagt ≥ 24)
- pnpm 11 (`corepack enable` pakt automatisch de versie uit `package.json`)
- Docker met Docker Compose

### Eerste keer opzetten

1.  **Clone de repository en installeer afhankelijkheden**:

    ```bash
    git clone https://github.com/salvemundi/website.git
    cd website
    pnpm install
    ```

2.  **Configureer de frontend**.
    De standaardwaarden passen bij de lokale Docker-omgeving:

    ```bash
    cp apps/frontend/.env.example apps/frontend/.env.local
    ```

3.  **Start Postgres, Redis en Directus** (`infrastructure/dev/docker-compose.yml`).
    Het commando wacht tot alles gezond is:

    ```bash
    pnpm dev:infra
    ```

4.  **Maak de tabellen van de website aan**.
    Directus maakt bij de eerste start zijn eigen systeemtabellen aan.
    Dit script genereert de overige tabellen uit `packages/db/drizzle/schema.ts` en voegt de profielvelden toe aan `directus_users`.
    Het is veilig om het opnieuw te draaien:

    ```bash
    pnpm dev:db:init
    ```

5.  **Start de development server**.
    Bouw eerst `@salvemundi/db` en `@salvemundi/validations`, anders kan Next.js deze packages niet resolven (zie #374).
    Daarna draait Next.js op http://localhost:3000:

    ```bash
    pnpm build:packages
    pnpm dev
    ```

    _(Het `predev`/`prebuild` script `sync:maplibre-worker` kopieert automatisch de MapLibre v6 worker-bestanden naar `apps/frontend/public/map/worker/`.)_

6.  **Validatie & kwaliteitscontrole**:
    ```bash
    pnpm --filter @salvemundi/frontend run validate
    ```
    Voert achtereenvolgens `tsc --noEmit`, `eslint src`, `knip` en `next build` uit.

### Lokale omgeving

| Dienst   | Adres                 | Inlog                                                                         |
| -------- | --------------------- | ----------------------------------------------------------------------------- |
| Website  | http://localhost:3000 | Microsoft-login werkt lokaal niet zonder echte Entra-gegevens in `.env.local` |
| Directus | http://localhost:8055 | `admin@example.com` / `admin`                                                 |
| Postgres | `127.0.0.1:5432`      | `salvemundi` / `salvemundi`, database `salvemundi`                            |
| Redis    | `127.0.0.1:6379`      | wachtwoord `salvemundi`                                                       |

De database begint leeg, dus pagina's laden zonder inhoud.
Voeg data toe via Directus of laad een dump in Postgres.

De microservices in `apps/services` zijn optioneel.
Zet hun URL's in `.env.local` (zie `apps/frontend/.env.example`) als je aan betalingen, mail of Azure-synchronisatie werkt.

### Stoppen en opnieuw beginnen

```bash
pnpm dev:infra:down                                               # containers stoppen, data blijft bewaard
docker compose -f infrastructure/dev/docker-compose.yml down -v   # alles wissen, daarna weer vanaf stap 3
```

## Deployment

Het project maakt gebruik van GitHub Actions voor geautomatiseerde deployment:

- **`v7-core.yml`**: Kern-infrastructuur (PostgreSQL, Redis, Directus).
- **`v7-stack.yml`**: Applicatielaag (Frontend & Microservices).
- **`monitoring.yml`**: Uptime Kuma monitoring service.

## Beveiliging & Bijdragen

- Geen hardcoded fallback-secrets in broncode; alle geheimen worden via environment-variabelen / GitHub Secrets beheerd.
- Werk via een feature branch en dien een Pull Request in naar `acceptance` voor review door andere developers.

_Copyright © Salve Mundi_
