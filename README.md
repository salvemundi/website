# Salve Mundi V7 Monorepo

Welkom bij de broncode van Salve Mundi V7. Dit project is een moderne monorepo architectuur voor de studievereniging Salve Mundi, gebouwd met Next.js, Directus CMS en een microservices-georiënteerde backend.

## 🚀 Project Structuur

De repository is ingericht als een monorepo (gestuurd door `pnpm-workspace.yaml`):

- **`/apps/frontend`**: De hoofdapplicatie gebouwd met Next.js 16 (App Router). Bevat de website en het ledenportaal.
- **`/apps/services`**: Diverse microservices voor specifieke taken (Finance, Azure Sync, Mail).
- **`/infrastructure`**: Docker Compose configuraties voor de core infrastructuur (Postgres, Redis, Directus).
- **`/packages`**: Gedeelde bibliotheken en types die door de verschillende apps worden gebruikt.
- **`/Docs`**: Uitgebreide bron-documentatie over de architectuur en workflows (lokaal genegeerd in git).

## 🛠 Technologie Stack

- **Frontend**: Next.js 16, TailwindCSS, Better Auth.
- **Backend/CMS**: Directus (Headless CMS).
- **Database**: PostgreSQL (centrale opslag).
- **Caching**: Redis.
- **Infrastructuur**: Docker, Nginx Proxy Manager (NPM).
- **CI/CD**: GitHub Actions.

## ⚙️ Lokale Ontwikkeling

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
    Kopieer `.env.example` naar `.env.local` en vul de benodigde waarden in.
    ```bash
    cp .env.example .env.local
    ```

4.  **Start de development server**:
    ```bash
    pnpm dev
    ```

## 🚢 Deployment

Het project maakt gebruik van GitHub Actions voor geautomatiseerde deployment naar de VPS.

- **`v7-core.yml`**: Verantwoordelijk voor de kern-infrastructuur (Database, Redis, Directus).
- **`v7-stack.yml`**: Verantwoordelijk voor de applicatielaag (Frontend & Microservices).

## 🛡 Beveiliging & Bijdragen

Gevoelige informatie wordt beheerd via GitHub Secrets. Voor bijdragen aan de code, maak een feature branch aan en dien een Pull Request in.

*Copyright © Salve Mundi*
