# Read-only notification setup check

Run the doctor on the acceptance server with the worker's existing environment securely injected by the operator. It does not load files, apply a migration, register a device, change a record or send a notification. Never paste keys or environment contents into chat or logs.

```sh
node apps/services/mobile-notification-service/src/readiness.mjs
node apps/services/mobile-notification-service/src/readiness.mjs --database
```

The first command checks environment gates, test-member allowlisting, Apple ID/topic format and whether the supplied key is an ES256-compatible EC key. It deliberately returns an unsuccessful status because database verification was not requested. It cannot prove that Apple issued this key for the given account or that it has the correct APNs permissions.

The database option opens a short read-only transaction. It checks required tables, expanded preference columns, the outbox metadata column and validated notification-kind constraint, and the supported Better Auth session-column layout, then rolls back. It prints check labels and PASS/FAIL only; credentials, member IDs, database names, hostname, device tokens and key material are never printed. Connection/query failures are reported generically.

For isolation verification, an operator who has checked the actual production database must supply its exact database name as `PRODUCTION_DB_NAME` and explicitly set `MOBILE_ACCEPTANCE_DB_ISOLATION_CONFIRMED=true`. These variables are only evidence of the operator's comparison; the doctor does not connect to production. A shared database or missing confirmation fails readiness. No migration should be applied until database isolation has been established.

A successful check still requires a running acceptance worker and a controlled end-to-end device pilot. Enable only explicit approved test members. Do not treat a valid key shape, successful device API response, or passing configuration check as proof of live APNs delivery. See `mobile-notifications-acceptance.md` for deployment and stop instructions.


An explicitly acknowledged shared-database pilot is a separate exception, not isolation. It requires `MOBILE_NOTIFICATION_SHARED_DB_PILOT=true`, a single UUID matching `MOBILE_NOTIFICATION_SHARED_DB_USER_ID`, sandbox-only APNs, and the actual connected database matching `DB_NAME`, `MOBILE_NOTIFICATION_SHARED_DB_EXPECTED_NAME` and the known production name. The doctor labels it SHARED / NOT isolated. The ordinary isolated path remains unchanged. See `mobile-notifications-github-setup.md`; this mode never authorizes migrations and is not a database ACL boundary.
