# Dev environment (`dev.salvemundi.nl`)

A permanent test environment next to acceptance and production on the V7 server, deployed from the `dev` branch.
It has its **own** Postgres, Redis and Directus ("dev core", `infrastructure/dev-env/docker-compose.yml`), with
synthetic seed data only. Acceptance and production share `v7-core-*`; dev never touches those containers.

| | Acceptance | Dev |
|---|---|---|
| Branch | `acceptance` | `dev` |
| GitHub environment | Acceptance | **Development** |
| URL | acc.salvemundi.nl | dev.salvemundi.nl |
| Database / Redis / Directus | `v7-core-*` (shared with production) | `v7-dev-db`, `v7-dev-redis`, `v7-dev-directus` |
| App containers | `v7-acc-*` (port 3000) | `v7-dev-*` (port 5000, services 2300x) |
| Data | real | synthetic seed (`packages/db/dev/seed-data.mjs`) |
| Mobile API | `MOBILE_API_ENABLED` | `MOBILE_API_ENABLED` (same gate) |
| Azure sync / provisioning jobs | off | off (never touches real Microsoft accounts) |
| Payments | Mollie test simulator | Mollie test simulator (use a **test** API key) |

## One-time setup

### 1. DNS and proxy
- DNS: `dev.salvemundi.nl` → the same address as `acc.salvemundi.nl`.
- Nginx Proxy Manager: new proxy host `dev.salvemundi.nl` → `http://v7-dev-app:3000` (scheme http, websockets on),
  with a Let's Encrypt certificate and "Force SSL", like the acceptance host.

### 2. Microsoft Entra
In the website's app registration (`AZURE_WEBSITEV7_AUTH_CLIENT_ID`) add the redirect URI
`https://dev.salvemundi.nl/api/auth/callback/microsoft`. Use the same tenant; no new app registration is needed.

### 3. GitHub environment "Development"
Settings → Environments → New environment `Development`. Restrict deployments to the `dev` branch.

Secrets. Generate **new** values for everything marked *new*; never copy production or acceptance database credentials:

| Secret | Value |
|---|---|
| `DB_USER`, `DB_NAME` | e.g. `salvemundi_dev` |
| `DB_PASSWORD` | *new*, long random |
| `DB_PORT` | `5432` |
| `REDIS_PASSWORD` | *new*, long random |
| `DIRECTUS_KEY`, `DIRECTUS_SECRET` | *new*, random (UUID / 32+ chars) |
| `DIRECTUS_STATIC_TOKEN` | *new*, random (the seed and website use it) |
| `DIRECTUS_ADMIN_EMAIL`, `DIRECTUS_ADMIN_PASSWORD` | *new*: local admin of the dev Directus |
| `BETTER_AUTH_SECRET`, `INTERNAL_SERVICE_TOKEN` | *new*, random |
| `MOLLIE_API_KEY` | a Mollie **test** key (`test_…`) |
| `MOLLIE_WEBHOOK_SECRET` | *new*, random |
| `AZURE_WEBSITEV7_TENANT_ID`, `AZURE_WEBSITEV7_AUTH_CLIENT_ID`, `AZURE_WEBSITEV7_AUTH_CLIENT_SECRET` | same as acceptance (login) |
| `SSH_KEY`, `SSH_USER`, `SSH_KNOWN_HOSTS`, `VPN_IP`, `NETBIRD_SETUP_KEY`, `NETBIRD_MANAGEMENT_URL` | same as acceptance (deployment) |
| Other secrets the stack reads (mail, sync, management, Kuma, Discord, Google, Minecraft) | optional; leave empty unless you test those features. Sync/provisioning jobs are off in dev anyway. |

Variables:

| Variable | Value |
|---|---|
| `PUBLIC_URL`, `BETTER_AUTH_URL` | `https://dev.salvemundi.nl` |
| `MOBILE_API_ENABLED` | `true` |
| `MOBILE_ANDROID_SHA256_CERT_FINGERPRINTS` | optional, for Android App Links on dev |
| `MOBILE_APPLE_TEAM_ID` | optional, for iOS universal links on dev |
| `DEV_DB_PORT`, `DEV_DIRECTUS_PORT` | optional; default `5433` / `8056` (VPN-only ports on the server) |

### 4. Branch and first deploy
1. Create the `dev` branch from `acceptance` (after this change is merged there) and push it.
   The `Deploy V7 Stack` workflow builds the images, starts the dev core and the `v7-dev-*` containers.
2. Actions → Deploy V7 Stack → Run workflow → branch `dev`, **dev_database_action = `init-and-seed`**.
   This creates the tables (including the mobile app tables) and loads the synthetic seed data.
3. Open `https://dev.salvemundi.nl` and sign in with Microsoft. Your account is created on first login.
4. Give yourself rights in the dev Directus (`http://<VPN_IP>:8056`, the admin email/password above): add your user
   to the committees you want to test (for example the activities committee for the app's admin features).

## Day to day
- Pushing to `dev` redeploys only the dev app containers; the dev database stays online with its data.
- Reload the seed (resets the seeded tables, keeps users): run the workflow with `dev_database_action = seed`.
- The Android app against dev: build with `-Psalvemundi.apiBaseUrl=https://dev.salvemundi.nl`.
- Start over completely (on the server, deletes all dev data):
  `cd /opt/salve-mundi-v7/dev-core && docker compose -p v7-dev-core --env-file .env.dev-core down -v`

## Resources
The dev core adds about 1.5 GB of memory limits (Postgres 512 MB, Redis 256 MB, Directus 768 MB) plus the `v7-dev-*`
app containers. Check the server's free memory before the first deploy.
