# iPhone backend — acceptance only

The native app is maintained separately at <https://github.com/salvemundi/ios-app>. This branch adds HTTP endpoints under `/api/mobile/v1` and an optional notification worker. It is based on `acceptance` and must target `acceptance`, not `main`.

## Environment gate

The API returns 404 unless **both** `ENV_NAME=acc` and `MOBILE_API_ENABLED=true`. The website proxy also enforces this before forwarding mobile requests. The normal stack deployment reads `MOBILE_API_ENABLED` from the GitHub **Acceptance** environment variable, defaulting to false, and explicitly disables the API in production.

No migration, deployment, GitHub environment activation or APNs activation is performed by adding these files. Review and deploy to acceptance before enabling its variable.

## Database boundary

The existing deployment points acceptance and production at the same PostgreSQL host and Directus instance. Database names come from environment-scoped secrets; source alone cannot establish whether their databases are different. Verify the selected database before migrations or tests that create bookings.

The app uses the existing members, activities, registrations, transactions and tickets. There is no duplicate member database. App credentials use separate `mobile:` session IDs and hashed `mobile-sha256:` token values in the existing `auth_sessions` table. Authentication reads the database on every private request and rejects inactive users and expired/revoked sessions.

The only additional schema is the manually applied `packages/db/drizzle/mobile_notifications.sql`. It creates environment-scoped `mobile_*` notification tables and does not change existing member/event tables. Do not run a general schema regeneration or reset to install it.

## Authentication and app links

The app opens `/auth/start` in the system authentication browser with a PKCE challenge, state and the exact `salvemundi://auth/callback` redirect. The server uses the existing Microsoft provider. A one-use Redis flow and short-lived grant hand the authorization code back to the app; `/auth/exchange` verifies PKCE and returns the native credential over HTTPS. No credential appears in the callback URL.

`/auth/logout` revokes the session and removes its registered devices. Browser cookies and impersonation are never accepted as mobile API identity. Native tokens do not replace or change existing website cookies or Redis session behavior.

Activity and ticket HTTPS app links use the included `/.well-known/apple-app-site-association` route. Set the GitHub Acceptance variable `MOBILE_APPLE_TEAM_ID` to the actual ten-character Apple organization Team ID; the route combines this with `nl.salvemundi.ios` and otherwise returns 404. Configure the Team ID before app-link testing. The custom URL callback is available for authentication/payment return while that host association is configured.

## Registration and profile behavior

Versioned endpoints expose published activities, member-owned tickets, own membership/profile, registration, notification preferences and device registration. They return `{data: ...}` or `{error: {code, message}}`; private endpoints return JSON 401 rather than website redirects.

The website and app share extracted registration, ticket and profile services. Registration prices, capacity, deadlines and member restrictions remain server decisions. Retry of an existing registration returns its existing booking/payment rather than creating another payment. Mollie webhooks remain authoritative. External/custom signup activities continue through the website.

Names and membership stay managed by the association/Microsoft identity systems. Native self-service profile editing is limited to the existing phone-number update flow.

## Notifications

See [notification worker setup](mobile-notifications-acceptance.md) for manual migration, persistent APNs configuration, test-account allowlist, sandbox/TestFlight token handling and worker commands. Delivery is separately disabled by default. The standalone worker compose file does not alter or start with the regular production/acceptance stack.

## Before release

Validate Microsoft login/revocation, cross-user isolation, website registration regression, pricing/capacity/deadlines, payment interruption/retry/webhook reconciliation, native QR compatibility and device logout. Use approved test members and the existing acceptance payment simulator. No production promotion is part of this branch.


## Automated checks

Run `node --experimental-strip-types --test tests/mobile-security.test.mjs`, `node --test apps/services/mobile-notification-service/test/*.test.mjs`, and the frontend type/lint checks. The dedicated mobile acceptance workflow runs the policy and notification tests without service credentials. Live login/payment/scanner checks still need the acceptance services.
