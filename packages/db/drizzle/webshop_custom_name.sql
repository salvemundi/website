-- NOT YET APPLIED — run against the live DB (schema.ts is already updated to match).
-- Optional customer-provided name/text per product (e.g. a name printed on a hoodie).
ALTER TABLE "webshop_products" ADD COLUMN "custom_name_enabled" boolean DEFAULT false NOT NULL;
ALTER TABLE "webshop_products" ADD COLUMN "custom_name_max_length" integer;
ALTER TABLE "webshop_preorder_lines" ADD COLUMN "custom_name" varchar(255);
