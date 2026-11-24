# Mobile (iPhone app support)

Everything in this repository that supports the native Salve Mundi iPhone app and
can live outside framework- or build-mandated locations. The app itself lives in a
separate repository. The mobile API and notification worker are **acceptance only**
(`ENV_NAME=acc` and `MOBILE_API_ENABLED=true`); server remains the authority for
identity, membership, pricing, capacity, payment and QR validity.

## In this folder

| Path | What |
| --- | --- |
| [`docs/`](docs/) | Operator and setup documentation (see below) |
| [`deployment/`](deployment/) | `setup.py` (focused acceptance setup actions run over SSH) and its Python tests `test_setup.py` |
| [`tests/`](tests/) | Node tests for the mobile API/auth/admin/widget/preferences (`mobile-*.test.mjs`) |
| [`docker-compose.mobile-acceptance.yml`](docker-compose.mobile-acceptance.yml) | Standalone opt-in compose file for the acceptance notification worker |

### Docs

- [`mobile-acceptance.md`](docs/mobile-acceptance.md): overview of the acceptance boundary and checks
- [`mobile-notifications-acceptance.md`](docs/mobile-notifications-acceptance.md): worker setup, APNs configuration, stop instructions
- [`mobile-notification-readiness.md`](docs/mobile-notification-readiness.md): read-only readiness doctor
- [`mobile-notifications-github-setup.md`](docs/mobile-notifications-github-setup.md): GitHub workflow driven setup

## Outside this folder (on purpose)

| Path | Why it is not here |
| --- | --- |
| [`apps/services/mobile-notification-service/`](../services/mobile-notification-service/) | Worker service; Docker build contexts and CI depend on this location |
| [`apps/frontend/src/app/api/mobile/`](../frontend/src/app/api/mobile/) | Next.js route handlers must live under the app router |
| [`apps/frontend/src/server/mobile/`](../frontend/src/server/mobile/) | Server logic imported through the frontend `@/` alias |
| [`apps/frontend/src/app/.well-known/apple-app-site-association/`](../frontend/src/app/.well-known/apple-app-site-association/) | Must be served from the frontend |
| [`packages/db/drizzle/mobile_notifications.sql`](../../packages/db/drizzle/mobile_notifications.sql) | Manual migration, kept with the other drizzle SQL |
| [`.github/workflows/mobile-acceptance.yml`](../../.github/workflows/mobile-acceptance.yml), [`mobile-notifications-setup.yml`](../../.github/workflows/mobile-notifications-setup.yml) | GitHub only reads workflows from here |

## Running the checks

Run from the repository root (needs `bun install` first):

```sh
bun test apps/mobile/tests/mobile-security.test.mjs
bun test apps/mobile/tests/mobile-auth-flow.test.mjs apps/mobile/tests/mobile-admin*.test.mjs apps/mobile/tests/mobile-notification-preferences.test.mjs
node --test apps/services/mobile-notification-service/test/*.test.mjs
python3 -m unittest discover -s apps/mobile/deployment -p 'test_*.py'
```

The compose file must be run from the repository root:
`docker compose --env-file .env.acc --env-file .env.mobile-acc --project-directory . -f apps/mobile/docker-compose.mobile-acceptance.yml --profile mobile-acceptance up -d --build`
