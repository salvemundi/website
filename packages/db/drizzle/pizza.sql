-- NOT YET APPLIED — run against the live DB (schema.ts is already hand-updated to match).
-- Pizza-rondes: een lid start een ronde, anderen plaatsen hun bestelling erin.
BEGIN;

CREATE TABLE IF NOT EXISTS "pizza_rounds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creator_id" uuid NOT NULL,
	"title" varchar(100) NOT NULL,
	"note" text,
	"closes_at" timestamp with time zone NOT NULL,
	"status" varchar(10) DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "pizza_rounds_creator_id_directus_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "directus_users"("id") ON DELETE CASCADE,
	CONSTRAINT "pizza_rounds_status_check" CHECK ("status" IN ('open', 'closed', 'paid'))
);

CREATE TABLE IF NOT EXISTS "pizza_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"round_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"item_name" varchar(100) NOT NULL,
	"size" varchar(20),
	"note" varchar(200),
	"price" numeric(8,2) NOT NULL,
	"pay_confirmed_at" timestamp with time zone NOT NULL,
	"added_to_order_at" timestamp with time zone,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "pizza_orders_round_id_pizza_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "pizza_rounds"("id") ON DELETE CASCADE,
	CONSTRAINT "pizza_orders_user_id_directus_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "directus_users"("id") ON DELETE CASCADE,
	CONSTRAINT "pizza_orders_price_check" CHECK ("price" > 0)
);

CREATE INDEX IF NOT EXISTS "idx_pizza_rounds_creator" ON "pizza_rounds" USING btree ("creator_id");
CREATE INDEX IF NOT EXISTS "idx_pizza_orders_round" ON "pizza_orders" USING btree ("round_id");
CREATE INDEX IF NOT EXISTS "idx_pizza_orders_user" ON "pizza_orders" USING btree ("user_id");

COMMIT;
