-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE "club_members" (
	"club_id" integer NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"is_leader" boolean DEFAULT false NOT NULL,
	"id" serial PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Stickers" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_created" uuid,
	"date_created" timestamp with time zone,
	"user_updated" uuid,
	"date_updated" timestamp with time zone,
	"location_name" varchar(255),
	"address" text,
	"latitude" double precision,
	"longitude" double precision,
	"description" text,
	"country" varchar(255),
	"city" varchar(255),
	"image" uuid,
	"status" varchar(255) DEFAULT 'draft'
);
--> statement-breakpoint
CREATE TABLE "Board" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_created" uuid,
	"date_created" timestamp with time zone,
	"user_updated" uuid,
	"date_updated" timestamp with time zone,
	"image" uuid,
	"naam" varchar(255),
	"year" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "Board_Members" (
	"id" serial PRIMARY KEY NOT NULL,
	"date_created" timestamp with time zone,
	"date_updated" timestamp with time zone,
	"board_id" integer,
	"functie" varchar(255),
	"user_id" uuid,
	"name" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone_number" varchar(50),
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"image" uuid
);
--> statement-breakpoint
CREATE TABLE "directus_access" (
	"id" uuid PRIMARY KEY NOT NULL,
	"role" uuid,
	"user" uuid,
	"policy" uuid NOT NULL,
	"sort" integer
);
--> statement-breakpoint
CREATE TABLE "committees" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone,
	"image" uuid,
	"is_visible" boolean DEFAULT false,
	"short_description" text,
	"description" text,
	"email" varchar(255),
	"commissie_token" varchar(10),
	"azure_group_id" varchar(255),
	CONSTRAINT "committees_name_key" UNIQUE("name"),
	CONSTRAINT "committees_commissie_token_unique" UNIQUE("commissie_token")
);
--> statement-breakpoint
CREATE TABLE "directus_comments" (
	"id" uuid PRIMARY KEY NOT NULL,
	"collection" varchar(64) NOT NULL,
	"item" varchar(255) NOT NULL,
	"comment" text NOT NULL,
	"date_created" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"date_updated" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"user_created" uuid,
	"user_updated" uuid
);
--> statement-breakpoint
CREATE TABLE "directus_dashboards" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"icon" varchar(64) DEFAULT 'dashboard' NOT NULL,
	"note" text,
	"date_created" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"user_created" uuid,
	"color" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "directus_folders" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"parent" uuid
);
--> statement-breakpoint
CREATE TABLE "directus_extensions" (
	"enabled" boolean DEFAULT true NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"folder" varchar(255) NOT NULL,
	"source" varchar(255) NOT NULL,
	"bundle" uuid
);
--> statement-breakpoint
CREATE TABLE "directus_fields" (
	"id" serial PRIMARY KEY NOT NULL,
	"collection" varchar(64) NOT NULL,
	"field" varchar(64) NOT NULL,
	"special" varchar(64),
	"interface" varchar(64),
	"options" json,
	"display" varchar(64),
	"display_options" json,
	"readonly" boolean DEFAULT false NOT NULL,
	"hidden" boolean DEFAULT false NOT NULL,
	"sort" integer,
	"width" varchar(30) DEFAULT 'full',
	"translations" json,
	"note" text,
	"conditions" json,
	"required" boolean DEFAULT false,
	"group" varchar(64),
	"validation" json,
	"validation_message" text,
	"searchable" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coupons" (
	"id" serial PRIMARY KEY NOT NULL,
	"coupon_code" varchar(255),
	"discount_type" varchar(255) DEFAULT 'fixed',
	"usage_limit" integer,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true,
	"valid_from" timestamp,
	"valid_until" timestamp,
	"discount_value" real,
	"date_created" timestamp,
	CONSTRAINT "coupons_coupon_code_unique" UNIQUE("coupon_code")
);
--> statement-breakpoint
CREATE TABLE "directus_activity" (
	"id" serial PRIMARY KEY NOT NULL,
	"action" varchar(45) NOT NULL,
	"user" uuid,
	"timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"ip" varchar(50),
	"user_agent" text,
	"collection" varchar(64) NOT NULL,
	"item" varchar(255) NOT NULL,
	"origin" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "directus_migrations" (
	"version" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "directus_files" (
	"id" uuid PRIMARY KEY NOT NULL,
	"storage" varchar(255) NOT NULL,
	"filename_disk" varchar(255),
	"filename_download" varchar(255) NOT NULL,
	"title" varchar(255),
	"type" varchar(255),
	"folder" uuid,
	"uploaded_by" uuid,
	"created_on" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"modified_by" uuid,
	"modified_on" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"charset" varchar(50),
	"filesize" bigint,
	"width" integer,
	"height" integer,
	"duration" integer,
	"embed" varchar(200),
	"description" text,
	"location" text,
	"tags" text,
	"metadata" json,
	"focal_point_x" integer,
	"focal_point_y" integer,
	"tus_id" varchar(64),
	"tus_data" json,
	"uploaded_on" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "directus_collections" (
	"collection" varchar(64) PRIMARY KEY NOT NULL,
	"icon" varchar(64),
	"note" text,
	"display_template" varchar(255),
	"hidden" boolean DEFAULT false NOT NULL,
	"singleton" boolean DEFAULT false NOT NULL,
	"translations" json,
	"archive_field" varchar(64),
	"archive_app_filter" boolean DEFAULT true NOT NULL,
	"archive_value" varchar(255),
	"unarchive_value" varchar(255),
	"sort_field" varchar(64),
	"accountability" varchar(255) DEFAULT 'all',
	"color" varchar(255),
	"item_duplication_fields" json,
	"sort" integer,
	"group" varchar(64),
	"collapse" varchar(255) DEFAULT 'open' NOT NULL,
	"preview_url" varchar(255),
	"versioning" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "directus_flows" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"icon" varchar(64),
	"color" varchar(255),
	"description" text,
	"status" varchar(255) DEFAULT 'active' NOT NULL,
	"trigger" varchar(255),
	"accountability" varchar(255) DEFAULT 'all',
	"options" json,
	"operation" uuid,
	"date_created" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"user_created" uuid,
	CONSTRAINT "directus_flows_operation_unique" UNIQUE("operation")
);
--> statement-breakpoint
CREATE TABLE "directus_panels" (
	"id" uuid PRIMARY KEY NOT NULL,
	"dashboard" uuid NOT NULL,
	"name" varchar(255),
	"icon" varchar(64) DEFAULT NULL,
	"color" varchar(10),
	"show_header" boolean DEFAULT false NOT NULL,
	"note" text,
	"type" varchar(255) NOT NULL,
	"position_x" integer NOT NULL,
	"position_y" integer NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"options" json,
	"date_created" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"user_created" uuid
);
--> statement-breakpoint
CREATE TABLE "directus_permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"collection" varchar(64) NOT NULL,
	"action" varchar(10) NOT NULL,
	"permissions" json,
	"validation" json,
	"presets" json,
	"fields" text,
	"policy" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "directus_presets" (
	"id" serial PRIMARY KEY NOT NULL,
	"bookmark" varchar(255),
	"user" uuid,
	"role" uuid,
	"collection" varchar(64),
	"search" varchar(100),
	"layout" varchar(100) DEFAULT 'tabular',
	"layout_query" json,
	"layout_options" json,
	"refresh_interval" integer,
	"filter" json,
	"icon" varchar(64) DEFAULT 'bookmark',
	"color" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "directus_roles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"icon" varchar(64) DEFAULT 'supervised_user_circle' NOT NULL,
	"description" text,
	"parent" uuid
);
--> statement-breakpoint
CREATE TABLE "directus_revisions" (
	"id" serial PRIMARY KEY NOT NULL,
	"activity" integer NOT NULL,
	"collection" varchar(64) NOT NULL,
	"item" varchar(255) NOT NULL,
	"data" json,
	"delta" json,
	"parent" integer,
	"version" uuid
);
--> statement-breakpoint
CREATE TABLE "directus_relations" (
	"id" serial PRIMARY KEY NOT NULL,
	"many_collection" varchar(64) NOT NULL,
	"many_field" varchar(64) NOT NULL,
	"one_collection" varchar(64),
	"one_field" varchar(64),
	"one_collection_field" varchar(64),
	"one_allowed_collections" text,
	"junction_field" varchar(64),
	"sort_field" varchar(64),
	"one_deselect_action" varchar(255) DEFAULT 'nullify' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "directus_shares" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"collection" varchar(64) NOT NULL,
	"item" varchar(255) NOT NULL,
	"role" uuid,
	"password" varchar(255),
	"user_created" uuid,
	"date_created" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"date_start" timestamp with time zone,
	"date_end" timestamp with time zone,
	"times_used" integer DEFAULT 0,
	"max_uses" integer
);
--> statement-breakpoint
CREATE TABLE "directus_notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"status" varchar(255) DEFAULT 'inbox',
	"recipient" uuid NOT NULL,
	"sender" uuid,
	"subject" varchar(255) NOT NULL,
	"message" text,
	"collection" varchar(64),
	"item" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "directus_policies" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"icon" varchar(64) DEFAULT 'badge' NOT NULL,
	"description" text,
	"ip_access" text,
	"enforce_tfa" boolean DEFAULT false NOT NULL,
	"admin_access" boolean DEFAULT false NOT NULL,
	"app_access" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "directus_operations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"key" varchar(255) NOT NULL,
	"type" varchar(255) NOT NULL,
	"position_x" integer NOT NULL,
	"position_y" integer NOT NULL,
	"options" json,
	"resolve" uuid,
	"reject" uuid,
	"flow" uuid NOT NULL,
	"date_created" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"user_created" uuid,
	CONSTRAINT "directus_operations_resolve_unique" UNIQUE("resolve"),
	CONSTRAINT "directus_operations_reject_unique" UNIQUE("reject")
);
--> statement-breakpoint
CREATE TABLE "directus_translations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"language" varchar(255) NOT NULL,
	"key" varchar(255) NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "directus_versions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"key" varchar(64) NOT NULL,
	"name" varchar(255),
	"collection" varchar(64) NOT NULL,
	"item" varchar(255) NOT NULL,
	"hash" varchar(255),
	"date_created" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"date_updated" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"user_created" uuid,
	"user_updated" uuid,
	"delta" json
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(100),
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"file" uuid
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"event_date" date NOT NULL,
	"description" text,
	"description_logged_in" text,
	"price_members" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"price_non_members" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"max_sign_ups" integer,
	"only_members" boolean DEFAULT false NOT NULL,
	"one_sign_up_max" boolean DEFAULT false NOT NULL,
	"committee_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"image" uuid,
	"contact" varchar(255),
	"event_time" time,
	"location" varchar(255) DEFAULT 'Rachelsmolen',
	"event_time_end" time,
	"registration_deadline" date,
	"status" varchar(255),
	"publish_date" timestamp,
	"event_date_end" date,
	"custom_url" text,
	"short_description" text
);
--> statement-breakpoint
CREATE TABLE "event_signups" (
	"event_id" integer NOT NULL,
	"submission_file_url" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"qr_token" varchar(255),
	"checked_in" boolean DEFAULT false,
	"checked_in_at" timestamp,
	"participant_name" text,
	"participant_email" text,
	"participant_phone" text,
	"payment_status" varchar(255) DEFAULT 'open',
	"directus_relations" uuid,
	"is_member" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "events_directus_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"events_id" integer,
	"directus_users_id" uuid
);
--> statement-breakpoint
CREATE TABLE "hero_banners_files" (
	"id" serial PRIMARY KEY NOT NULL,
	"hero_banners_id" integer,
	"directus_files_id" uuid
);
--> statement-breakpoint
CREATE TABLE "intro_blog_likes" (
	"id" serial PRIMARY KEY NOT NULL,
	"blog" integer NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"ip_address" "inet",
	"user_agent" text,
	CONSTRAINT "uniq_blog_user" UNIQUE("blog","user_id")
);
--> statement-breakpoint
CREATE TABLE "intro_blogs" (
	"id" serial PRIMARY KEY NOT NULL,
	"status" varchar(255) DEFAULT 'draft',
	"sort" integer,
	"user_created" uuid,
	"user_updated" uuid,
	"title" varchar(255) NOT NULL,
	"slug" varchar(255),
	"content" text NOT NULL,
	"excerpt" varchar(500),
	"image" uuid,
	"is_published" boolean DEFAULT false,
	"blog_type" varchar(50) DEFAULT 'update',
	"meta_title" varchar(255),
	"meta_description" varchar(500),
	"views_count" integer DEFAULT 0,
	"created_at" timestamp,
	"updated_at" timestamp,
	"likes" varchar(255) DEFAULT '0',
	"date_updated" timestamp,
	CONSTRAINT "intro_blogs_slug_key" UNIQUE("slug"),
	CONSTRAINT "intro_blogs_blog_type_check" CHECK ((blog_type)::text = ANY (ARRAY[('update'::character varying)::text, ('pictures'::character varying)::text, ('event'::character varying)::text, ('announcement'::character varying)::text]))
);
--> statement-breakpoint
CREATE TABLE "events_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"events_id" integer
);
--> statement-breakpoint
CREATE TABLE "hero_banners" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_created" uuid,
	"date_created" timestamp with time zone,
	"image" uuid,
	"sort" integer,
	"title" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "intro_blog_gallery" (
	"id" serial PRIMARY KEY NOT NULL,
	"intro_blog_id" integer NOT NULL,
	"directus_files_id" uuid NOT NULL,
	"sort" integer DEFAULT 0,
	"caption" varchar(500),
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "intro_blog_gallery_intro_blog_id_directus_files_id_key" UNIQUE("intro_blog_id","directus_files_id")
);
--> statement-breakpoint
CREATE TABLE "pub_crawl_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"image" uuid,
	"date" timestamp,
	"description" text,
	"whatsapp_community_url" varchar(255),
	"groups" jsonb DEFAULT '[]'::jsonb,
	CONSTRAINT "pub_crawl_events_email_key" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "membership_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"previous_status" varchar(255),
	"new_status" varchar(255),
	"changed_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"job_id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"pay" numeric(10, 2),
	"location" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"skills" text,
	"profile_description" text
);
--> statement-breakpoint
CREATE TABLE "pub_crawl_signups_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"pub_crawl_signups_id" integer,
	"transactions_id" integer
);
--> statement-breakpoint
CREATE TABLE "push_notification" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone,
	"endpoint" varchar(255),
	"user_id" uuid,
	"keys" json,
	"user_agent" varchar(255),
	"last_used" timestamp
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "permissions_name_key" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "intro_signups" (
	"id" serial PRIMARY KEY NOT NULL,
	"first_name" varchar(255),
	"middle_name" varchar(255),
	"last_name" varchar(255),
	"date_of_birth" varchar(255),
	"email" varchar(255),
	"phone_number" varchar(255),
	"favorite_gif" varchar(255),
	"created_at" timestamp,
	"status" varchar(255) DEFAULT 'registered',
	"approved" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "pub_crawl_signups" (
	"id" serial PRIMARY KEY NOT NULL,
	"association" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"pub_crawl_event_id" integer,
	"email" varchar(255),
	"name" varchar(50),
	"amount_tickets" integer,
	"payment_status" varchar(255),
	"name_initials" text,
	"directus_relations" uuid,
	"is_member" boolean DEFAULT false,
	"group_name" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "intro_planning" (
	"id" serial PRIMARY KEY NOT NULL,
	"status" varchar(255) DEFAULT 'published',
	"sort" integer,
	"user_created" uuid,
	"date_created" timestamp DEFAULT CURRENT_TIMESTAMP,
	"user_updated" uuid,
	"date_updated" timestamp DEFAULT CURRENT_TIMESTAMP,
	"day" varchar(50) NOT NULL,
	"date" date NOT NULL,
	"time_start" time NOT NULL,
	"time_end" time,
	"title" varchar(255) NOT NULL,
	"description" text,
	"location" varchar(255),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"color" varchar(7),
	"capacity" integer,
	"signup_required" boolean DEFAULT false,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"icon" varchar(255) DEFAULT 'Calendar Today',
	"is_mandatory" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "pub_crawl_tickets" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"signup_id" integer,
	"name" varchar(255),
	"initial" varchar(1),
	"qr_token" varchar(255),
	"checked_in" boolean DEFAULT false,
	"checked_in_at" timestamp,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "pub_crawl_tickets_qr_token_unique" UNIQUE("qr_token")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "roles_name_key" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "intro_parent_signups" (
	"id" serial PRIMARY KEY NOT NULL,
	"status" varchar(255) DEFAULT 'submitted',
	"user_created" uuid,
	"user_updated" uuid,
	"user_id" uuid NOT NULL,
	"first_name" varchar(255) NOT NULL,
	"last_name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone_number" varchar(50) NOT NULL,
	"motivation" text NOT NULL,
	"previous_experience" text,
	"availability" jsonb NOT NULL,
	"approved" boolean DEFAULT false,
	"approved_by" uuid,
	"approved_at" timestamp,
	"notes" text,
	"created_at" timestamp,
	"updated_at" timestamp with time zone,
	"date_updated" timestamp with time zone,
	CONSTRAINT "intro_parent_signups_user_id_key" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "whatsapp_groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"invite_link" varchar(500) NOT NULL,
	"is_active" boolean DEFAULT true,
	"requires_membership" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "uq_whatsapp_groups_invite_link" UNIQUE("invite_link")
);
--> statement-breakpoint
CREATE TABLE "trips" (
	"id" serial PRIMARY KEY NOT NULL,
	"status" varchar(255),
	"name" varchar(255),
	"description" text,
	"image" uuid,
	"registration_open" boolean DEFAULT false,
	"max_participants" integer,
	"base_price" numeric(10, 5),
	"crew_discount" numeric(10, 5),
	"deposit_amount" numeric(10, 5),
	"is_bus_trip" boolean DEFAULT true,
	"created_at" date,
	"updated_at" date,
	"start_date" date,
	"end_date" date,
	"registration_start_date" timestamp with time zone,
	"max_crew" integer,
	"allow_final_payments" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "trip_signups" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone,
	"updated_at" timestamp with time zone,
	"trip_id" integer,
	"first_name" varchar(255),
	"last_name" varchar(255),
	"email" varchar(255),
	"phone_number" varchar(255),
	"date_of_birth" date,
	"id_document" varchar(255),
	"allergies" text,
	"special_notes" text,
	"willing_to_drive" boolean,
	"role" varchar(255) DEFAULT 'participant',
	"status" varchar(255) DEFAULT 'registered',
	"deposit_paid" boolean DEFAULT false,
	"deposit_paid_at" timestamp,
	"full_payment_paid" boolean DEFAULT false,
	"full_payment_paid_at" timestamp,
	"terms_accepted" boolean DEFAULT false,
	"deposit_email_sent" boolean DEFAULT false,
	"final_email_sent" boolean DEFAULT false,
	"document_number" text,
	"directus_relations" uuid,
	"access_token" varchar(255),
	"document_expiry_date" date,
	"extra_luggage" boolean
);
--> statement-breakpoint
CREATE TABLE "trip_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone,
	"updated_at" timestamp with time zone,
	"trip_id" integer,
	"name" varchar(255),
	"description" text,
	"price" numeric(10, 5),
	"image" uuid,
	"max_participants" integer,
	"is_active" boolean,
	"display_order" integer,
	"options" json DEFAULT '[]'::json,
	"max_selections" integer
);
--> statement-breakpoint
CREATE TABLE "trip_signup_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone,
	"trip_signup_id" integer,
	"trip_activity_id" integer,
	"selected_options" json
);
--> statement-breakpoint
CREATE TABLE "safe_havens" (
	"id" serial PRIMARY KEY NOT NULL,
	"contact_name" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone,
	"phone_number" varchar(20),
	"image" uuid,
	"user_id" uuid,
	"email" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "sponsors" (
	"sponsor_id" serial PRIMARY KEY NOT NULL,
	"website_url" varchar(255),
	"image" uuid,
	"dark_bg" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "system_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" varchar(255) NOT NULL,
	"status" varchar(50) NOT NULL,
	"payload" jsonb,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"acknowledged_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "clubs" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"whatsapp_link" varchar(255),
	"discord_link" varchar(255),
	"website_link" varchar(255),
	"description" text,
	"image" uuid,
	CONSTRAINT "clubs_name_key" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "directus_sessions" (
	"token" varchar(64) PRIMARY KEY NOT NULL,
	"user" uuid,
	"expires" timestamp with time zone NOT NULL,
	"ip" varchar(255),
	"user_agent" text,
	"share" uuid,
	"origin" varchar(255),
	"next_token" varchar(64)
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"role_id" integer NOT NULL,
	"permission_id" integer NOT NULL,
	CONSTRAINT "role_permissions_role_id_permission_id_key" UNIQUE("role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "auth_accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"userId" uuid NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"idToken" text,
	"accessTokenExpiresAt" timestamp,
	"refreshTokenExpiresAt" timestamp,
	"scope" text,
	"password" text,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"token" text NOT NULL,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"userId" uuid NOT NULL,
	CONSTRAINT "auth_sessions_token_key" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp,
	"updatedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "committee_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"committee_id" integer NOT NULL,
	"user_id" uuid,
	"is_visible" boolean DEFAULT true NOT NULL,
	"is_leader" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feature_flags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"route_match" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"message" text
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"transaction_id" varchar(255),
	"product_name" varchar(255),
	"email" varchar(255),
	"amount" real,
	"payment_status" varchar(255) DEFAULT 'open',
	"registration" integer,
	"environment" varchar(255),
	"approval_status" varchar(255) DEFAULT 'auto_approved',
	"approved_by" uuid,
	"approved_at" timestamp,
	"first_name" varchar(255),
	"last_name" varchar(255),
	"pub_crawl_signup" integer,
	"trip_signup" integer,
	"coupon_code" varchar(255),
	"product_type" varchar(255) NOT NULL,
	"mollie_id" varchar(255) NOT NULL,
	"access_token" uuid
);
--> statement-breakpoint
CREATE TABLE "intro_planning_signups" (
	"id" serial PRIMARY KEY NOT NULL,
	"intro_planning_id" integer NOT NULL,
	"intro_signup_id" integer,
	"user_id" uuid,
	"status" varchar(50) DEFAULT 'registered',
	"attended" boolean DEFAULT false,
	"attended_at" timestamp,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"date_updated" timestamp with time zone,
	CONSTRAINT "intro_planning_signups_intro_planning_id_intro_signup_id_key" UNIQUE("intro_planning_id","intro_signup_id"),
	CONSTRAINT "intro_planning_signups_intro_planning_id_user_id_key" UNIQUE("intro_planning_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "directus_users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"first_name" varchar(50),
	"last_name" varchar(50),
	"email" varchar(128),
	"password" varchar(255),
	"location" varchar(255),
	"title" varchar(50),
	"description" text,
	"tags" json,
	"avatar" uuid,
	"language" varchar(255) DEFAULT NULL,
	"tfa_secret" varchar(255),
	"status" varchar(16) DEFAULT 'active' NOT NULL,
	"role" uuid,
	"token" varchar(255),
	"last_access" timestamp with time zone,
	"last_page" varchar(255),
	"provider" varchar(128) DEFAULT 'default' NOT NULL,
	"external_identifier" varchar(255),
	"auth_data" json,
	"email_notifications" boolean DEFAULT true,
	"appearance" varchar(255),
	"theme_dark" varchar(255),
	"theme_light" varchar(255),
	"theme_light_overrides" json,
	"theme_dark_overrides" json,
	"text_direction" varchar(255) DEFAULT 'auto' NOT NULL,
	"entra_id" varchar(255),
	"fontys_email" varchar(255),
	"phone_number" varchar(255),
	"membership_status" varchar(20) DEFAULT 'none',
	"membership_expiry" date,
	"minecraft_username" varchar(100),
	"photo_etag" varchar(255),
	"date_of_birth" date,
	"admin_access" boolean,
	"originele_betaaldatum" date,
	"emailverified" boolean DEFAULT false,
	"image" text,
	"name" text,
	"createdat" timestamp with time zone DEFAULT now(),
	"updatedat" timestamp with time zone DEFAULT now(),
	CONSTRAINT "directus_users_email_unique" UNIQUE("email"),
	CONSTRAINT "directus_users_token_unique" UNIQUE("token"),
	CONSTRAINT "directus_users_external_identifier_unique" UNIQUE("external_identifier")
);
--> statement-breakpoint
CREATE TABLE "directus_deployments" (
	"id" uuid PRIMARY KEY NOT NULL,
	"provider" varchar(255) NOT NULL,
	"credentials" text,
	"options" text,
	"date_created" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"user_created" uuid,
	"webhook_ids" json,
	"webhook_secret" varchar(255),
	"last_synced_at" timestamp with time zone,
	CONSTRAINT "directus_deployments_provider_unique" UNIQUE("provider")
);
--> statement-breakpoint
CREATE TABLE "directus_deployment_projects" (
	"id" uuid PRIMARY KEY NOT NULL,
	"deployment" uuid NOT NULL,
	"external_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"date_created" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"user_created" uuid,
	"url" varchar(255),
	"framework" varchar(255),
	"deployable" boolean DEFAULT true NOT NULL,
	CONSTRAINT "directus_deployment_projects_deployment_external_id_unique" UNIQUE("deployment","external_id")
);
--> statement-breakpoint
CREATE TABLE "directus_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_name" varchar(100) DEFAULT 'Directus' NOT NULL,
	"project_url" varchar(255),
	"project_color" varchar(255) DEFAULT '#6644FF' NOT NULL,
	"project_logo" uuid,
	"public_foreground" uuid,
	"public_background" uuid,
	"public_note" text,
	"auth_login_attempts" integer DEFAULT 25,
	"auth_password_policy" varchar(100),
	"storage_asset_transform" varchar(7) DEFAULT 'all',
	"storage_asset_presets" json,
	"custom_css" text,
	"storage_default_folder" uuid,
	"basemaps" json,
	"mapbox_key" varchar(255),
	"module_bar" json,
	"project_descriptor" varchar(100),
	"default_language" varchar(255) DEFAULT 'en-US' NOT NULL,
	"custom_aspect_ratios" json,
	"public_favicon" uuid,
	"default_appearance" varchar(255) DEFAULT 'auto' NOT NULL,
	"default_theme_light" varchar(255),
	"theme_light_overrides" json,
	"default_theme_dark" varchar(255),
	"theme_dark_overrides" json,
	"report_error_url" varchar(255),
	"report_bug_url" varchar(255),
	"report_feature_url" varchar(255),
	"public_registration" boolean DEFAULT false NOT NULL,
	"public_registration_verify_email" boolean DEFAULT true NOT NULL,
	"public_registration_role" uuid,
	"public_registration_email_filter" json,
	"visual_editor_urls" json,
	"project_id" uuid,
	"mcp_enabled" boolean DEFAULT false NOT NULL,
	"mcp_allow_deletes" boolean DEFAULT false NOT NULL,
	"mcp_prompts_collection" varchar(255) DEFAULT NULL,
	"mcp_system_prompt_enabled" boolean DEFAULT true NOT NULL,
	"mcp_system_prompt" text,
	"project_owner" varchar(255),
	"project_usage" varchar(255),
	"org_name" varchar(255),
	"product_updates" boolean,
	"project_status" varchar(255),
	"ai_openai_api_key" text,
	"ai_anthropic_api_key" text,
	"ai_system_prompt" text,
	"ai_google_api_key" text,
	"ai_openai_compatible_api_key" text,
	"ai_openai_compatible_base_url" text,
	"ai_openai_compatible_name" text,
	"ai_openai_compatible_models" json,
	"ai_openai_compatible_headers" json,
	"ai_openai_allowed_models" json,
	"ai_anthropic_allowed_models" json,
	"ai_google_allowed_models" json,
	"collaborative_editing_enabled" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "directus_deployment_runs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"project" uuid NOT NULL,
	"external_id" varchar(255) NOT NULL,
	"target" varchar(255) NOT NULL,
	"date_created" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"user_created" uuid,
	"status" varchar(255),
	"url" varchar(255),
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "club_members" ADD CONSTRAINT "club_members_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Stickers" ADD CONSTRAINT "stickers_image_foreign" FOREIGN KEY ("image") REFERENCES "public"."directus_files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Stickers" ADD CONSTRAINT "stickers_user_created_foreign" FOREIGN KEY ("user_created") REFERENCES "public"."directus_users"("id") ON DELETE set default ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Stickers" ADD CONSTRAINT "stickers_user_updated_foreign" FOREIGN KEY ("user_updated") REFERENCES "public"."directus_users"("id") ON DELETE set default ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Board" ADD CONSTRAINT "board_image_foreign" FOREIGN KEY ("image") REFERENCES "public"."directus_files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Board" ADD CONSTRAINT "board_user_created_foreign" FOREIGN KEY ("user_created") REFERENCES "public"."directus_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Board" ADD CONSTRAINT "board_user_updated_foreign" FOREIGN KEY ("user_updated") REFERENCES "public"."directus_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Board_Members" ADD CONSTRAINT "board_members_board_id_foreign" FOREIGN KEY ("board_id") REFERENCES "public"."Board"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Board_Members" ADD CONSTRAINT "board_members_user_id_foreign" FOREIGN KEY ("user_id") REFERENCES "public"."directus_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_image_foreign" FOREIGN KEY ("image") REFERENCES "public"."directus_files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_access" ADD CONSTRAINT "directus_access_policy_foreign" FOREIGN KEY ("policy") REFERENCES "public"."directus_policies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_access" ADD CONSTRAINT "directus_access_role_foreign" FOREIGN KEY ("role") REFERENCES "public"."directus_roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_access" ADD CONSTRAINT "directus_access_user_foreign" FOREIGN KEY ("user") REFERENCES "public"."directus_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "committees" ADD CONSTRAINT "committees_image_foreign" FOREIGN KEY ("image") REFERENCES "public"."directus_files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_comments" ADD CONSTRAINT "directus_comments_user_created_foreign" FOREIGN KEY ("user_created") REFERENCES "public"."directus_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_comments" ADD CONSTRAINT "directus_comments_user_updated_foreign" FOREIGN KEY ("user_updated") REFERENCES "public"."directus_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_dashboards" ADD CONSTRAINT "directus_dashboards_user_created_foreign" FOREIGN KEY ("user_created") REFERENCES "public"."directus_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_folders" ADD CONSTRAINT "directus_folders_parent_foreign" FOREIGN KEY ("parent") REFERENCES "public"."directus_folders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_files" ADD CONSTRAINT "directus_files_folder_foreign" FOREIGN KEY ("folder") REFERENCES "public"."directus_folders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_files" ADD CONSTRAINT "directus_files_modified_by_foreign" FOREIGN KEY ("modified_by") REFERENCES "public"."directus_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_files" ADD CONSTRAINT "directus_files_uploaded_by_foreign" FOREIGN KEY ("uploaded_by") REFERENCES "public"."directus_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_collections" ADD CONSTRAINT "directus_collections_group_foreign" FOREIGN KEY ("group") REFERENCES "public"."directus_collections"("collection") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_flows" ADD CONSTRAINT "directus_flows_user_created_foreign" FOREIGN KEY ("user_created") REFERENCES "public"."directus_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_panels" ADD CONSTRAINT "directus_panels_dashboard_foreign" FOREIGN KEY ("dashboard") REFERENCES "public"."directus_dashboards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_panels" ADD CONSTRAINT "directus_panels_user_created_foreign" FOREIGN KEY ("user_created") REFERENCES "public"."directus_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_permissions" ADD CONSTRAINT "directus_permissions_policy_foreign" FOREIGN KEY ("policy") REFERENCES "public"."directus_policies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_presets" ADD CONSTRAINT "directus_presets_role_foreign" FOREIGN KEY ("role") REFERENCES "public"."directus_roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_presets" ADD CONSTRAINT "directus_presets_user_foreign" FOREIGN KEY ("user") REFERENCES "public"."directus_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_roles" ADD CONSTRAINT "directus_roles_parent_foreign" FOREIGN KEY ("parent") REFERENCES "public"."directus_roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_revisions" ADD CONSTRAINT "directus_revisions_activity_foreign" FOREIGN KEY ("activity") REFERENCES "public"."directus_activity"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_revisions" ADD CONSTRAINT "directus_revisions_parent_foreign" FOREIGN KEY ("parent") REFERENCES "public"."directus_revisions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_revisions" ADD CONSTRAINT "directus_revisions_version_foreign" FOREIGN KEY ("version") REFERENCES "public"."directus_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_shares" ADD CONSTRAINT "directus_shares_collection_foreign" FOREIGN KEY ("collection") REFERENCES "public"."directus_collections"("collection") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_shares" ADD CONSTRAINT "directus_shares_role_foreign" FOREIGN KEY ("role") REFERENCES "public"."directus_roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_shares" ADD CONSTRAINT "directus_shares_user_created_foreign" FOREIGN KEY ("user_created") REFERENCES "public"."directus_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_notifications" ADD CONSTRAINT "directus_notifications_recipient_foreign" FOREIGN KEY ("recipient") REFERENCES "public"."directus_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_notifications" ADD CONSTRAINT "directus_notifications_sender_foreign" FOREIGN KEY ("sender") REFERENCES "public"."directus_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_operations" ADD CONSTRAINT "directus_operations_flow_foreign" FOREIGN KEY ("flow") REFERENCES "public"."directus_flows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_operations" ADD CONSTRAINT "directus_operations_reject_foreign" FOREIGN KEY ("reject") REFERENCES "public"."directus_operations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_operations" ADD CONSTRAINT "directus_operations_resolve_foreign" FOREIGN KEY ("resolve") REFERENCES "public"."directus_operations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_operations" ADD CONSTRAINT "directus_operations_user_created_foreign" FOREIGN KEY ("user_created") REFERENCES "public"."directus_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_versions" ADD CONSTRAINT "directus_versions_collection_foreign" FOREIGN KEY ("collection") REFERENCES "public"."directus_collections"("collection") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_versions" ADD CONSTRAINT "directus_versions_user_created_foreign" FOREIGN KEY ("user_created") REFERENCES "public"."directus_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_versions" ADD CONSTRAINT "directus_versions_user_updated_foreign" FOREIGN KEY ("user_updated") REFERENCES "public"."directus_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_file_foreign" FOREIGN KEY ("file") REFERENCES "public"."directus_files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_committee_id_fkey" FOREIGN KEY ("committee_id") REFERENCES "public"."committees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_image_foreign" FOREIGN KEY ("image") REFERENCES "public"."directus_files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_signups" ADD CONSTRAINT "event_signups_directus_relations_foreign" FOREIGN KEY ("directus_relations") REFERENCES "public"."directus_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_signups" ADD CONSTRAINT "event_signups_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events_directus_users" ADD CONSTRAINT "events_directus_users_directus_users_id_foreign" FOREIGN KEY ("directus_users_id") REFERENCES "public"."directus_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events_directus_users" ADD CONSTRAINT "events_directus_users_events_id_foreign" FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intro_blog_likes" ADD CONSTRAINT "intro_blog_likes_blog_fkey" FOREIGN KEY ("blog") REFERENCES "public"."intro_blogs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intro_blog_likes" ADD CONSTRAINT "intro_blog_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."directus_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intro_blogs" ADD CONSTRAINT "intro_blogs_image_fkey" FOREIGN KEY ("image") REFERENCES "public"."directus_files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intro_blogs" ADD CONSTRAINT "intro_blogs_user_created_fkey" FOREIGN KEY ("user_created") REFERENCES "public"."directus_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intro_blogs" ADD CONSTRAINT "intro_blogs_user_updated_fkey" FOREIGN KEY ("user_updated") REFERENCES "public"."directus_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events_members" ADD CONSTRAINT "events_members_events_id_foreign" FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hero_banners" ADD CONSTRAINT "hero_banners_image_foreign" FOREIGN KEY ("image") REFERENCES "public"."directus_files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hero_banners" ADD CONSTRAINT "hero_banners_user_created_foreign" FOREIGN KEY ("user_created") REFERENCES "public"."directus_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intro_blog_gallery" ADD CONSTRAINT "intro_blog_gallery_directus_files_id_fkey" FOREIGN KEY ("directus_files_id") REFERENCES "public"."directus_files"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intro_blog_gallery" ADD CONSTRAINT "intro_blog_gallery_intro_blog_id_fkey" FOREIGN KEY ("intro_blog_id") REFERENCES "public"."intro_blogs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pub_crawl_events" ADD CONSTRAINT "pub_crawl_events_image_foreign" FOREIGN KEY ("image") REFERENCES "public"."directus_files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_history" ADD CONSTRAINT "membership_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."directus_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pub_crawl_signups_transactions" ADD CONSTRAINT "pub_crawl_signups_transactions_pub_crawl_signups_id_foreign" FOREIGN KEY ("pub_crawl_signups_id") REFERENCES "public"."pub_crawl_signups"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pub_crawl_signups_transactions" ADD CONSTRAINT "pub_crawl_signups_transactions_transactions_id_foreign" FOREIGN KEY ("transactions_id") REFERENCES "public"."transactions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_notification" ADD CONSTRAINT "push_notification_user_id_foreign" FOREIGN KEY ("user_id") REFERENCES "public"."directus_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pub_crawl_signups" ADD CONSTRAINT "pub_crawl_signups_directus_relations_foreign" FOREIGN KEY ("directus_relations") REFERENCES "public"."directus_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pub_crawl_signups" ADD CONSTRAINT "pub_crawl_signups_pub_crawl_event_id_foreign" FOREIGN KEY ("pub_crawl_event_id") REFERENCES "public"."pub_crawl_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intro_planning" ADD CONSTRAINT "intro_planning_user_created_fkey" FOREIGN KEY ("user_created") REFERENCES "public"."directus_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intro_planning" ADD CONSTRAINT "intro_planning_user_updated_fkey" FOREIGN KEY ("user_updated") REFERENCES "public"."directus_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pub_crawl_tickets" ADD CONSTRAINT "pub_crawl_tickets_signup_id_foreign" FOREIGN KEY ("signup_id") REFERENCES "public"."pub_crawl_signups"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intro_parent_signups" ADD CONSTRAINT "intro_parent_signups_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."directus_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intro_parent_signups" ADD CONSTRAINT "intro_parent_signups_user_created_fkey" FOREIGN KEY ("user_created") REFERENCES "public"."directus_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intro_parent_signups" ADD CONSTRAINT "intro_parent_signups_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."directus_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intro_parent_signups" ADD CONSTRAINT "intro_parent_signups_user_updated_fkey" FOREIGN KEY ("user_updated") REFERENCES "public"."directus_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_image_foreign" FOREIGN KEY ("image") REFERENCES "public"."directus_files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_signups" ADD CONSTRAINT "trip_signups_directus_relations_fkey" FOREIGN KEY ("directus_relations") REFERENCES "public"."directus_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_signups" ADD CONSTRAINT "trip_signups_trip_id_foreign" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_activities" ADD CONSTRAINT "trip_activities_image_foreign" FOREIGN KEY ("image") REFERENCES "public"."directus_files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_activities" ADD CONSTRAINT "trip_activities_trip_id_foreign" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_signup_activities" ADD CONSTRAINT "trip_signup_activities_trip_activity_id_foreign" FOREIGN KEY ("trip_activity_id") REFERENCES "public"."trip_activities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_signup_activities" ADD CONSTRAINT "trip_signup_activities_trip_signup_id_foreign" FOREIGN KEY ("trip_signup_id") REFERENCES "public"."trip_signups"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "safe_havens" ADD CONSTRAINT "safe_havens_image_foreign" FOREIGN KEY ("image") REFERENCES "public"."directus_files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "safe_havens" ADD CONSTRAINT "safe_havens_user_id_foreign" FOREIGN KEY ("user_id") REFERENCES "public"."directus_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sponsors" ADD CONSTRAINT "sponsors_image_foreign" FOREIGN KEY ("image") REFERENCES "public"."directus_files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clubs" ADD CONSTRAINT "clubs_image_foreign" FOREIGN KEY ("image") REFERENCES "public"."directus_files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_sessions" ADD CONSTRAINT "directus_sessions_share_foreign" FOREIGN KEY ("share") REFERENCES "public"."directus_shares"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_sessions" ADD CONSTRAINT "directus_sessions_user_foreign" FOREIGN KEY ("user") REFERENCES "public"."directus_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_accounts" ADD CONSTRAINT "auth_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."directus_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."directus_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "committee_members" ADD CONSTRAINT "committee_members_committee_id_fkey" FOREIGN KEY ("committee_id") REFERENCES "public"."committees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "committee_members" ADD CONSTRAINT "committee_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."directus_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "fk_transactions_user" FOREIGN KEY ("user_id") REFERENCES "public"."directus_users"("id") ON DELETE set default ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_approved_by_foreign" FOREIGN KEY ("approved_by") REFERENCES "public"."directus_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_pub_crawl_signup_foreign" FOREIGN KEY ("pub_crawl_signup") REFERENCES "public"."pub_crawl_signups"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_registration_foreign" FOREIGN KEY ("registration") REFERENCES "public"."event_signups"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_trip_signup_foreign" FOREIGN KEY ("trip_signup") REFERENCES "public"."trip_signups"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intro_planning_signups" ADD CONSTRAINT "intro_planning_signups_intro_planning_id_fkey" FOREIGN KEY ("intro_planning_id") REFERENCES "public"."intro_planning"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intro_planning_signups" ADD CONSTRAINT "intro_planning_signups_intro_signup_id_fkey" FOREIGN KEY ("intro_signup_id") REFERENCES "public"."intro_signups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intro_planning_signups" ADD CONSTRAINT "intro_planning_signups_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."directus_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_users" ADD CONSTRAINT "directus_users_role_foreign" FOREIGN KEY ("role") REFERENCES "public"."directus_roles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_deployments" ADD CONSTRAINT "directus_deployments_user_created_foreign" FOREIGN KEY ("user_created") REFERENCES "public"."directus_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_deployment_projects" ADD CONSTRAINT "directus_deployment_projects_deployment_foreign" FOREIGN KEY ("deployment") REFERENCES "public"."directus_deployments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_deployment_projects" ADD CONSTRAINT "directus_deployment_projects_user_created_foreign" FOREIGN KEY ("user_created") REFERENCES "public"."directus_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_settings" ADD CONSTRAINT "directus_settings_project_logo_foreign" FOREIGN KEY ("project_logo") REFERENCES "public"."directus_files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_settings" ADD CONSTRAINT "directus_settings_public_background_foreign" FOREIGN KEY ("public_background") REFERENCES "public"."directus_files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_settings" ADD CONSTRAINT "directus_settings_public_favicon_foreign" FOREIGN KEY ("public_favicon") REFERENCES "public"."directus_files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_settings" ADD CONSTRAINT "directus_settings_public_foreground_foreign" FOREIGN KEY ("public_foreground") REFERENCES "public"."directus_files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_settings" ADD CONSTRAINT "directus_settings_public_registration_role_foreign" FOREIGN KEY ("public_registration_role") REFERENCES "public"."directus_roles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_settings" ADD CONSTRAINT "directus_settings_storage_default_folder_foreign" FOREIGN KEY ("storage_default_folder") REFERENCES "public"."directus_folders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_deployment_runs" ADD CONSTRAINT "directus_deployment_runs_project_foreign" FOREIGN KEY ("project") REFERENCES "public"."directus_deployment_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_deployment_runs" ADD CONSTRAINT "directus_deployment_runs_user_created_foreign" FOREIGN KEY ("user_created") REFERENCES "public"."directus_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_club_members_club_id" ON "club_members" USING btree ("club_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_contacts_display_order" ON "contacts" USING btree ("display_order" int4_ops,"is_active" int4_ops);--> statement-breakpoint
CREATE INDEX "directus_activity_timestamp_index" ON "directus_activity" USING btree ("timestamp" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "directus_revisions_activity_index" ON "directus_revisions" USING btree ("activity" int4_ops);--> statement-breakpoint
CREATE INDEX "directus_revisions_parent_index" ON "directus_revisions" USING btree ("parent" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_documents_active_order" ON "documents" USING btree ("is_active" int4_ops,"display_order" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_documents_category" ON "documents" USING btree ("category" text_ops);--> statement-breakpoint
CREATE INDEX "idx_events_committee" ON "events" USING btree ("committee_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_event_signups_event" ON "event_signups" USING btree ("event_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_intro_blogs_slug" ON "intro_blogs" USING btree ("slug" text_ops);--> statement-breakpoint
CREATE INDEX "idx_intro_blogs_type" ON "intro_blogs" USING btree ("blog_type" text_ops);--> statement-breakpoint
CREATE INDEX "idx_intro_blog_gallery_blog" ON "intro_blog_gallery" USING btree ("intro_blog_id" int4_ops,"sort" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_intro_planning_date" ON "intro_planning" USING btree ("date" date_ops,"sort_order" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_intro_planning_day" ON "intro_planning" USING btree ("day" text_ops);--> statement-breakpoint
CREATE INDEX "idx_intro_planning_sort" ON "intro_planning" USING btree ("sort_order" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_intro_parent_signups_approved" ON "intro_parent_signups" USING btree ("approved" bool_ops);--> statement-breakpoint
CREATE INDEX "idx_intro_parent_signups_user" ON "intro_parent_signups" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_whatsapp_groups_active" ON "whatsapp_groups" USING btree ("is_active" bool_ops);--> statement-breakpoint
CREATE INDEX "idx_whatsapp_groups_membership" ON "whatsapp_groups" USING btree ("requires_membership" bool_ops);--> statement-breakpoint
CREATE INDEX "idx_transactions_created_at" ON "transactions" USING btree ("created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_transactions_user_id" ON "transactions" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_intro_planning_signups_activity" ON "intro_planning_signups" USING btree ("intro_planning_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_intro_planning_signups_user" ON "intro_planning_signups" USING btree ("intro_signup_id" int4_ops);--> statement-breakpoint
CREATE INDEX "directus_users_admin_access_index" ON "directus_users" USING btree ("admin_access" bool_ops);--> statement-breakpoint
CREATE INDEX "idx_directus_users_entra_id" ON "directus_users" USING btree ("entra_id" text_ops);
*/