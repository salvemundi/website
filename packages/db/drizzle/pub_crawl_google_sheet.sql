-- NOT YET APPLIED — run against the live DB (schema.ts is already hand-updated to match).
ALTER TABLE pub_crawl_events ADD COLUMN IF NOT EXISTS google_sheet_id varchar(255);
