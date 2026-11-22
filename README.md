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

- **Runtime & Build**: Node.js 26, TypeScript 6.0 / 7.0 (`typescript-native`), pnpm 12.
- **Frontend**: Next.js 16.4 (Turbopack), React 19, Mantine UI v9 (`@mantine/core`, `@mantine/dates`, `@mantine/notifications`), Tailwind CSS 4, MapLibre GL JS v6, Better Auth.
- **Design System**: Centrale Salve Mundi Brandguide-configuratie in `apps/frontend/src/lib/config/theme.ts` (`BRAND_COLORS`, `salveMundiTheme`, `salveMundiCssResolver`) en `apps/frontend/src/app/globals.css`.
- **Backend/CMS**: Directus 11, Fastify 5.
- **Database**: PostgreSQL via Drizzle ORM (`@salvemundi/db`).
- **Caching & Sessies**: Redis.
- **Monitoring**: Uptime Kuma (geautomatiseerde socket provisioning & Discord webhooks).
- **Infrastructuur & CI/CD**: Docker, Nginx Proxy Manager, GitHub Actions.

## Package Management & Security (pnpm v12)

Deze monorepo hanteert strikte regels via `pnpm-workspace.yaml` en `package.json` om compatibiliteit, snelheid en veiligheid te garanderen:

- **`devEngines.runtime`**: Beheert en downloadt automatisch Node.js 26 voor dit project bij `pnpm`-commando's, zodat iedereen met exact dezelfde Node-versie werkt.
- **`catalog:`**: Centraliseert gedeelde versies (`drizzle-orm`, `zod`, `fastify`, `ioredis`, `eslint`, `typescript`, enz.) over alle workspaces heen.
- **`minimumReleaseAge` & `trustLockfile`**: Nieuwe of bijgewerkte packages worden pas na 24 uur (`1440` min) geaccepteerd ter bescherming tegen supply-chain aanvallen, zonder vertraging op `--frozen-lockfile`.
- **`overrides`**: Dwingt specifieke, veilige versies af van transitieve dependencies over de gehele monorepo.
- **`allowBuilds`**: Uit veiligheidsoverwegingen zijn post-install scripts geblokkeerd (`false`) voor vrijwel alle packages.

## Lokale Ontwikkeling

### Vereisten

- pnpm 12 (installeert via `devEngines.runtime` automatisch Node.js 26 als dat lokaal ontbreekt; of installeer handmatig Node.js ≥ 26)
- Docker met Docker Compose

### Eerste keer opzetten

1.  **Clone de repository**:

    ```bash
    git clone https://github.com/salvemundi/website.git
    cd website
    ```

2.  **Installeer dependencies**:

    ```bash
    pnpm install
    ```

3.  **Configureer de frontend**.
    De standaardwaarden passen bij de lokale Docker-omgeving:

    ```bash
    cp apps/frontend/.env.example apps/frontend/.env.local
    ```

4.  **Start Postgres, Redis en Directus** (`infrastructure/dev/docker-compose.yml`).
    Het commando wacht tot alles gezond is:

    ```bash
    pnpm dev:infra
    ```

5.  **Maak de tabellen van de website aan**.
    Directus maakt bij de eerste start zijn eigen systeemtabellen aan.
    Dit script genereert de overige tabellen uit `packages/db/drizzle/schema.ts` en voegt de profielvelden toe aan `directus_users`.
    Het is veilig om het opnieuw te draaien:

    ```bash
    pnpm dev:db:init
    ```

6.  **Vul de database met voorbeelddata**.
    Het script laadt commissies, activiteiten, clubs, sponsors en meer, deels overgenomen van salvemundi.nl en deels verzonnen.
    Leden en (oud-)bestuursleden zijn fictief en hebben geen foto.
    De afbeeldingen worden via Directus geïmporteerd van salvemundi.nl.
    Elke run wist de geseede tabellen en vult ze opnieuw. Herstart `pnpm dev` als die al draait, anders toont de cache nog de oude data:

    ```bash
    pnpm dev:db:seed
    ```

7.  **Start de development server**.
    Dankzij directe `.ts`-exports op `@salvemundi/db` en `@salvemundi/validations` hoef je packages niet eerst apart te builden om Next.js of de services te starten (zie #374).
    Draai Next.js op http://localhost:3000 (en optioneel alle TypeScript-microservices via `pnpm dev:services`):

    ```bash
    pnpm dev
    # optioneel in een tweede terminal voor de microservices:
    pnpm dev:services
    ```

    _(Het `predev`/`prebuild` script `sync:maplibre-worker` kopieert automatisch de MapLibre v6 worker-bestanden naar `apps/frontend/public/map/worker/`.)_

### Lokale omgeving

| Dienst   | Adres                 | Inlog                                                                         |
| -------- | --------------------- | ----------------------------------------------------------------------------- |
| Website  | http://localhost:3000 | Microsoft-login werkt lokaal niet zonder echte Entra-gegevens in `.env.local` |
| Directus | http://localhost:8055 | `admin@example.com` / `admin`                                                 |
| Postgres | `127.0.0.1:5432`      | `salvemundi` / `salvemundi`, database `salvemundi`                            |
| Redis    | `127.0.0.1:6379`      | wachtwoord `salvemundi`                                                       |

Zonder `pnpm dev:db:seed` is de database leeg en laden pagina's zonder inhoud.

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
