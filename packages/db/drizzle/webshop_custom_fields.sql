-- NOT YET APPLIED — run against the live DB (schema.ts is already updated to match).
-- Replaces the single custom-name field (webshop_custom_name.sql) with admin-defined custom
-- input fields. `custom_fields` is a JSON array of { label, max_length } (NULL = none); the
-- customer's answers are stored per order line as a snapshot array of { label, value }.
-- Requires webshop_custom_name.sql to have been applied first (it reads the custom_name columns).
BEGIN;

ALTER TABLE "webshop_products" ADD COLUMN "custom_fields" jsonb;
ALTER TABLE "webshop_preorder_lines" ADD COLUMN "custom_field_values" jsonb;

-- Carry over existing custom-name configuration/answers (single field labelled "Naam").
UPDATE "webshop_products"
SET "custom_fields" = jsonb_build_array(jsonb_build_object('label', 'Naam', 'max_length', COALESCE("custom_name_max_length", 255)))
WHERE "custom_name_enabled" = true;

UPDATE "webshop_preorder_lines"
SET "custom_field_values" = jsonb_build_array(jsonb_build_object('label', 'Naam', 'value', "custom_name"))
WHERE "custom_name" IS NOT NULL AND "custom_name" <> '';

ALTER TABLE "webshop_products" DROP COLUMN IF EXISTS "custom_name_enabled";
ALTER TABLE "webshop_products" DROP COLUMN IF EXISTS "custom_name_max_length";
ALTER TABLE "webshop_preorder_lines" DROP COLUMN IF EXISTS "custom_name";

COMMIT;
