# Mobile notifications — acceptance only

This service is deliberately absent from the normal deployment stack. It polls
committed PostgreSQL records, so ordinary event signups and changes made through
the website or Directus are included. It never changes registrations/payments.
Only regular activities (`events` / `event_signups`) are reconciled in this release;
existing pub-crawl and trip tickets remain viewable in the app, but do not yet
produce push notifications. No board-announcement workflow is added.

## Before enabling

1. Confirm which PostgreSQL database acceptance actually uses. The current
   deployment shares database infrastructure with production; database-name
   isolation cannot be inferred from branch isolation. Back up the selected DB.
2. Review and **manually** apply `packages/db/drizzle/mobile_notifications.sql`
   using a database administrator connection. No startup, build or deployment
   command applies migrations. The migration only adds `mobile_*` tables, all
   constrained to `environment='acc'`. It references existing user/session tables.
3. Set `MOBILE_API_ENABLED=true` only on the acceptance frontend. Register a test
   iPhone from the signed-in app and explicitly permit notifications in iOS.
4. Create an APNs key under Salve Mundi's Apple Developer organization, enable Push
   Notifications on `nl.salvemundi.ios`, and store the key only in server secrets.
   Do not add keys to source control or logs.
5. Add explicit test-member UUIDs to `MOBILE_NOTIFICATION_ALLOWED_USER_IDS`. The
   worker refuses an empty allowlist; there is no wildcard or all-members mode.

## Runtime settings

Keep APNs secrets and worker settings in a separate `.env.mobile-acc` file on the
server. Normal deployments regenerate `.env.acc`, so adding them to `.env.acc`
would lose them on the next deployment. Protect both files from source control
and restrict their filesystem permissions. `.env.acc` supplies database settings;
`.env.mobile-acc` supplies the following persistent worker settings.

```dotenv
ENV_NAME=acc
MOBILE_API_ENABLED=true
MOBILE_NOTIFICATIONS_ENABLED=true
MOBILE_NOTIFICATION_ALLOWED_USER_IDS=<comma-separated test-user UUIDs>
# Debug-device builds use sandbox. TestFlight uses production APNs even against acceptance.
MOBILE_APNS_ALLOW_PRODUCTION=false
APNS_KEY_ID=<Apple key ID>
APNS_TEAM_ID=<Apple team ID>
APNS_TOPIC=nl.salvemundi.ios
APNS_PRIVATE_KEY=<PEM private key; literal escaped newlines are supported>
# Either DATABASE_URL or the existing DB_HOST / DB_PORT / DB_NAME / DB_USER / DB_PASSWORD.
```

Set `MOBILE_APNS_ALLOW_PRODUCTION=true` on **both acceptance frontend and worker**
when deliberately testing TestFlight pushes. The allowlist remains mandatory.
An enabled worker stops immediately when `ENV_NAME` is anything except `acc`.
For supervised operation, restart only after investigating any startup failure.

## Run explicitly

From the website checkout with dependencies installed:

```sh
pnpm --filter @salvemundi/mobile-notification-service once
pnpm --filter @salvemundi/mobile-notification-service start
```

The process inherits its environment; pnpm does not automatically load `.env.acc`.
Use a service manager/secret injector or the standalone Docker Compose file:

```sh
docker compose --env-file .env.acc --env-file .env.mobile-acc -f docker-compose.mobile-acceptance.yml --profile mobile-acceptance up -d --build
docker compose --env-file .env.acc --env-file .env.mobile-acc -f docker-compose.mobile-acceptance.yml --profile mobile-acceptance logs --tail 50
docker compose --env-file .env.acc --env-file .env.mobile-acc -f docker-compose.mobile-acceptance.yml --profile mobile-acceptance down
```

Confirm that the existing core database network is named `salve-mundi-v7-shared` on the server;
if not, adjust only this standalone file to the actual network name. Nothing
changes the main compose stack, production workflow or production branch.

## Delivery behavior

- First sync establishes a baseline per test user and sends no historical alerts.
- Subsequent syncs detect new ordinary activity signups, payment-status changes,
  event title/time/location/status changes and paid event reminders within 24 hours.
- Event date/time is interpreted in `Europe/Amsterdam`, including daylight saving.
- Reminder delivery rechecks the live paid/published booking and future start time.
- Preferences are checked when enqueuing **and** sending; denied permissions mean
  iOS won't display alerts even when the server accepted the device token.
- Device tokens are session-bound. Logout removes them and cascades queued jobs;
  registering the token to a different account/session deletes its previous jobs.
- The durable outbox deduplicates per device and change, uses atomic claims,
  retries transient errors up to eight times with capped exponential delays,
  reclaims stale claims, and removes invalid/expired APNs tokens.
- Delivery is at-least-once; an unusual crash after APNs accepted a request but
  before PostgreSQL recorded success can repeat it. APNs collapse IDs reduce
  duplicate pending alerts but cannot guarantee exactly-once delivery.
- Push payloads contain generic Dutch text and an activity identifier; no QR,
  email, payment details or credentials. Delivered/failed payloads expire after
  30 days. Active device tokens and per-user observations remain until revoked
  or the association account is deleted.

## Validation and operation

`pnpm --filter @salvemundi/mobile-notification-service test` checks acceptance
isolation, allowlisting, TestFlight opt-in, first-sync baselining, reminders,
change deduplication keys, APNs error handling and real ES256 JWT signatures.
`build` / `type-check` syntax-check the JavaScript modules.

Before a pilot, run a controlled paid/free booking, change the event in Directus,
change notification preferences, log out, and confirm effects in the outbox and
on a physical test device. Tests use no live database or APNs credentials and
therefore cannot certify live delivery. No live delivery is claimed until this
pilot is completed.

To stop immediately, stop the standalone worker. To prevent restart, set
`MOBILE_NOTIFICATIONS_ENABLED=false` in `.env.mobile-acc`. Disabling the mobile
API alone also stops the worker at its next start; stop the running worker when
changing gates. Do not merge or deploy these changes to `main` as part of the pilot.

## Activity subscriptions and organizer thresholds

Apply the expanded version of the same manual migration to add the preference columns,
activity baseline/observation tables and outbox metadata. It is idempotent for an earlier
mobile migration. This still requires confirmation of the actual acceptance database;
no worker or build applies it automatically.

`GET/PATCH /api/mobile/v1/notification-preferences` now includes:

- `activityAnnouncements` (default false) and `activityCommitteeIDs` (empty means all
  committees when enabled). These notify about newly published future activities.
- `organizerAlmostFull` (default false), `organizerCapacityPercent` (50–100, default90).
- `organizerSignupThresholds` (up to10 distinct positive counts, at most10000 each).

`GET /api/mobile/v1/notification-preferences/options` returns public committee choices,
the current organizer committee scope and `canReceiveOrganizerAlerts`. Only current
activity administrators may enable organizer settings. Organizers receive notifications
for their currently authorized activity scope; selected announcement subscriptions never
grant organizer access. The worker imports the website's actual permission registry.

Counts include confirmed **paid** registrations (including manually confirmed free signups),
not pending/cancelled payments. A threshold alerts only when that count increases across it;
changing preferences/capacity alone does not fabricate a crossing. Near-full and exact-count
settings can be used independently. Each event/threshold is deduplicated per device.

An independent expanded-feature baseline suppresses existing activity alerts on the first
worker sync, including accounts initialized by the old worker. Future publications and
subsequent count increases may then notify. Every queued delivery rechecks current session,
account, publication/future event, preference, paid count and organizer committee membership.
Lost rights, cancelled/reassigned events or deselected subscriptions suppress queued alerts.
No counts, participant details or committee names are included in the APNs payload.
