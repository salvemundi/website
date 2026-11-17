-- NOT YET APPLIED — run against the live DB (schema.ts is already hand-updated to match).
-- Requires camera.sql and camera_loans.sql to have been applied first.
-- photo_status: voortgang van het verwerken van de foto's; last_reminder_on: voorkomt dubbele herinneringsmails.
BEGIN;

ALTER TABLE "camera_requests" ADD COLUMN IF NOT EXISTS "photo_status" varchar(12) DEFAULT 'not_started' NOT NULL;
ALTER TABLE "camera_requests" DROP CONSTRAINT IF EXISTS "camera_requests_photo_status_check";
ALTER TABLE "camera_requests" ADD CONSTRAINT "camera_requests_photo_status_check" CHECK ("photo_status" IN ('not_started', 'editing', 'done'));

ALTER TABLE "camera_loans" ADD COLUMN IF NOT EXISTS "last_reminder_on" date;

COMMIT;
