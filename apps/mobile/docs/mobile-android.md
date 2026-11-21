# Android app — acceptance only

The Android app (`nl.salvemundi.android`) uses the same acceptance-only `/api/mobile/v1`
API, gates and PKCE login as iOS (`salvemundi://auth/callback`). Everything below is
off until explicitly configured; iOS behavior is unchanged.

## Client platform header

The app sends `X-Client-Platform: android`. The value is a closed allowlist
(`android`, otherwise `ios`) and is never used for authorization. It sets the admin
audit-log `source` (`android`/`ios`) and the default session user agent.

## Device registration

`POST /api/mobile/v1/devices` (app token required), strict JSON body:

| field | rule |
| --- | --- |
| `token` | iOS: `^[a-fA-F0-9]{64,200}$` (stored lower-case). Android: FCM registration token `^[A-Za-z0-9_:-]{100,1024}$` (stored verbatim, case-sensitive) |
| `environment` | `sandbox` or `production` |
| `platform` | optional, `ios` (default) or `android` |

- Unknown fields, a bad platform or a token that does not match the platform: **400** `INVALID_DEVICE`.
- `production` without `MOBILE_APNS_ALLOW_PRODUCTION=true`: **409** `APNS_ENVIRONMENT_DISABLED`.
  The same gate applies to Android; use `sandbox` for acceptance/debug builds.
- 200 `{"data":{"success":true,"registered":true}}`.

`DELETE /api/mobile/v1/devices/{token}` accepts either token format (percent-encoding is
decoded) and removes it only for the current user and session; 200 `{"data":{"success":true,"registered":false}}`.
Logout removes all devices of the session for both platforms.

Android registration needs the migration below; iOS registration works before and after it.

## Migration

Apply `packages/db/drizzle/mobile_notifications_android.sql` **manually**, after
`mobile_notifications.sql`, on the confirmed acceptance database (or via the setup
workflow's `migrate` action, which applies both files in order). It is idempotent and
additive: it adds `mobile_devices.platform` (default `ios`, check `ios|android`),
replaces the token check with a per-platform rule (iOS keeps the hex rule) and adds
an index on `(environment, platform)`. Nothing applies it automatically.

## Push delivery (FCM HTTP v1)

The worker routes devices with `platform='android'` to FCM and all others to APNs.
Android delivery is **off** unless `MOBILE_FCM_ENABLED=true`; every APNs gate still
applies (`ENV_NAME=acc`, `MOBILE_API_ENABLED`, `MOBILE_NOTIFICATIONS_ENABLED`, the
explicit user allowlist, the shared-database pilot rules and the sandbox/production gate).
While disabled, queued Android jobs are marked skipped.

1. In the Firebase project of the Android app, create a service account with the
   *Firebase Cloud Messaging API Admin* role (or use the Firebase Admin SDK account) and
   download its JSON key. Keep it out of source control and logs.
2. Add to `.env.mobile-acc` on the server (the setup script keeps these when APNs is reconfigured):

   ```dotenv
   MOBILE_FCM_ENABLED=true
   # Either the full service-account JSON on one line ...
   FCM_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"...","client_email":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...","private_key_id":"..."}
   # ... or the separate values (they take precedence over the JSON):
   FCM_PROJECT_ID=<firebase project id>
   FCM_CLIENT_EMAIL=<service account email>
   FCM_PRIVATE_KEY=<PEM RSA private key; escaped \n newlines are supported>
   ```
3. Run the readiness doctor; with FCM enabled it checks the project ID, client email,
   RSA key, endpoints and the `mobile_devices.platform` column. With FCM disabled it prints
   a passing `Android FCM delivery disabled` line.

The worker signs an RS256 service-account JWT, exchanges it at
`https://oauth2.googleapis.com/token` (scope `firebase.messaging`), caches the access token
and posts to `https://fcm.googleapis.com/v1/projects/{project}/messages:send`.
`UNREGISTERED`/404, `SENDER_ID_MISMATCH` and an `INVALID_ARGUMENT` about the token remove the
device (like APNs 410); 401 (token dropped and renewed), 429 and 5xx retry with the same
back-off as APNs (eight attempts). `src/test-delivery.mjs` remains an APNs-only pilot.

### Message shape

A data-only message, so the app always builds and routes the notification itself:

```json
{"message":{"token":"<fcm token>","data":{"kind":"payments","activityID":"event:42","title":"Borrel","body":"De betaalstatus van je inschrijving is bijgewerkt.","url":"<optional>"},
 "android":{"priority":"HIGH","ttl":"3600s","collapse_key":"<24 hex>"}}}
```

All `data` values are strings. `kind` is one of `registrations`, `payments`, `eventChanges`,
`reminders`, `activityAnnouncements`, `organizerAlmostFull`, `organizerSignups`.
`activityID` (`event:<digits>`) and `url` are omitted when absent.

### Local fake sender (tests only)

`FCM_API_BASE_URL` and `FCM_TOKEN_URL` (both required together) are honoured only when
`NODE_ENV=test`, or `NODE_ENV` is not `production` and `MOBILE_FCM_TEST_ENDPOINTS=true`,
and only for `localhost`, `127.0.0.1`, `[::1]`, `10.0.2.2` or `host.docker.internal`.
Otherwise the worker refuses to start. The setup script never forwards these variables.

## Android App Links

`/.well-known/assetlinks.json` is served with the same gate as the Apple association file
(`ENV_NAME=acc`, `MOBILE_API_ENABLED=true`; the proxy lets both through) and only when
`MOBILE_ANDROID_SHA256_CERT_FINGERPRINTS` holds one or more comma-separated SHA-256 signing
certificate fingerprints (`AA:BB:...`, 32 bytes, case-insensitive). Otherwise it returns 404.
`MOBILE_ANDROID_PACKAGE_NAME` defaults to `nl.salvemundi.android`. Use the fingerprint of the
signing key that signs installed builds (Play App Signing key from the Play Console, and/or
`keytool -list -v -keystore <keystore>` for debug/upload keys). The stack workflow reads both
from GitHub Acceptance **variables** of the same name (fingerprints are public, not secrets).

The payment return (`/api/mobile/v1/payment-return`) is platform-neutral: it redirects to
`salvemundi://tickets` for both apps.
