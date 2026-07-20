CREATE TABLE "webshop_drop_windows" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"status" varchar(255) DEFAULT 'draft',
	"opens_at" timestamp with time zone,
	"closes_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
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
	"status" varchar(255) DEFAULT 'awaiting_deposit',
	"subtotal_amount" numeric(10, 5) NOT NULL,
	"deposit_amount" numeric(10, 5) NOT NULL,
	"deposit_paid" boolean DEFAULT false,
	"deposit_paid_at" timestamp with time zone,
	"final_payment_paid" boolean DEFAULT false,
	"final_payment_paid_at" timestamp with time zone,
	"terms_accepted" boolean DEFAULT false,
	"pickup_notes" text,
	"access_token" varchar(255)
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
	"size" varchar(255),
	"color" varchar(255),
	"sku" varchar(255),
	"is_active" boolean DEFAULT true,
	"display_order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "webshop_products" (
	"id" serial PRIMARY KEY NOT NULL,
	"drop_window_id" integer,
	"type" varchar(255) DEFAULT 'item' NOT NULL,
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
ALTER TABLE "pub_crawl_events" DROP CONSTRAINT "pub_crawl_events_email_key";--> statement-breakpoint
ALTER TABLE "intro_blogs" DROP CONSTRAINT "intro_blogs_blog_type_check";--> statement-breakpoint
ALTER TABLE "club_members" DROP CONSTRAINT "club_members_club_id_fkey";
--> statement-breakpoint
ALTER TABLE "Stickers" DROP CONSTRAINT "stickers_image_foreign";
--> statement-breakpoint
ALTER TABLE "Stickers" DROP CONSTRAINT "stickers_user_created_foreign";
--> statement-breakpoint
ALTER TABLE "Stickers" DROP CONSTRAINT "stickers_user_updated_foreign";
--> statement-breakpoint
ALTER TABLE "Board" DROP CONSTRAINT "board_image_foreign";
--> statement-breakpoint
ALTER TABLE "Board" DROP CONSTRAINT "board_user_created_foreign";
--> statement-breakpoint
ALTER TABLE "Board" DROP CONSTRAINT "board_user_updated_foreign";
--> statement-breakpoint
ALTER TABLE "Board_Members" DROP CONSTRAINT "board_members_board_id_foreign";
--> statement-breakpoint
ALTER TABLE "Board_Members" DROP CONSTRAINT "board_members_user_id_foreign";
--> statement-breakpoint
ALTER TABLE "contacts" DROP CONSTRAINT "contacts_image_foreign";
--> statement-breakpoint
ALTER TABLE "directus_access" DROP CONSTRAINT "directus_access_policy_foreign";
--> statement-breakpoint
ALTER TABLE "directus_access" DROP CONSTRAINT "directus_access_role_foreign";
--> statement-breakpoint
ALTER TABLE "directus_access" DROP CONSTRAINT "directus_access_user_foreign";
--> statement-breakpoint
ALTER TABLE "committees" DROP CONSTRAINT "committees_image_foreign";
--> statement-breakpoint
ALTER TABLE "directus_comments" DROP CONSTRAINT "directus_comments_user_created_foreign";
--> statement-breakpoint
ALTER TABLE "directus_comments" DROP CONSTRAINT "directus_comments_user_updated_foreign";
--> statement-breakpoint
ALTER TABLE "directus_dashboards" DROP CONSTRAINT "directus_dashboards_user_created_foreign";
--> statement-breakpoint
ALTER TABLE "directus_files" DROP CONSTRAINT "directus_files_folder_foreign";
--> statement-breakpoint
ALTER TABLE "directus_files" DROP CONSTRAINT "directus_files_modified_by_foreign";
--> statement-breakpoint
ALTER TABLE "directus_files" DROP CONSTRAINT "directus_files_uploaded_by_foreign";
--> statement-breakpoint
ALTER TABLE "directus_flows" DROP CONSTRAINT "directus_flows_user_created_foreign";
--> statement-breakpoint
ALTER TABLE "directus_panels" DROP CONSTRAINT "directus_panels_dashboard_foreign";
--> statement-breakpoint
ALTER TABLE "directus_panels" DROP CONSTRAINT "directus_panels_user_created_foreign";
--> statement-breakpoint
ALTER TABLE "directus_permissions" DROP CONSTRAINT "directus_permissions_policy_foreign";
--> statement-breakpoint
ALTER TABLE "directus_presets" DROP CONSTRAINT "directus_presets_role_foreign";
--> statement-breakpoint
ALTER TABLE "directus_presets" DROP CONSTRAINT "directus_presets_user_foreign";
--> statement-breakpoint
ALTER TABLE "directus_revisions" DROP CONSTRAINT "directus_revisions_activity_foreign";
--> statement-breakpoint
ALTER TABLE "directus_revisions" DROP CONSTRAINT "directus_revisions_version_foreign";
--> statement-breakpoint
ALTER TABLE "directus_shares" DROP CONSTRAINT "directus_shares_collection_foreign";
--> statement-breakpoint
ALTER TABLE "directus_shares" DROP CONSTRAINT "directus_shares_role_foreign";
--> statement-breakpoint
ALTER TABLE "directus_shares" DROP CONSTRAINT "directus_shares_user_created_foreign";
--> statement-breakpoint
ALTER TABLE "directus_notifications" DROP CONSTRAINT "directus_notifications_recipient_foreign";
--> statement-breakpoint
ALTER TABLE "directus_notifications" DROP CONSTRAINT "directus_notifications_sender_foreign";
--> statement-breakpoint
ALTER TABLE "directus_operations" DROP CONSTRAINT "directus_operations_flow_foreign";
--> statement-breakpoint
ALTER TABLE "directus_operations" DROP CONSTRAINT "directus_operations_user_created_foreign";
--> statement-breakpoint
ALTER TABLE "directus_versions" DROP CONSTRAINT "directus_versions_collection_foreign";
--> statement-breakpoint
ALTER TABLE "directus_versions" DROP CONSTRAINT "directus_versions_user_created_foreign";
--> statement-breakpoint
ALTER TABLE "directus_versions" DROP CONSTRAINT "directus_versions_user_updated_foreign";
--> statement-breakpoint
ALTER TABLE "documents" DROP CONSTRAINT "documents_file_foreign";
--> statement-breakpoint
ALTER TABLE "events" DROP CONSTRAINT "events_committee_id_fkey";
--> statement-breakpoint
ALTER TABLE "events" DROP CONSTRAINT "events_image_foreign";
--> statement-breakpoint
ALTER TABLE "event_signups" DROP CONSTRAINT "event_signups_directus_relations_foreign";
--> statement-breakpoint
ALTER TABLE "event_signups" DROP CONSTRAINT "event_signups_event_id_fkey";
--> statement-breakpoint
ALTER TABLE "events_directus_users" DROP CONSTRAINT "events_directus_users_directus_users_id_foreign";
--> statement-breakpoint
ALTER TABLE "events_directus_users" DROP CONSTRAINT "events_directus_users_events_id_foreign";
--> statement-breakpoint
ALTER TABLE "intro_blog_likes" DROP CONSTRAINT "intro_blog_likes_blog_fkey";
--> statement-breakpoint
ALTER TABLE "intro_blog_likes" DROP CONSTRAINT "intro_blog_likes_user_id_fkey";
--> statement-breakpoint
ALTER TABLE "intro_blogs" DROP CONSTRAINT "intro_blogs_image_fkey";
--> statement-breakpoint
ALTER TABLE "intro_blogs" DROP CONSTRAINT "intro_blogs_user_created_fkey";
--> statement-breakpoint
ALTER TABLE "intro_blogs" DROP CONSTRAINT "intro_blogs_user_updated_fkey";
--> statement-breakpoint
ALTER TABLE "events_members" DROP CONSTRAINT "events_members_events_id_foreign";
--> statement-breakpoint
ALTER TABLE "hero_banners" DROP CONSTRAINT "hero_banners_image_foreign";
--> statement-breakpoint
ALTER TABLE "hero_banners" DROP CONSTRAINT "hero_banners_user_created_foreign";
--> statement-breakpoint
ALTER TABLE "intro_blog_gallery" DROP CONSTRAINT "intro_blog_gallery_directus_files_id_fkey";
--> statement-breakpoint
ALTER TABLE "intro_blog_gallery" DROP CONSTRAINT "intro_blog_gallery_intro_blog_id_fkey";
--> statement-breakpoint
ALTER TABLE "pub_crawl_events" DROP CONSTRAINT "pub_crawl_events_image_foreign";
--> statement-breakpoint
ALTER TABLE "membership_history" DROP CONSTRAINT "membership_history_user_id_fkey";
--> statement-breakpoint
ALTER TABLE "pub_crawl_signups_transactions" DROP CONSTRAINT "pub_crawl_signups_transactions_pub_crawl_signups_id_foreign";
--> statement-breakpoint
ALTER TABLE "pub_crawl_signups_transactions" DROP CONSTRAINT "pub_crawl_signups_transactions_transactions_id_foreign";
--> statement-breakpoint
ALTER TABLE "push_notification" DROP CONSTRAINT "push_notification_user_id_foreign";
--> statement-breakpoint
ALTER TABLE "pub_crawl_signups" DROP CONSTRAINT "pub_crawl_signups_directus_relations_foreign";
--> statement-breakpoint
ALTER TABLE "pub_crawl_signups" DROP CONSTRAINT "pub_crawl_signups_pub_crawl_event_id_foreign";
--> statement-breakpoint
ALTER TABLE "intro_planning" DROP CONSTRAINT "intro_planning_user_created_fkey";
--> statement-breakpoint
ALTER TABLE "intro_planning" DROP CONSTRAINT "intro_planning_user_updated_fkey";
--> statement-breakpoint
ALTER TABLE "pub_crawl_tickets" DROP CONSTRAINT "pub_crawl_tickets_signup_id_foreign";
--> statement-breakpoint
ALTER TABLE "intro_parent_signups" DROP CONSTRAINT "intro_parent_signups_approved_by_fkey";
--> statement-breakpoint
ALTER TABLE "intro_parent_signups" DROP CONSTRAINT "intro_parent_signups_user_created_fkey";
--> statement-breakpoint
ALTER TABLE "intro_parent_signups" DROP CONSTRAINT "intro_parent_signups_user_id_fkey";
--> statement-breakpoint
ALTER TABLE "intro_parent_signups" DROP CONSTRAINT "intro_parent_signups_user_updated_fkey";
--> statement-breakpoint
ALTER TABLE "trips" DROP CONSTRAINT "trips_image_foreign";
--> statement-breakpoint
ALTER TABLE "trip_signups" DROP CONSTRAINT "trip_signups_directus_relations_fkey";
--> statement-breakpoint
ALTER TABLE "trip_signups" DROP CONSTRAINT "trip_signups_trip_id_foreign";
--> statement-breakpoint
ALTER TABLE "trip_activities" DROP CONSTRAINT "trip_activities_image_foreign";
--> statement-breakpoint
ALTER TABLE "trip_activities" DROP CONSTRAINT "trip_activities_trip_id_foreign";
--> statement-breakpoint
ALTER TABLE "trip_signup_activities" DROP CONSTRAINT "trip_signup_activities_trip_activity_id_foreign";
--> statement-breakpoint
ALTER TABLE "trip_signup_activities" DROP CONSTRAINT "trip_signup_activities_trip_signup_id_foreign";
--> statement-breakpoint
ALTER TABLE "safe_havens" DROP CONSTRAINT "safe_havens_image_foreign";
--> statement-breakpoint
ALTER TABLE "safe_havens" DROP CONSTRAINT "safe_havens_user_id_foreign";
--> statement-breakpoint
ALTER TABLE "sponsors" DROP CONSTRAINT "sponsors_image_foreign";
--> statement-breakpoint
ALTER TABLE "clubs" DROP CONSTRAINT "clubs_image_foreign";
--> statement-breakpoint
ALTER TABLE "directus_sessions" DROP CONSTRAINT "directus_sessions_share_foreign";
--> statement-breakpoint
ALTER TABLE "directus_sessions" DROP CONSTRAINT "directus_sessions_user_foreign";
--> statement-breakpoint
ALTER TABLE "role_permissions" DROP CONSTRAINT "role_permissions_permission_id_fkey";
--> statement-breakpoint
ALTER TABLE "role_permissions" DROP CONSTRAINT "role_permissions_role_id_fkey";
--> statement-breakpoint
ALTER TABLE "auth_accounts" DROP CONSTRAINT "auth_accounts_userId_fkey";
--> statement-breakpoint
ALTER TABLE "auth_sessions" DROP CONSTRAINT "auth_sessions_userId_fkey";
--> statement-breakpoint
ALTER TABLE "committee_members" DROP CONSTRAINT "committee_members_committee_id_fkey";
--> statement-breakpoint
ALTER TABLE "committee_members" DROP CONSTRAINT "committee_members_user_id_fkey";
--> statement-breakpoint
ALTER TABLE "transactions" DROP CONSTRAINT "fk_transactions_user";
--> statement-breakpoint
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_approved_by_foreign";
--> statement-breakpoint
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_pub_crawl_signup_foreign";
--> statement-breakpoint
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_registration_foreign";
--> statement-breakpoint
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_trip_signup_foreign";
--> statement-breakpoint
ALTER TABLE "intro_planning_signups" DROP CONSTRAINT "intro_planning_signups_intro_planning_id_fkey";
--> statement-breakpoint
ALTER TABLE "intro_planning_signups" DROP CONSTRAINT "intro_planning_signups_intro_signup_id_fkey";
--> statement-breakpoint
ALTER TABLE "intro_planning_signups" DROP CONSTRAINT "intro_planning_signups_user_id_fkey";
--> statement-breakpoint
ALTER TABLE "directus_users" DROP CONSTRAINT "directus_users_role_foreign";
--> statement-breakpoint
ALTER TABLE "directus_deployments" DROP CONSTRAINT "directus_deployments_user_created_foreign";
--> statement-breakpoint
ALTER TABLE "directus_deployment_projects" DROP CONSTRAINT "directus_deployment_projects_deployment_foreign";
--> statement-breakpoint
ALTER TABLE "directus_deployment_projects" DROP CONSTRAINT "directus_deployment_projects_user_created_foreign";
--> statement-breakpoint
ALTER TABLE "directus_settings" DROP CONSTRAINT "directus_settings_project_logo_foreign";
--> statement-breakpoint
ALTER TABLE "directus_settings" DROP CONSTRAINT "directus_settings_public_background_foreign";
--> statement-breakpoint
ALTER TABLE "directus_settings" DROP CONSTRAINT "directus_settings_public_favicon_foreign";
--> statement-breakpoint
ALTER TABLE "directus_settings" DROP CONSTRAINT "directus_settings_public_foreground_foreign";
--> statement-breakpoint
ALTER TABLE "directus_settings" DROP CONSTRAINT "directus_settings_public_registration_role_foreign";
--> statement-breakpoint
ALTER TABLE "directus_settings" DROP CONSTRAINT "directus_settings_storage_default_folder_foreign";
--> statement-breakpoint
ALTER TABLE "directus_deployment_runs" DROP CONSTRAINT "directus_deployment_runs_project_foreign";
--> statement-breakpoint
ALTER TABLE "directus_deployment_runs" DROP CONSTRAINT "directus_deployment_runs_user_created_foreign";
--> statement-breakpoint
DROP INDEX "directus_users_admin_access_index";--> statement-breakpoint
DROP INDEX "idx_club_members_club_id";--> statement-breakpoint
DROP INDEX "idx_contacts_display_order";--> statement-breakpoint
DROP INDEX "directus_activity_timestamp_index";--> statement-breakpoint
DROP INDEX "directus_revisions_activity_index";--> statement-breakpoint
DROP INDEX "directus_revisions_parent_index";--> statement-breakpoint
DROP INDEX "idx_documents_active_order";--> statement-breakpoint
DROP INDEX "idx_documents_category";--> statement-breakpoint
DROP INDEX "idx_events_committee";--> statement-breakpoint
DROP INDEX "idx_event_signups_event";--> statement-breakpoint
DROP INDEX "idx_intro_blogs_slug";--> statement-breakpoint
DROP INDEX "idx_intro_blogs_type";--> statement-breakpoint
DROP INDEX "idx_intro_blog_gallery_blog";--> statement-breakpoint
DROP INDEX "idx_intro_planning_date";--> statement-breakpoint
DROP INDEX "idx_intro_planning_day";--> statement-breakpoint
DROP INDEX "idx_intro_planning_sort";--> statement-breakpoint
DROP INDEX "idx_intro_parent_signups_approved";--> statement-breakpoint
DROP INDEX "idx_intro_parent_signups_user";--> statement-breakpoint
DROP INDEX "idx_whatsapp_groups_active";--> statement-breakpoint
DROP INDEX "idx_whatsapp_groups_membership";--> statement-breakpoint
DROP INDEX "idx_transactions_created_at";--> statement-breakpoint
DROP INDEX "idx_transactions_user_id";--> statement-breakpoint
DROP INDEX "idx_intro_planning_signups_activity";--> statement-breakpoint
DROP INDEX "idx_intro_planning_signups_user";--> statement-breakpoint
DROP INDEX "idx_directus_users_entra_id";--> statement-breakpoint
ALTER TABLE "contacts" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "contacts" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "committees" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "directus_comments" ALTER COLUMN "date_created" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "directus_comments" ALTER COLUMN "date_updated" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "directus_dashboards" ALTER COLUMN "date_created" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "directus_activity" ALTER COLUMN "timestamp" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "directus_migrations" ALTER COLUMN "timestamp" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "directus_files" ALTER COLUMN "created_on" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "directus_files" ALTER COLUMN "modified_on" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "directus_flows" ALTER COLUMN "date_created" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "directus_panels" ALTER COLUMN "icon" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "directus_panels" ALTER COLUMN "date_created" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "directus_shares" ALTER COLUMN "date_created" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "directus_notifications" ALTER COLUMN "timestamp" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "directus_operations" ALTER COLUMN "date_created" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "directus_versions" ALTER COLUMN "date_created" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "directus_versions" ALTER COLUMN "date_updated" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "intro_blog_likes" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "intro_blog_gallery" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "membership_history" ALTER COLUMN "changed_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "intro_planning" ALTER COLUMN "date_created" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "intro_planning" ALTER COLUMN "date_updated" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "intro_planning" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "intro_planning" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "whatsapp_groups" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "whatsapp_groups" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "safe_havens" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "system_logs" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "intro_planning_signups" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "intro_planning_signups" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "directus_users" ALTER COLUMN "language" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "directus_deployments" ALTER COLUMN "date_created" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "directus_deployment_projects" ALTER COLUMN "date_created" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "directus_settings" ALTER COLUMN "mcp_prompts_collection" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "directus_deployment_runs" ALTER COLUMN "date_created" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "webshop_preorder" integer;--> statement-breakpoint
ALTER TABLE "webshop_preorder_lines" ADD CONSTRAINT "webshop_preorder_lines_preorder_id_webshop_preorders_id_fk" FOREIGN KEY ("preorder_id") REFERENCES "public"."webshop_preorders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webshop_preorder_lines" ADD CONSTRAINT "webshop_preorder_lines_product_id_webshop_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."webshop_products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webshop_preorder_lines" ADD CONSTRAINT "webshop_preorder_lines_variant_id_webshop_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."webshop_product_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webshop_preorders" ADD CONSTRAINT "webshop_preorders_user_id_directus_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."directus_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webshop_preorders" ADD CONSTRAINT "webshop_preorders_drop_window_id_webshop_drop_windows_id_fk" FOREIGN KEY ("drop_window_id") REFERENCES "public"."webshop_drop_windows"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webshop_product_media" ADD CONSTRAINT "webshop_product_media_product_id_webshop_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."webshop_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webshop_product_media" ADD CONSTRAINT "webshop_product_media_asset_directus_files_id_fk" FOREIGN KEY ("asset") REFERENCES "public"."directus_files"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webshop_product_variants" ADD CONSTRAINT "webshop_product_variants_product_id_webshop_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."webshop_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webshop_products" ADD CONSTRAINT "webshop_products_drop_window_id_webshop_drop_windows_id_fk" FOREIGN KEY ("drop_window_id") REFERENCES "public"."webshop_drop_windows"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_webshop_preorder_lines_preorder" ON "webshop_preorder_lines" USING btree ("preorder_id");--> statement-breakpoint
CREATE INDEX "idx_webshop_preorders_user" ON "webshop_preorders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_webshop_preorders_drop_window" ON "webshop_preorders" USING btree ("drop_window_id");--> statement-breakpoint
CREATE INDEX "idx_webshop_product_media_product" ON "webshop_product_media" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_webshop_product_variants_product" ON "webshop_product_variants" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_webshop_products_drop_window" ON "webshop_products" USING btree ("drop_window_id");--> statement-breakpoint
ALTER TABLE "club_members" ADD CONSTRAINT "club_members_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Stickers" ADD CONSTRAINT "Stickers_user_created_directus_users_id_fk" FOREIGN KEY ("user_created") REFERENCES "public"."directus_users"("id") ON DELETE set default ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Stickers" ADD CONSTRAINT "Stickers_user_updated_directus_users_id_fk" FOREIGN KEY ("user_updated") REFERENCES "public"."directus_users"("id") ON DELETE set default ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Stickers" ADD CONSTRAINT "Stickers_image_directus_files_id_fk" FOREIGN KEY ("image") REFERENCES "public"."directus_files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Board" ADD CONSTRAINT "Board_user_created_directus_users_id_fk" FOREIGN KEY ("user_created") REFERENCES "public"."directus_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Board" ADD CONSTRAINT "Board_user_updated_directus_users_id_fk" FOREIGN KEY ("user_updated") REFERENCES "public"."directus_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Board" ADD CONSTRAINT "Board_image_directus_files_id_fk" FOREIGN KEY ("image") REFERENCES "public"."directus_files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Board_Members" ADD CONSTRAINT "Board_Members_board_id_Board_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."Board"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Board_Members" ADD CONSTRAINT "Board_Members_user_id_directus_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."directus_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_image_directus_files_id_fk" FOREIGN KEY ("image") REFERENCES "public"."directus_files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_access" ADD CONSTRAINT "directus_access_role_directus_roles_id_fk" FOREIGN KEY ("role") REFERENCES "public"."directus_roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_access" ADD CONSTRAINT "directus_access_user_directus_users_id_fk" FOREIGN KEY ("user") REFERENCES "public"."directus_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_access" ADD CONSTRAINT "directus_access_policy_directus_policies_id_fk" FOREIGN KEY ("policy") REFERENCES "public"."directus_policies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "committees" ADD CONSTRAINT "committees_image_directus_files_id_fk" FOREIGN KEY ("image") REFERENCES "public"."directus_files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_comments" ADD CONSTRAINT "directus_comments_user_created_directus_users_id_fk" FOREIGN KEY ("user_created") REFERENCES "public"."directus_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_comments" ADD CONSTRAINT "directus_comments_user_updated_directus_users_id_fk" FOREIGN KEY ("user_updated") REFERENCES "public"."directus_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_dashboards" ADD CONSTRAINT "directus_dashboards_user_created_directus_users_id_fk" FOREIGN KEY ("user_created") REFERENCES "public"."directus_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_files" ADD CONSTRAINT "directus_files_folder_directus_folders_id_fk" FOREIGN KEY ("folder") REFERENCES "public"."directus_folders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_files" ADD CONSTRAINT "directus_files_uploaded_by_directus_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."directus_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_files" ADD CONSTRAINT "directus_files_modified_by_directus_users_id_fk" FOREIGN KEY ("modified_by") REFERENCES "public"."directus_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_flows" ADD CONSTRAINT "directus_flows_user_created_directus_users_id_fk" FOREIGN KEY ("user_created") REFERENCES "public"."directus_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_panels" ADD CONSTRAINT "directus_panels_dashboard_directus_dashboards_id_fk" FOREIGN KEY ("dashboard") REFERENCES "public"."directus_dashboards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_panels" ADD CONSTRAINT "directus_panels_user_created_directus_users_id_fk" FOREIGN KEY ("user_created") REFERENCES "public"."directus_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_permissions" ADD CONSTRAINT "directus_permissions_policy_directus_policies_id_fk" FOREIGN KEY ("policy") REFERENCES "public"."directus_policies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_presets" ADD CONSTRAINT "directus_presets_user_directus_users_id_fk" FOREIGN KEY ("user") REFERENCES "public"."directus_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_presets" ADD CONSTRAINT "directus_presets_role_directus_roles_id_fk" FOREIGN KEY ("role") REFERENCES "public"."directus_roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_revisions" ADD CONSTRAINT "directus_revisions_activity_directus_activity_id_fk" FOREIGN KEY ("activity") REFERENCES "public"."directus_activity"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_revisions" ADD CONSTRAINT "directus_revisions_version_directus_versions_id_fk" FOREIGN KEY ("version") REFERENCES "public"."directus_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_shares" ADD CONSTRAINT "directus_shares_collection_directus_collections_collection_fk" FOREIGN KEY ("collection") REFERENCES "public"."directus_collections"("collection") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_shares" ADD CONSTRAINT "directus_shares_role_directus_roles_id_fk" FOREIGN KEY ("role") REFERENCES "public"."directus_roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_shares" ADD CONSTRAINT "directus_shares_user_created_directus_users_id_fk" FOREIGN KEY ("user_created") REFERENCES "public"."directus_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_notifications" ADD CONSTRAINT "directus_notifications_recipient_directus_users_id_fk" FOREIGN KEY ("recipient") REFERENCES "public"."directus_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_notifications" ADD CONSTRAINT "directus_notifications_sender_directus_users_id_fk" FOREIGN KEY ("sender") REFERENCES "public"."directus_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_operations" ADD CONSTRAINT "directus_operations_flow_directus_flows_id_fk" FOREIGN KEY ("flow") REFERENCES "public"."directus_flows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_operations" ADD CONSTRAINT "directus_operations_user_created_directus_users_id_fk" FOREIGN KEY ("user_created") REFERENCES "public"."directus_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_versions" ADD CONSTRAINT "directus_versions_collection_directus_collections_collection_fk" FOREIGN KEY ("collection") REFERENCES "public"."directus_collections"("collection") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_versions" ADD CONSTRAINT "directus_versions_user_created_directus_users_id_fk" FOREIGN KEY ("user_created") REFERENCES "public"."directus_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_versions" ADD CONSTRAINT "directus_versions_user_updated_directus_users_id_fk" FOREIGN KEY ("user_updated") REFERENCES "public"."directus_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_file_directus_files_id_fk" FOREIGN KEY ("file") REFERENCES "public"."directus_files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_committee_id_committees_id_fk" FOREIGN KEY ("committee_id") REFERENCES "public"."committees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_image_directus_files_id_fk" FOREIGN KEY ("image") REFERENCES "public"."directus_files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_signups" ADD CONSTRAINT "event_signups_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_signups" ADD CONSTRAINT "event_signups_directus_relations_directus_users_id_fk" FOREIGN KEY ("directus_relations") REFERENCES "public"."directus_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events_directus_users" ADD CONSTRAINT "events_directus_users_events_id_events_id_fk" FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events_directus_users" ADD CONSTRAINT "events_directus_users_directus_users_id_directus_users_id_fk" FOREIGN KEY ("directus_users_id") REFERENCES "public"."directus_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intro_blog_likes" ADD CONSTRAINT "intro_blog_likes_blog_intro_blogs_id_fk" FOREIGN KEY ("blog") REFERENCES "public"."intro_blogs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intro_blog_likes" ADD CONSTRAINT "intro_blog_likes_user_id_directus_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."directus_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intro_blogs" ADD CONSTRAINT "intro_blogs_user_created_directus_users_id_fk" FOREIGN KEY ("user_created") REFERENCES "public"."directus_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intro_blogs" ADD CONSTRAINT "intro_blogs_user_updated_directus_users_id_fk" FOREIGN KEY ("user_updated") REFERENCES "public"."directus_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intro_blogs" ADD CONSTRAINT "intro_blogs_image_directus_files_id_fk" FOREIGN KEY ("image") REFERENCES "public"."directus_files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events_members" ADD CONSTRAINT "events_members_events_id_events_id_fk" FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hero_banners" ADD CONSTRAINT "hero_banners_user_created_directus_users_id_fk" FOREIGN KEY ("user_created") REFERENCES "public"."directus_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hero_banners" ADD CONSTRAINT "hero_banners_image_directus_files_id_fk" FOREIGN KEY ("image") REFERENCES "public"."directus_files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intro_blog_gallery" ADD CONSTRAINT "intro_blog_gallery_intro_blog_id_intro_blogs_id_fk" FOREIGN KEY ("intro_blog_id") REFERENCES "public"."intro_blogs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intro_blog_gallery" ADD CONSTRAINT "intro_blog_gallery_directus_files_id_directus_files_id_fk" FOREIGN KEY ("directus_files_id") REFERENCES "public"."directus_files"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pub_crawl_events" ADD CONSTRAINT "pub_crawl_events_image_directus_files_id_fk" FOREIGN KEY ("image") REFERENCES "public"."directus_files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_history" ADD CONSTRAINT "membership_history_user_id_directus_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."directus_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pub_crawl_signups_transactions" ADD CONSTRAINT "pub_crawl_signups_transactions_pub_crawl_signups_id_pub_crawl_signups_id_fk" FOREIGN KEY ("pub_crawl_signups_id") REFERENCES "public"."pub_crawl_signups"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pub_crawl_signups_transactions" ADD CONSTRAINT "pub_crawl_signups_transactions_transactions_id_transactions_id_fk" FOREIGN KEY ("transactions_id") REFERENCES "public"."transactions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_notification" ADD CONSTRAINT "push_notification_user_id_directus_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."directus_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pub_crawl_signups" ADD CONSTRAINT "pub_crawl_signups_pub_crawl_event_id_pub_crawl_events_id_fk" FOREIGN KEY ("pub_crawl_event_id") REFERENCES "public"."pub_crawl_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pub_crawl_signups" ADD CONSTRAINT "pub_crawl_signups_directus_relations_directus_users_id_fk" FOREIGN KEY ("directus_relations") REFERENCES "public"."directus_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intro_planning" ADD CONSTRAINT "intro_planning_user_created_directus_users_id_fk" FOREIGN KEY ("user_created") REFERENCES "public"."directus_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intro_planning" ADD CONSTRAINT "intro_planning_user_updated_directus_users_id_fk" FOREIGN KEY ("user_updated") REFERENCES "public"."directus_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pub_crawl_tickets" ADD CONSTRAINT "pub_crawl_tickets_signup_id_pub_crawl_signups_id_fk" FOREIGN KEY ("signup_id") REFERENCES "public"."pub_crawl_signups"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intro_parent_signups" ADD CONSTRAINT "intro_parent_signups_user_created_directus_users_id_fk" FOREIGN KEY ("user_created") REFERENCES "public"."directus_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intro_parent_signups" ADD CONSTRAINT "intro_parent_signups_user_updated_directus_users_id_fk" FOREIGN KEY ("user_updated") REFERENCES "public"."directus_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intro_parent_signups" ADD CONSTRAINT "intro_parent_signups_user_id_directus_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."directus_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intro_parent_signups" ADD CONSTRAINT "intro_parent_signups_approved_by_directus_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."directus_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_image_directus_files_id_fk" FOREIGN KEY ("image") REFERENCES "public"."directus_files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_signups" ADD CONSTRAINT "trip_signups_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_signups" ADD CONSTRAINT "trip_signups_directus_relations_directus_users_id_fk" FOREIGN KEY ("directus_relations") REFERENCES "public"."directus_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_activities" ADD CONSTRAINT "trip_activities_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_activities" ADD CONSTRAINT "trip_activities_image_directus_files_id_fk" FOREIGN KEY ("image") REFERENCES "public"."directus_files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_signup_activities" ADD CONSTRAINT "trip_signup_activities_trip_signup_id_trip_signups_id_fk" FOREIGN KEY ("trip_signup_id") REFERENCES "public"."trip_signups"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_signup_activities" ADD CONSTRAINT "trip_signup_activities_trip_activity_id_trip_activities_id_fk" FOREIGN KEY ("trip_activity_id") REFERENCES "public"."trip_activities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "safe_havens" ADD CONSTRAINT "safe_havens_image_directus_files_id_fk" FOREIGN KEY ("image") REFERENCES "public"."directus_files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "safe_havens" ADD CONSTRAINT "safe_havens_user_id_directus_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."directus_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sponsors" ADD CONSTRAINT "sponsors_image_directus_files_id_fk" FOREIGN KEY ("image") REFERENCES "public"."directus_files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clubs" ADD CONSTRAINT "clubs_image_directus_files_id_fk" FOREIGN KEY ("image") REFERENCES "public"."directus_files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_sessions" ADD CONSTRAINT "directus_sessions_user_directus_users_id_fk" FOREIGN KEY ("user") REFERENCES "public"."directus_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_sessions" ADD CONSTRAINT "directus_sessions_share_directus_shares_id_fk" FOREIGN KEY ("share") REFERENCES "public"."directus_shares"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_accounts" ADD CONSTRAINT "auth_accounts_userId_directus_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."directus_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_userId_directus_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."directus_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "committee_members" ADD CONSTRAINT "committee_members_committee_id_committees_id_fk" FOREIGN KEY ("committee_id") REFERENCES "public"."committees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "committee_members" ADD CONSTRAINT "committee_members_user_id_directus_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."directus_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_directus_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."directus_users"("id") ON DELETE set default ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_registration_event_signups_id_fk" FOREIGN KEY ("registration") REFERENCES "public"."event_signups"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_approved_by_directus_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."directus_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_pub_crawl_signup_pub_crawl_signups_id_fk" FOREIGN KEY ("pub_crawl_signup") REFERENCES "public"."pub_crawl_signups"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_trip_signup_trip_signups_id_fk" FOREIGN KEY ("trip_signup") REFERENCES "public"."trip_signups"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_webshop_preorder_webshop_preorders_id_fk" FOREIGN KEY ("webshop_preorder") REFERENCES "public"."webshop_preorders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intro_planning_signups" ADD CONSTRAINT "intro_planning_signups_intro_planning_id_intro_planning_id_fk" FOREIGN KEY ("intro_planning_id") REFERENCES "public"."intro_planning"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intro_planning_signups" ADD CONSTRAINT "intro_planning_signups_intro_signup_id_intro_signups_id_fk" FOREIGN KEY ("intro_signup_id") REFERENCES "public"."intro_signups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intro_planning_signups" ADD CONSTRAINT "intro_planning_signups_user_id_directus_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."directus_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_users" ADD CONSTRAINT "directus_users_role_directus_roles_id_fk" FOREIGN KEY ("role") REFERENCES "public"."directus_roles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_deployments" ADD CONSTRAINT "directus_deployments_user_created_directus_users_id_fk" FOREIGN KEY ("user_created") REFERENCES "public"."directus_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_deployment_projects" ADD CONSTRAINT "directus_deployment_projects_deployment_directus_deployments_id_fk" FOREIGN KEY ("deployment") REFERENCES "public"."directus_deployments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_deployment_projects" ADD CONSTRAINT "directus_deployment_projects_user_created_directus_users_id_fk" FOREIGN KEY ("user_created") REFERENCES "public"."directus_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_settings" ADD CONSTRAINT "directus_settings_project_logo_directus_files_id_fk" FOREIGN KEY ("project_logo") REFERENCES "public"."directus_files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_settings" ADD CONSTRAINT "directus_settings_public_foreground_directus_files_id_fk" FOREIGN KEY ("public_foreground") REFERENCES "public"."directus_files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_settings" ADD CONSTRAINT "directus_settings_public_background_directus_files_id_fk" FOREIGN KEY ("public_background") REFERENCES "public"."directus_files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_settings" ADD CONSTRAINT "directus_settings_storage_default_folder_directus_folders_id_fk" FOREIGN KEY ("storage_default_folder") REFERENCES "public"."directus_folders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_settings" ADD CONSTRAINT "directus_settings_public_favicon_directus_files_id_fk" FOREIGN KEY ("public_favicon") REFERENCES "public"."directus_files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_settings" ADD CONSTRAINT "directus_settings_public_registration_role_directus_roles_id_fk" FOREIGN KEY ("public_registration_role") REFERENCES "public"."directus_roles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_deployment_runs" ADD CONSTRAINT "directus_deployment_runs_project_directus_deployment_projects_id_fk" FOREIGN KEY ("project") REFERENCES "public"."directus_deployment_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directus_deployment_runs" ADD CONSTRAINT "directus_deployment_runs_user_created_directus_users_id_fk" FOREIGN KEY ("user_created") REFERENCES "public"."directus_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_club_members_club_id" ON "club_members" USING btree ("club_id");--> statement-breakpoint
CREATE INDEX "idx_contacts_display_order" ON "contacts" USING btree ("is_active","display_order");--> statement-breakpoint
CREATE INDEX "directus_activity_timestamp_index" ON "directus_activity" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "directus_revisions_activity_index" ON "directus_revisions" USING btree ("activity");--> statement-breakpoint
CREATE INDEX "directus_revisions_parent_index" ON "directus_revisions" USING btree ("parent");--> statement-breakpoint
CREATE INDEX "idx_documents_active_order" ON "documents" USING btree ("is_active","display_order");--> statement-breakpoint
CREATE INDEX "idx_documents_category" ON "documents" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_events_committee" ON "events" USING btree ("committee_id");--> statement-breakpoint
CREATE INDEX "idx_event_signups_event" ON "event_signups" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "idx_intro_blogs_slug" ON "intro_blogs" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_intro_blogs_type" ON "intro_blogs" USING btree ("blog_type");--> statement-breakpoint
CREATE INDEX "idx_intro_blog_gallery_blog" ON "intro_blog_gallery" USING btree ("intro_blog_id","sort");--> statement-breakpoint
CREATE INDEX "idx_intro_planning_date" ON "intro_planning" USING btree ("date","sort_order");--> statement-breakpoint
CREATE INDEX "idx_intro_planning_day" ON "intro_planning" USING btree ("day");--> statement-breakpoint
CREATE INDEX "idx_intro_planning_sort" ON "intro_planning" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "idx_intro_parent_signups_approved" ON "intro_parent_signups" USING btree ("approved");--> statement-breakpoint
CREATE INDEX "idx_intro_parent_signups_user" ON "intro_parent_signups" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_whatsapp_groups_active" ON "whatsapp_groups" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_whatsapp_groups_membership" ON "whatsapp_groups" USING btree ("requires_membership");--> statement-breakpoint
CREATE INDEX "idx_transactions_created_at" ON "transactions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_transactions_user_id" ON "transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_intro_planning_signups_activity" ON "intro_planning_signups" USING btree ("intro_planning_id");--> statement-breakpoint
CREATE INDEX "idx_intro_planning_signups_user" ON "intro_planning_signups" USING btree ("intro_signup_id");--> statement-breakpoint
CREATE INDEX "idx_directus_users_entra_id" ON "directus_users" USING btree ("entra_id");--> statement-breakpoint
ALTER TABLE "directus_users" DROP COLUMN "admin_access";--> statement-breakpoint
ALTER TABLE "pub_crawl_events" ADD CONSTRAINT "pub_crawl_events_email_unique" UNIQUE("email");