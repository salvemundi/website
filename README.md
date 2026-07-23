# Salve Mundi V7 Monorepo

Welkom bij de broncode van Salve Mundi V7. Dit project is een moderne monorepo architectuur voor de studievereniging Salve Mundi, gebouwd met Next.js, Directus CMS en een microservices-georiënteerde backend.

## Project Structuur

De repository is ingericht als een monorepo (gestuurd door `pnpm-workspace.yaml`):

- **`/apps/frontend`**: De hoofdapplicatie gebouwd met Next.js (App Router). Bevat de website en het ledenportaal.
- **`/apps/services`**: Diverse Fastify/Node microservices voor specifieke taken (Finance, Azure Sync, Mail, Azure Management, Monitoring).
- **`/infrastructure`**: Docker Compose configuraties voor de core infrastructuur (Postgres, Redis, Directus).
- **`/packages`**: Gedeelde bibliotheken, configuraties en types (bijv. `validations`).
- **`/Docs`**: Uitgebreide bron-documentatie over de architectuur en workflows (lokaal genegeerd in git).

## Technologie Stack

- **Runtime & Build**: Node.js 26.3, TypeScript 6.0, pnpm 11.8.
- **Frontend**: Next.js 16.2.x, TailwindCSS 4, Better Auth.
- **Backend/CMS**: Directus 11.1.x (Requires `DIRECTUS_STATIC_TOKEN` for build verification), Fastify 5.8.x.
- **Database**: PostgreSQL (centrale opslag) via Kysely (type-safe query builder).
- **Caching**: Redis.
- **Monitoring**: Uptime Kuma (geautomatiseerde socket provisioning & Discord webhooks).
- **Infrastructuur**: Docker (floating major-versions), Nginx Proxy Manager (NPM).
- **CI/CD**: GitHub Actions (met stricte pnpm caching).

## Package Management & Security (pnpm v11)

Deze monorepo hanteert strikte regels via `pnpm-workspace.yaml` om compatibiliteit en veiligheid te garanderen:
- **`overrides`**: Dwingt specifieke, veilige versies af van (vaak verborgen) dependencies (zoals `kysely`, `axios`, en `defu`) over de gehele monorepo om CVE-kwetsbaarheden te voorkomen.
- **`allowBuilds`**: Uit veiligheidsoverwegingen zijn post-install scripts geblokkeerd (`false`) voor vrijwel alle packages. We maken exclusief gebruik van pre-built binaries.
- **`patchedDependencies`**: Bevat handmatige hotfixes (in `/patches`) voor third-party packages die missende exports of bugs bevatten (zoals `brace-expansion`). Sinds pnpm v11 is dit centraal ondergebracht in de workspace configuratie in plaats van in `package.json`.

## Lokale Ontwikkeling

1.  **Clone de repository**:
    ```bash
    git clone https://github.com/salvemundi/website-v7.git
    cd website-v7
    ```

2.  **Installeer afhankelijkheden**:
    ```bash
    pnpm install
    ```

3.  **Configureer de omgeving**:
    Kopieer `.env.example` naar `.env` in de root folder voor de services en Docker. Kopieer daarnaast `apps/frontend/.env.example` naar `apps/frontend/.env.local` voor de Next.js frontend.
    ```bash
    cp .env.example .env
    cp apps/frontend/.env.example apps/frontend/.env.local
    ```

4.  **Start de development server**:
    ```bash
    pnpm dev
    ```

## Deployment

Het project maakt gebruik van GitHub Actions voor geautomatiseerde deployment naar de VPS.

- **`v7-core.yml`**: Verantwoordelijk voor de kern-infrastructuur (Database, Redis, Directus).
- **`v7-stack.yml`**: Verantwoordelijk voor de applicatielaag (Frontend & Microservices).
- **`monitoring.yml`**: Verantwoordelijk voor het bouwen en synchroniseren van de Uptime Kuma monitoring service (poort `3006` voor Prod, `13006` voor Acc).


## Beveiliging & Bijdragen

Gevoelige informatie wordt beheerd via GitHub Secrets. Voor bijdragen aan de code, maak een feature branch aan en dien een Pull Request in.

*Copyright © Salve Mundi*
