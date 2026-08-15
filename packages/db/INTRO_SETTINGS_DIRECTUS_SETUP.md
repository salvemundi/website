# Intro settings — Directus setup guide

The database is managed through Directus, not raw SQL migrations. This document lists the exact collection/fields to create in the Directus admin UI for the `intro_settings` singleton — holds the "planning" banner image and the downloadable info booklet shown on `/qr-code`.

Once applied, run `pnpm db:sync` from the repo root to regenerate `packages/db/drizzle/schema.ts` / `relations.ts` and `packages/validations` types from the live database — that regenerated output replaces the provisional versions of those files committed alongside this guide.

## `intro_settings`

Configure this collection in Directus as a **Singleton** (Data Model → intro_settings → enable "Treat as single object"), so the admin UI only ever shows/edits one row.

| Field | Type | Interface | Notes |
|---|---|---|---|
| `id` | integer, auto-increment | — | primary key; always row `1` in practice |
| `planning_image` | M2O → `directus_files` | Image | optional, on delete: **Nullify**; full-width banner image shown above the live planning on the public QR-code page |
| `info_booklet` | M2O → `directus_files` | File | optional, on delete: **Nullify**; downloadable PDF (intro info booklet) shown on the public QR-code page |
| `qr_scan_count` | integer | Input | required, default `0`; incremented on every load of `/qr-code`, shown as a stat in `/beheer/intro` — counts page views, not unique scans |
| `updated_at` | timestamp | Datetime | standard "Date Updated" |

No `created_at` needed — there is only ever one row, created lazily by the app on first save (get-or-create pattern), the same as `feature_flags` rows.

## Permissions

Grant the Directus **service role** used by the frontend full CRUD on `intro_settings`, same as `intro_planning`/`intro_confidants`. No public/unauthenticated Directus API access is required — the public page reads through the Next.js app's `getIntroPlanningImagePublic()` / `getIntroInfoBookletPublic()` server actions.

## After setup

```
pnpm db:sync
```

This runs `drizzle-kit pull`, normalizes the schema, rebuilds `@salvemundi/db`, and regenerates `@salvemundi/validations` Zod schemas/types — replacing the provisional hand-written additions in `packages/db/drizzle/schema.ts` and `packages/validations/src/schema/db.zod.ts` with the real introspected output.
