-- NOT YET APPLIED — run against the live DB (schema.ts is already hand-updated to match).
ALTER TABLE pizza_rounds ADD COLUMN IF NOT EXISTS payment_link varchar(300);
