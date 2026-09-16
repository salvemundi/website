-- APPLIED — run directly against the live DB (see webshop_preorder_staged.sql for the
-- same pattern: schema.ts is introspected from the live DB, and has already been
-- hand-updated to match what this script produces). Kept for reference only.
--
-- Note: this migration predates a separate, independently-shipped change on this branch
-- that added its own `max_orders` column and full-payment-upfront flow to the same
-- tables. `stock_quantity` (this file) and `max_orders` are two different, complementary
-- limits — total units available vs. number of separate orders allowed — and both now
-- coexist on `webshop_products`.

-- 1. Stock tracking for the merch/webshop feature. NULL = unlimited stock (existing
--    products keep working unchanged); 0 = sold out.
ALTER TABLE "webshop_products" ADD COLUMN "stock_quantity" integer;
ALTER TABLE "webshop_product_variants" ADD COLUMN "stock_quantity" integer;

-- 2. Public slug rename /webshop -> /merch: carry over any existing show/hide toggle
--    and custom disabled-message for the storefront feature flag.
UPDATE "feature_flags" SET "route_match" = '/merch' WHERE "route_match" = '/webshop';
