# Bijbanenbank — Directus setup guide

The database is managed through Directus, not raw SQL migrations. This document lists the exact collections/fields/relations to create in the Directus admin UI for the Bijbanenbank (vacancy board) feature. Once applied, run `pnpm db:sync` from the repo root to regenerate `packages/db/drizzle/schema.ts` / `relations.ts` and `packages/validations` types from the live database — that regenerated output replaces the provisional versions of those files committed alongside this guide.

## 1. `vacancy_ict_directions` (create first — referenced by the other collections)

Simple lookup collection, no user-facing timestamps needed.

| Field | Type | Interface | Notes |
|---|---|---|---|
| `id` | integer, auto-increment | — | primary key |
| `name` | string (varchar 255) | Input | required, unique |
| `slug` | string (varchar 255) | Input | required, unique |

After creating the collection, add 13 rows (Content module) with these `name`/`slug` pairs:

| name | slug |
|---|---|
| Artificial Intelligence | artificial-intelligence |
| Business Intelligence & Data | business-intelligence-data |
| Business IT & Management | business-it-management |
| Cyber Security | cyber-security |
| Embedded Software Engineering | embedded-software-engineering |
| Game Design & Development | game-design-development |
| Infrastructure & Cloud | infrastructure-cloud |
| Multimedia Design & Concepts | multimedia-design-concepts |
| Robotics | robotics |
| Smart Industry & Internet of Things | smart-industry-iot |
| Software Engineering | software-engineering |
| Software Engineering Accelerated Programme | software-engineering-accelerated-programme |
| User Interaction Design & Development | user-interaction-design-development |

## 2. `vacancy_submissions`

External-company submissions, prior to approval.

| Field | Type | Interface | Notes |
|---|---|---|---|
| `id` | integer, auto-increment | — | primary key |
| `title` | string (varchar 255) | Input | required |
| `company` | string (varchar 255) | Input | required |
| `description` | text | Textarea | required |
| `type` | string (varchar 20) | Dropdown | required; choices `internship`, `parttime` |
| `contact_email` | string (varchar 255) | Input (email) | required |
| `contact_phone` | string (varchar 50) | Input | optional |
| `contact_website` | string (varchar 500) | Input (URL) | optional |
| `location` | string (varchar 255) | Input | required |
| `salary` | string (varchar 255) | Input | optional |
| `employment_type` | string (varchar 100) | Input | optional |
| `working_hours` | string (varchar 255) | Input | optional |
| `status` | string (varchar 30) | Dropdown | default `pending_verification`; choices `pending_verification`, `pending_review`, `approved`, `rejected` |
| `rejection_reason` | text | Textarea | optional |
| `reviewed_by` | M2O → `directus_users` | User | optional, on delete: **Nullify** |
| `reviewed_at` | timestamp | Datetime | optional |
| `approved_vacancy_id` | M2O → `vacancies` (create after step 3) | — | optional, on delete: **Nullify** |
| `submitter_ip` | string (varchar 64) | Input | optional |
| `verified_at` | timestamp | Datetime | optional |
| `image` | M2O → `directus_files` | Image | optional, on delete: **Nullify** |
| `document` | M2O → `directus_files` | File | optional, on delete: **Nullify**; the internship-assignment PDF/Word document |
| `skills` | json | Tags | optional, default `[]`; free-form skill tags |
| `created_at` | timestamp | Datetime | default now, use Directus's standard "Date Created" field |
| `updated_at` | timestamp | Datetime | use Directus's standard "Date Updated" field |

## 3. `vacancies`

The live, browsable/admin-managed listings.

| Field | Type | Interface | Notes |
|---|---|---|---|
| `id` | integer, auto-increment | — | primary key |
| `title` | string (varchar 255) | Input | required |
| `company` | string (varchar 255) | Input | required |
| `description` | text | Textarea | required |
| `type` | string (varchar 20) | Dropdown | required; choices `internship`, `parttime` |
| `contact_email` | string (varchar 255) | Input (email) | required |
| `contact_phone` | string (varchar 50) | Input | optional |
| `contact_website` | string (varchar 500) | Input (URL) | optional |
| `location` | string (varchar 255) | Input | required |
| `salary` | string (varchar 255) | Input | optional |
| `employment_type` | string (varchar 100) | Input | optional |
| `working_hours` | string (varchar 255) | Input | optional |
| `is_visible` | boolean | Toggle | default `true` |
| `published_at` | timestamp | Datetime | default now |
| `image` | M2O → `directus_files` | Image | optional, on delete: **Nullify** |
| `document` | M2O → `directus_files` | File | optional, on delete: **Nullify**; the internship-assignment PDF/Word document |
| `skills` | json | Tags | optional, default `[]`; free-form skill tags |
| `created_by` | M2O → `directus_users` | User | optional, on delete: **Nullify**; set when an admin creates the vacancy directly |
| `created_at` | timestamp | Datetime | standard "Date Created" |
| `updated_at` | timestamp | Datetime | standard "Date Updated" |

Now go back to `vacancy_submissions` and finish wiring the `approved_vacancy_id` M2O field (step 2 lists it as pointing here; the target collection now exists).

## 4. `vacancy_verification_tokens`

| Field | Type | Interface | Notes |
|---|---|---|---|
| `id` | integer, auto-increment | — | primary key |
| `submission_id` | M2O → `vacancy_submissions` | — | required, on delete: **Cascade** |
| `token` | string (varchar 255) | Input | required, unique |
| `expires_at` | timestamp | Datetime | required |
| `used_at` | timestamp | Datetime | optional |
| `created_at` | timestamp | Datetime | standard "Date Created" |

## 5. Many-to-many: ICT directions

Two M2M fields, created via Directus's "Many to Many" field wizard. The wizard auto-creates a junction collection — **keep Directus's default junction column names** (`<collection>_id` on each side); the application code is written to match those, not the shorter names an earlier draft of this guide suggested.

- On **`vacancies`**: add field `ict_directions` → related collection `vacancy_ict_directions`. Junction collection name: **`vacancy_direction_links`**, with columns **`vacancies_id`** and **`vacancy_ict_directions_id`** (Directus's defaults — do not rename them).
- On **`vacancy_submissions`**: add field `ict_directions` → related collection `vacancy_ict_directions`. Junction collection name: **`vacancy_submission_direction_links_`** (note: this one ended up with a trailing underscore in the actual environment — check what Directus actually named it and adjust `packages/db/drizzle/schema.ts` if it differs), with columns **`vacancy_submissions_id`** and **`vacancy_ict_directions_id`**.

## 6. Permissions (Directus roles)

Grant the Directus **service role** used by the frontend (the same role/policy the app already uses for `events`, `webshop_products`, etc. — see existing collection permissions for reference) full CRUD on all five new collections plus the two junction collections. No public/unauthenticated Directus API access is needed — all reads/writes for this feature go through the Next.js app's own Drizzle queries and server actions, which enforce the app-level permission checks (auth session + `Bestuur`/`ICT Commissie` committee membership) described in the code.

## 7. After setup

```
pnpm db:sync
```

This runs `drizzle-kit pull`, normalizes the schema, rebuilds `@salvemundi/db`, and regenerates `@salvemundi/validations` Zod schemas/types — replacing the provisional hand-written additions in `packages/db/drizzle/schema.ts` / `relations.ts` with the real introspected output. Diff the result against the provisional version to confirm field names/types line up with what the application code (`src/server/actions/vacancies/**`) expects.
