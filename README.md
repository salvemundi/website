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

### Vereisten

- Node.js ≥ 22.13 (de `mobile-notification-service` vraagt ≥ 24)
- pnpm 11 (`corepack enable` pakt automatisch de versie uit `package.json`)
- Docker met Docker Compose

### Eerste keer opzetten

1.  **Clone de repository en installeer afhankelijkheden**:
    ```bash
    git clone https://github.com/salvemundi/website-v7.git
    cd website-v7
    pnpm install
    ```

2.  **Configureer de frontend**. De standaardwaarden passen bij de lokale Docker-omgeving:
    ```bash
    cp apps/frontend/.env.example apps/frontend/.env.local
    ```

3.  **Start Postgres, Redis en Directus** (`infrastructure/dev/docker-compose.yml`). Het commando wacht tot alles gezond is:
    ```bash
    pnpm dev:infra
    ```

4.  **Maak de tabellen van de website aan**. Directus maakt bij de eerste start zijn eigen systeemtabellen aan. Dit script genereert de overige tabellen uit `packages/db/drizzle/schema.ts` en voegt de profielvelden toe aan `directus_users`. Het is veilig om het opnieuw te draaien:
    ```bash
    pnpm dev:db:init
    ```

5.  **Start de development server**. Dit bouwt eerst `@salvemundi/db` en `@salvemundi/validations`, daarna draait Next.js op http://localhost:3000:
    ```bash
    pnpm dev
    ```

### Lokale omgeving

| Dienst | Adres | Inlog |
| --- | --- | --- |
| Website | http://localhost:3000 | Microsoft-login werkt lokaal niet zonder echte Entra-gegevens in `.env.local` |
| Directus | http://localhost:8055 | `admin@example.com` / `admin` |
| Postgres | `127.0.0.1:5432` | `salvemundi` / `salvemundi`, database `salvemundi` |
| Redis | `127.0.0.1:6379` | wachtwoord `salvemundi` |

De database begint leeg, dus pagina's laden zonder inhoud. Voeg data toe via Directus of laad een dump in Postgres.

De microservices in `apps/services` zijn optioneel. Zet hun URL's in `.env.local` (zie `apps/frontend/.env.example`) als je aan betalingen, mail of Azure-synchronisatie werkt.

### Stoppen en opnieuw beginnen

```bash
pnpm dev:infra:down                                               # containers stoppen, data blijft bewaard
docker compose -f infrastructure/dev/docker-compose.yml down -v   # alles wissen, daarna weer vanaf stap 3
```

## Deployment

Het project maakt gebruik van GitHub Actions voor geautomatiseerde deployment naar de VPS.

- **`v7-core.yml`**: Verantwoordelijk voor de kern-infrastructuur (Database, Redis, Directus).
- **`v7-stack.yml`**: Verantwoordelijk voor de applicatielaag (Frontend & Microservices).
- **`monitoring.yml`**: Verantwoordelijk voor het bouwen en synchroniseren van de Uptime Kuma monitoring service (poort `3006` voor Prod, `13006` voor Acc).


## Beveiliging & Bijdragen

Gevoelige informatie wordt beheerd via GitHub Secrets. Voor bijdragen aan de code, maak een feature branch aan en dien een Pull Request in.

*Copyright © Salve Mundi*
