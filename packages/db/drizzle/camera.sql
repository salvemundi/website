-- NOT YET APPLIED — run against the live DB (schema.ts is already hand-updated to match).
-- Camera-uitleen: leden vragen de verenigingscamera (en eventueel een fotograaf) aan voor een activiteit.
BEGIN;

CREATE TABLE IF NOT EXISTS "camera_photographers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"admitted_on" date DEFAULT CURRENT_DATE NOT NULL,
	"route" varchar(100),
	"experienced" boolean DEFAULT false NOT NULL,
	"note" varchar(300),
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "camera_photographers_user_id_unique" UNIQUE ("user_id"),
	CONSTRAINT "camera_photographers_user_id_directus_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "directus_users"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "camera_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"requester_id" uuid NOT NULL,
	"event_id" integer,
	"event_name" varchar(255) NOT NULL,
	"start_date" date NOT NULL,
	"start_time" time,
	"end_date" date NOT NULL,
	"end_time" time,
	"proposed_photographer_id" uuid,
	"assigned_photographer_id" uuid,
	"note" varchar(500),
	"note_admin" varchar(500),
	"status" varchar(12) DEFAULT 'requested' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone,
	CONSTRAINT "camera_requests_requester_id_directus_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "directus_users"("id") ON DELETE CASCADE,
	CONSTRAINT "camera_requests_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE SET NULL,
	CONSTRAINT "camera_requests_proposed_photographer_fk" FOREIGN KEY ("proposed_photographer_id") REFERENCES "camera_photographers"("id") ON DELETE SET NULL,
	CONSTRAINT "camera_requests_assigned_photographer_fk" FOREIGN KEY ("assigned_photographer_id") REFERENCES "camera_photographers"("id") ON DELETE SET NULL,
	CONSTRAINT "camera_requests_status_check" CHECK ("status" IN ('requested', 'approved', 'rejected', 'cancelled')),
	CONSTRAINT "camera_requests_period_check" CHECK ("end_date" >= "start_date")
);

CREATE INDEX IF NOT EXISTS "idx_camera_requests_requester" ON "camera_requests" USING btree ("requester_id");
CREATE INDEX IF NOT EXISTS "idx_camera_requests_period" ON "camera_requests" USING btree ("start_date", "end_date");

COMMIT;
