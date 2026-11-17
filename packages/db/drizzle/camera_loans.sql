-- NOT YET APPLIED — run against the live DB (schema.ts is already hand-updated to match).
-- Requires camera.sql to have been applied first.
-- Uitleenlog van de verenigingscamera: wat er echt is meegegeven en teruggebracht.
BEGIN;

CREATE TABLE IF NOT EXISTS "camera_loans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"handed_out_at" timestamp with time zone DEFAULT now() NOT NULL,
	"checklist" jsonb NOT NULL,
	"handout_note" varchar(500),
	"returned_on" date,
	"condition_on_return" varchar(500),
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "camera_loans_request_id_unique" UNIQUE ("request_id"),
	CONSTRAINT "camera_loans_request_id_camera_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "camera_requests"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_camera_loans_open" ON "camera_loans" USING btree ("returned_on");

COMMIT;
