-- STAGED MIGRATION — not part of the drizzle journal/_journal.json.
-- This file is NOT auto-applied by `pnpm db:sync` or any tooling in this repo.
-- It is the proposed contract for the webshop preorder domain (see packages/db/src/schema.ts
-- for the matching hand-written Drizzle definitions). Apply this against the real Postgres
-- instance (or recreate as equivalent Directus collections) before the webshop application
-- code can run end-to-end. Once applied, run `pnpm db:sync` from the repo root to pull the
-- real schema and replace the staged definitions with introspected ones.

CREATE TABLE "webshop_drop_windows" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'draft',
	"opens_at" timestamp with time zone,
	"closes_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "webshop_products" (
	"id" serial PRIMARY KEY NOT NULL,
	"drop_window_id" integer,
	"type" varchar(50) DEFAULT 'item' NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"price" numeric(10, 5) NOT NULL,
	"deposit_amount" numeric(10, 5) NOT NULL,
	"size_chart" jsonb,
	"is_active" boolean DEFAULT true,
	"display_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "uq_webshop_products_slug" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "webshop_product_media" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"asset" uuid NOT NULL,
	"display_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "webshop_product_variants" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"size" varchar(50),
	"color" varchar(50),
	"sku" varchar(100),
	"is_active" boolean DEFAULT true,
	"display_order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "webshop_preorders" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"user_id" uuid,
	"drop_window_id" integer,
	"first_name" varchar(255) NOT NULL,
	"last_name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone_number" varchar(255),
	"status" varchar(50) DEFAULT 'awaiting_deposit',
	"subtotal_amount" numeric(10, 5) NOT NULL,
	"deposit_amount" numeric(10, 5) NOT NULL,
	"deposit_paid" boolean DEFAULT false,
	"deposit_paid_at" timestamp,
	"final_payment_paid" boolean DEFAULT false,
	"final_payment_paid_at" timestamp,
	"terms_accepted" boolean DEFAULT false,
	"pickup_notes" text,
	"access_token" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "webshop_preorder_lines" (
	"id" serial PRIMARY KEY NOT NULL,
	"preorder_id" integer NOT NULL,
	"product_id" integer,
	"variant_id" integer,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" numeric(10, 5) NOT NULL,
	"product_name_snapshot" varchar(255),
	"variant_label_snapshot" varchar(255)
);
--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "webshop_preorder" integer;
--> statement-breakpoint
ALTER TABLE "webshop_products" ADD CONSTRAINT "webshop_products_drop_window_id_foreign" FOREIGN KEY ("drop_window_id") REFERENCES "public"."webshop_drop_windows"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "webshop_product_media" ADD CONSTRAINT "webshop_product_media_product_id_foreign" FOREIGN KEY ("product_id") REFERENCES "public"."webshop_products"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "webshop_product_media" ADD CONSTRAINT "webshop_product_media_asset_foreign" FOREIGN KEY ("asset") REFERENCES "public"."directus_files"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "webshop_product_variants" ADD CONSTRAINT "webshop_product_variants_product_id_foreign" FOREIGN KEY ("product_id") REFERENCES "public"."webshop_products"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "webshop_preorders" ADD CONSTRAINT "webshop_preorders_user_id_foreign" FOREIGN KEY ("user_id") REFERENCES "public"."directus_users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "webshop_preorders" ADD CONSTRAINT "webshop_preorders_drop_window_id_foreign" FOREIGN KEY ("drop_window_id") REFERENCES "public"."webshop_drop_windows"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "webshop_preorder_lines" ADD CONSTRAINT "webshop_preorder_lines_preorder_id_foreign" FOREIGN KEY ("preorder_id") REFERENCES "public"."webshop_preorders"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "webshop_preorder_lines" ADD CONSTRAINT "webshop_preorder_lines_product_id_foreign" FOREIGN KEY ("product_id") REFERENCES "public"."webshop_products"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "webshop_preorder_lines" ADD CONSTRAINT "webshop_preorder_lines_variant_id_foreign" FOREIGN KEY ("variant_id") REFERENCES "public"."webshop_product_variants"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_webshop_preorder_foreign" FOREIGN KEY ("webshop_preorder") REFERENCES "public"."webshop_preorders"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "idx_webshop_products_drop_window" ON "webshop_products" USING btree ("drop_window_id" int4_ops);
--> statement-breakpoint
CREATE INDEX "idx_webshop_product_media_product" ON "webshop_product_media" USING btree ("product_id" int4_ops);
--> statement-breakpoint
CREATE INDEX "idx_webshop_product_variants_product" ON "webshop_product_variants" USING btree ("product_id" int4_ops);
--> statement-breakpoint
CREATE INDEX "idx_webshop_preorders_user" ON "webshop_preorders" USING btree ("user_id" uuid_ops);
--> statement-breakpoint
CREATE INDEX "idx_webshop_preorders_drop_window" ON "webshop_preorders" USING btree ("drop_window_id" int4_ops);
--> statement-breakpoint
CREATE INDEX "idx_webshop_preorder_lines_preorder" ON "webshop_preorder_lines" USING btree ("preorder_id" int4_ops);
