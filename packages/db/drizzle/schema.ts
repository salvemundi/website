import { pgTable, index, foreignKey, integer, boolean, serial, uuid, timestamp, varchar, text, doublePrecision, unique, json, real, bigint, date, numeric, time, inet, jsonb, bigserial } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const club_members = pgTable("club_members", {
	club_id: integer().notNull(),
	is_visible: boolean().default(true).notNull(),
	is_leader: boolean().default(false).notNull(),
	id: serial().primaryKey().notNull(),
}, (table) => [
	index("idx_club_members_club_id").using("btree", table.club_id.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.club_id],
			foreignColumns: [clubs.id],
			name: "club_members_club_id_clubs_id_fk"
		}),
]);

export const Stickers = pgTable("Stickers", {
	id: serial().primaryKey().notNull(),
	user_created: uuid(),
	date_created: timestamp({ withTimezone: true, mode: 'string' }),
	user_updated: uuid(),
	date_updated: timestamp({ withTimezone: true, mode: 'string' }),
	location_name: varchar({ length: 255 }),
	address: text(),
	latitude: doublePrecision(),
	longitude: doublePrecision(),
	description: text(),
	country: varchar({ length: 255 }),
	city: varchar({ length: 255 }),
	image: uuid(),
	status: varchar({ length: 255 }).default('draft'),
}, (table) => [
	foreignKey({
			columns: [table.user_created],
			foreignColumns: [directus_users.id],
			name: "Stickers_user_created_directus_users_id_fk"
		}).onDelete("set default"),
	foreignKey({
			columns: [table.user_updated],
			foreignColumns: [directus_users.id],
			name: "Stickers_user_updated_directus_users_id_fk"
		}).onDelete("set default"),
	foreignKey({
			columns: [table.image],
			foreignColumns: [directus_files.id],
			name: "Stickers_image_directus_files_id_fk"
		}).onDelete("set null"),
]);

export const Board = pgTable("Board", {
	id: serial().primaryKey().notNull(),
	user_created: uuid(),
	date_created: timestamp({ withTimezone: true, mode: 'string' }),
	user_updated: uuid(),
	date_updated: timestamp({ withTimezone: true, mode: 'string' }),
	image: uuid(),
	naam: varchar({ length: 255 }),
	year: varchar({ length: 255 }),
}, (table) => [
	foreignKey({
			columns: [table.user_created],
			foreignColumns: [directus_users.id],
			name: "Board_user_created_directus_users_id_fk"
		}),
	foreignKey({
			columns: [table.user_updated],
			foreignColumns: [directus_users.id],
			name: "Board_user_updated_directus_users_id_fk"
		}),
	foreignKey({
			columns: [table.image],
			foreignColumns: [directus_files.id],
			name: "Board_image_directus_files_id_fk"
		}).onDelete("set null"),
]);

export const Board_Members = pgTable("Board_Members", {
	id: serial().primaryKey().notNull(),
	date_created: timestamp({ withTimezone: true, mode: 'string' }),
	date_updated: timestamp({ withTimezone: true, mode: 'string' }),
	board_id: integer(),
	functie: varchar({ length: 255 }),
	user_id: uuid(),
	name: varchar({ length: 255 }),
}, (table) => [
	foreignKey({
			columns: [table.board_id],
			foreignColumns: [Board.id],
			name: "Board_Members_board_id_Board_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.user_id],
			foreignColumns: [directus_users.id],
			name: "Board_Members_user_id_directus_users_id_fk"
		}).onDelete("set null"),
]);

export const contacts = pgTable("contacts", {
	id: serial().primaryKey().notNull(),
	title: varchar({ length: 255 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	phone_number: varchar({ length: 50 }),
	description: text(),
	is_active: boolean().default(true).notNull(),
	display_order: integer().default(0).notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	image: uuid(),
}, (table) => [
	index("idx_contacts_display_order").using("btree", table.is_active.asc().nullsLast().op("int4_ops"), table.display_order.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.image],
			foreignColumns: [directus_files.id],
			name: "contacts_image_directus_files_id_fk"
		}).onDelete("set null"),
]);

export const directus_access = pgTable("directus_access", {
	id: uuid().primaryKey().notNull(),
	role: uuid(),
	user: uuid(),
	policy: uuid().notNull(),
	sort: integer(),
}, (table) => [
	foreignKey({
			columns: [table.role],
			foreignColumns: [directus_roles.id],
			name: "directus_access_role_directus_roles_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.user],
			foreignColumns: [directus_users.id],
			name: "directus_access_user_directus_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.policy],
			foreignColumns: [directus_policies.id],
			name: "directus_access_policy_directus_policies_id_fk"
		}).onDelete("cascade"),
]);

export const committees = pgTable("committees", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }),
	image: uuid(),
	is_visible: boolean().default(false),
	short_description: text(),
	description: text(),
	email: varchar({ length: 255 }),
	commissie_token: varchar({ length: 10 }),
	azure_group_id: varchar({ length: 255 }),
}, (table) => [
	foreignKey({
			columns: [table.image],
			foreignColumns: [directus_files.id],
			name: "committees_image_directus_files_id_fk"
		}).onDelete("set null"),
	unique("committees_name_key").on(table.name),
	unique("committees_commissie_token_unique").on(table.commissie_token),
]);

export const directus_comments = pgTable("directus_comments", {
	id: uuid().primaryKey().notNull(),
	collection: varchar({ length: 64 }).notNull(),
	item: varchar({ length: 255 }).notNull(),
	comment: text().notNull(),
	date_created: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	date_updated: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	user_created: uuid(),
	user_updated: uuid(),
}, (table) => [
	foreignKey({
			columns: [table.user_created],
			foreignColumns: [directus_users.id],
			name: "directus_comments_user_created_directus_users_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.user_updated],
			foreignColumns: [directus_users.id],
			name: "directus_comments_user_updated_directus_users_id_fk"
		}),
]);

export const directus_dashboards = pgTable("directus_dashboards", {
	id: uuid().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	icon: varchar({ length: 64 }).default('dashboard').notNull(),
	note: text(),
	date_created: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	user_created: uuid(),
	color: varchar({ length: 255 }),
}, (table) => [
	foreignKey({
			columns: [table.user_created],
			foreignColumns: [directus_users.id],
			name: "directus_dashboards_user_created_directus_users_id_fk"
		}).onDelete("set null"),
]);

export const directus_folders = pgTable("directus_folders", {
	id: uuid().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	parent: uuid(),
}, (table) => [
	foreignKey({
			columns: [table.parent],
			foreignColumns: [table.id],
			name: "directus_folders_parent_foreign"
		}),
]);

export const directus_extensions = pgTable("directus_extensions", {
	enabled: boolean().default(true).notNull(),
	id: uuid().primaryKey().notNull(),
	folder: varchar({ length: 255 }).notNull(),
	source: varchar({ length: 255 }).notNull(),
	bundle: uuid(),
});

export const directus_fields = pgTable("directus_fields", {
	id: serial().primaryKey().notNull(),
	collection: varchar({ length: 64 }).notNull(),
	field: varchar({ length: 64 }).notNull(),
	special: varchar({ length: 64 }),
	interface: varchar({ length: 64 }),
	options: json(),
	display: varchar({ length: 64 }),
	display_options: json(),
	readonly: boolean().default(false).notNull(),
	hidden: boolean().default(false).notNull(),
	sort: integer(),
	width: varchar({ length: 30 }).default('full'),
	translations: json(),
	note: text(),
	conditions: json(),
	required: boolean().default(false),
	group: varchar({ length: 64 }),
	validation: json(),
	validation_message: text(),
	searchable: boolean().default(true).notNull(),
});

export const coupons = pgTable("coupons", {
	id: serial().primaryKey().notNull(),
	coupon_code: varchar({ length: 255 }),
	discount_type: varchar({ length: 255 }).default('fixed'),
	usage_limit: integer(),
	usage_count: integer().default(0).notNull(),
	is_active: boolean().default(true),
	valid_from: timestamp({ mode: 'string' }),
	valid_until: timestamp({ mode: 'string' }),
	discount_value: real(),
	date_created: timestamp({ mode: 'string' }),
}, (table) => [
	unique("coupons_coupon_code_unique").on(table.coupon_code),
]);

export const directus_activity = pgTable("directus_activity", {
	id: serial().primaryKey().notNull(),
	action: varchar({ length: 45 }).notNull(),
	user: uuid(),
	timestamp: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	ip: varchar({ length: 50 }),
	user_agent: text(),
	collection: varchar({ length: 64 }).notNull(),
	item: varchar({ length: 255 }).notNull(),
	origin: varchar({ length: 255 }),
}, (table) => [
	index().using("btree", table.timestamp.asc().nullsLast().op("timestamptz_ops")),
]);

export const directus_migrations = pgTable("directus_migrations", {
	version: varchar({ length: 255 }).primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	timestamp: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
});

export const directus_files = pgTable("directus_files", {
	id: uuid().primaryKey().notNull(),
	storage: varchar({ length: 255 }).notNull(),
	filename_disk: varchar({ length: 255 }),
	filename_download: varchar({ length: 255 }).notNull(),
	title: varchar({ length: 255 }),
	type: varchar({ length: 255 }),
	folder: uuid(),
	uploaded_by: uuid(),
	created_on: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	modified_by: uuid(),
	modified_on: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	charset: varchar({ length: 50 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	filesize: bigint({ mode: "number" }),
	width: integer(),
	height: integer(),
	duration: integer(),
	embed: varchar({ length: 200 }),
	description: text(),
	location: text(),
	tags: text(),
	metadata: json(),
	focal_point_x: integer(),
	focal_point_y: integer(),
	tus_id: varchar({ length: 64 }),
	tus_data: json(),
	uploaded_on: timestamp({ withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.folder],
			foreignColumns: [directus_folders.id],
			name: "directus_files_folder_directus_folders_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.uploaded_by],
			foreignColumns: [directus_users.id],
			name: "directus_files_uploaded_by_directus_users_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.modified_by],
			foreignColumns: [directus_users.id],
			name: "directus_files_modified_by_directus_users_id_fk"
		}).onDelete("set null"),
]);

export const directus_collections = pgTable("directus_collections", {
	collection: varchar({ length: 64 }).primaryKey().notNull(),
	icon: varchar({ length: 64 }),
	note: text(),
	display_template: varchar({ length: 255 }),
	hidden: boolean().default(false).notNull(),
	singleton: boolean().default(false).notNull(),
	translations: json(),
	archive_field: varchar({ length: 64 }),
	archive_app_filter: boolean().default(true).notNull(),
	archive_value: varchar({ length: 255 }),
	unarchive_value: varchar({ length: 255 }),
	sort_field: varchar({ length: 64 }),
	accountability: varchar({ length: 255 }).default('all'),
	color: varchar({ length: 255 }),
	item_duplication_fields: json(),
	sort: integer(),
	group: varchar({ length: 64 }),
	collapse: varchar({ length: 255 }).default('open').notNull(),
	preview_url: varchar({ length: 255 }),
	versioning: boolean().default(false).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.group],
			foreignColumns: [table.collection],
			name: "directus_collections_group_foreign"
		}),
]);

export const directus_flows = pgTable("directus_flows", {
	id: uuid().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	icon: varchar({ length: 64 }),
	color: varchar({ length: 255 }),
	description: text(),
	status: varchar({ length: 255 }).default('active').notNull(),
	trigger: varchar({ length: 255 }),
	accountability: varchar({ length: 255 }).default('all'),
	options: json(),
	operation: uuid(),
	date_created: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	user_created: uuid(),
}, (table) => [
	foreignKey({
			columns: [table.user_created],
			foreignColumns: [directus_users.id],
			name: "directus_flows_user_created_directus_users_id_fk"
		}).onDelete("set null"),
	unique("directus_flows_operation_unique").on(table.operation),
]);

export const directus_panels = pgTable("directus_panels", {
	id: uuid().primaryKey().notNull(),
	dashboard: uuid().notNull(),
	name: varchar({ length: 255 }),
	icon: varchar({ length: 64 }),
	color: varchar({ length: 10 }),
	show_header: boolean().default(false).notNull(),
	note: text(),
	type: varchar({ length: 255 }).notNull(),
	position_x: integer().notNull(),
	position_y: integer().notNull(),
	width: integer().notNull(),
	height: integer().notNull(),
	options: json(),
	date_created: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	user_created: uuid(),
}, (table) => [
	foreignKey({
			columns: [table.dashboard],
			foreignColumns: [directus_dashboards.id],
			name: "directus_panels_dashboard_directus_dashboards_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.user_created],
			foreignColumns: [directus_users.id],
			name: "directus_panels_user_created_directus_users_id_fk"
		}).onDelete("set null"),
]);

export const directus_permissions = pgTable("directus_permissions", {
	id: serial().primaryKey().notNull(),
	collection: varchar({ length: 64 }).notNull(),
	action: varchar({ length: 10 }).notNull(),
	permissions: json(),
	validation: json(),
	presets: json(),
	fields: text(),
	policy: uuid().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.policy],
			foreignColumns: [directus_policies.id],
			name: "directus_permissions_policy_directus_policies_id_fk"
		}).onDelete("cascade"),
]);

export const directus_presets = pgTable("directus_presets", {
	id: serial().primaryKey().notNull(),
	bookmark: varchar({ length: 255 }),
	user: uuid(),
	role: uuid(),
	collection: varchar({ length: 64 }),
	search: varchar({ length: 100 }),
	layout: varchar({ length: 100 }).default('tabular'),
	layout_query: json(),
	layout_options: json(),
	refresh_interval: integer(),
	filter: json(),
	icon: varchar({ length: 64 }).default('bookmark'),
	color: varchar({ length: 255 }),
}, (table) => [
	foreignKey({
			columns: [table.user],
			foreignColumns: [directus_users.id],
			name: "directus_presets_user_directus_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.role],
			foreignColumns: [directus_roles.id],
			name: "directus_presets_role_directus_roles_id_fk"
		}).onDelete("cascade"),
]);

export const directus_roles = pgTable("directus_roles", {
	id: uuid().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	icon: varchar({ length: 64 }).default('supervised_user_circle').notNull(),
	description: text(),
	parent: uuid(),
}, (table) => [
	foreignKey({
			columns: [table.parent],
			foreignColumns: [table.id],
			name: "directus_roles_parent_foreign"
		}),
]);

export const directus_revisions = pgTable("directus_revisions", {
	id: serial().primaryKey().notNull(),
	activity: integer().notNull(),
	collection: varchar({ length: 64 }).notNull(),
	item: varchar({ length: 255 }).notNull(),
	data: json(),
	delta: json(),
	parent: integer(),
	version: uuid(),
}, (table) => [
	index().using("btree", table.activity.asc().nullsLast().op("int4_ops")),
	index().using("btree", table.parent.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.activity],
			foreignColumns: [directus_activity.id],
			name: "directus_revisions_activity_directus_activity_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.version],
			foreignColumns: [directus_versions.id],
			name: "directus_revisions_version_directus_versions_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.parent],
			foreignColumns: [table.id],
			name: "directus_revisions_parent_foreign"
		}),
]);

export const directus_relations = pgTable("directus_relations", {
	id: serial().primaryKey().notNull(),
	many_collection: varchar({ length: 64 }).notNull(),
	many_field: varchar({ length: 64 }).notNull(),
	one_collection: varchar({ length: 64 }),
	one_field: varchar({ length: 64 }),
	one_collection_field: varchar({ length: 64 }),
	one_allowed_collections: text(),
	junction_field: varchar({ length: 64 }),
	sort_field: varchar({ length: 64 }),
	one_deselect_action: varchar({ length: 255 }).default('nullify').notNull(),
});

export const directus_shares = pgTable("directus_shares", {
	id: uuid().primaryKey().notNull(),
	name: varchar({ length: 255 }),
	collection: varchar({ length: 64 }).notNull(),
	item: varchar({ length: 255 }).notNull(),
	role: uuid(),
	password: varchar({ length: 255 }),
	user_created: uuid(),
	date_created: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	date_start: timestamp({ withTimezone: true, mode: 'string' }),
	date_end: timestamp({ withTimezone: true, mode: 'string' }),
	times_used: integer().default(0),
	max_uses: integer(),
}, (table) => [
	foreignKey({
			columns: [table.collection],
			foreignColumns: [directus_collections.collection],
			name: "directus_shares_collection_directus_collections_collection_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.role],
			foreignColumns: [directus_roles.id],
			name: "directus_shares_role_directus_roles_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.user_created],
			foreignColumns: [directus_users.id],
			name: "directus_shares_user_created_directus_users_id_fk"
		}).onDelete("set null"),
]);

export const directus_notifications = pgTable("directus_notifications", {
	id: serial().primaryKey().notNull(),
	timestamp: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	status: varchar({ length: 255 }).default('inbox'),
	recipient: uuid().notNull(),
	sender: uuid(),
	subject: varchar({ length: 255 }).notNull(),
	message: text(),
	collection: varchar({ length: 64 }),
	item: varchar({ length: 255 }),
}, (table) => [
	foreignKey({
			columns: [table.recipient],
			foreignColumns: [directus_users.id],
			name: "directus_notifications_recipient_directus_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.sender],
			foreignColumns: [directus_users.id],
			name: "directus_notifications_sender_directus_users_id_fk"
		}),
]);

export const directus_policies = pgTable("directus_policies", {
	id: uuid().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	icon: varchar({ length: 64 }).default('badge').notNull(),
	description: text(),
	ip_access: text(),
	enforce_tfa: boolean().default(false).notNull(),
	admin_access: boolean().default(false).notNull(),
	app_access: boolean().default(false).notNull(),
});

export const directus_operations = pgTable("directus_operations", {
	id: uuid().primaryKey().notNull(),
	name: varchar({ length: 255 }),
	key: varchar({ length: 255 }).notNull(),
	type: varchar({ length: 255 }).notNull(),
	position_x: integer().notNull(),
	position_y: integer().notNull(),
	options: json(),
	resolve: uuid(),
	reject: uuid(),
	flow: uuid().notNull(),
	date_created: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	user_created: uuid(),
}, (table) => [
	foreignKey({
			columns: [table.flow],
			foreignColumns: [directus_flows.id],
			name: "directus_operations_flow_directus_flows_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.user_created],
			foreignColumns: [directus_users.id],
			name: "directus_operations_user_created_directus_users_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.reject],
			foreignColumns: [table.id],
			name: "directus_operations_reject_foreign"
		}),
	foreignKey({
			columns: [table.resolve],
			foreignColumns: [table.id],
			name: "directus_operations_resolve_foreign"
		}),
	unique("directus_operations_resolve_unique").on(table.resolve),
	unique("directus_operations_reject_unique").on(table.reject),
]);

export const directus_translations = pgTable("directus_translations", {
	id: uuid().primaryKey().notNull(),
	language: varchar({ length: 255 }).notNull(),
	key: varchar({ length: 255 }).notNull(),
	value: text().notNull(),
});

export const directus_versions = pgTable("directus_versions", {
	id: uuid().primaryKey().notNull(),
	key: varchar({ length: 64 }).notNull(),
	name: varchar({ length: 255 }),
	collection: varchar({ length: 64 }).notNull(),
	item: varchar({ length: 255 }).notNull(),
	hash: varchar({ length: 255 }),
	date_created: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	date_updated: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	user_created: uuid(),
	user_updated: uuid(),
	delta: json(),
}, (table) => [
	foreignKey({
			columns: [table.collection],
			foreignColumns: [directus_collections.collection],
			name: "directus_versions_collection_directus_collections_collection_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.user_created],
			foreignColumns: [directus_users.id],
			name: "directus_versions_user_created_directus_users_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.user_updated],
			foreignColumns: [directus_users.id],
			name: "directus_versions_user_updated_directus_users_id_fk"
		}),
]);

export const intro_blogs = pgTable("intro_blogs", {
	id: serial().primaryKey().notNull(),
	status: varchar({ length: 255 }).default('draft'),
	sort: integer(),
	user_created: uuid(),
	user_updated: uuid(),
	title: varchar({ length: 255 }).notNull(),
	slug: varchar({ length: 255 }),
	content: text().notNull(),
	excerpt: varchar({ length: 500 }),
	image: uuid(),
	is_published: boolean().default(false),
	blog_type: varchar({ length: 50 }).default('update'),
	meta_title: varchar({ length: 255 }),
	meta_description: varchar({ length: 500 }),
	views_count: integer().default(0),
	created_at: timestamp({ mode: 'string' }),
	updated_at: timestamp({ mode: 'string' }),
	likes: varchar({ length: 255 }).default('0'),
	date_updated: timestamp({ mode: 'string' }),
}, (table) => [
	index("idx_intro_blogs_slug").using("btree", table.slug.asc().nullsLast().op("text_ops")),
	index("idx_intro_blogs_type").using("btree", table.blog_type.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.user_created],
			foreignColumns: [directus_users.id],
			name: "intro_blogs_user_created_directus_users_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.user_updated],
			foreignColumns: [directus_users.id],
			name: "intro_blogs_user_updated_directus_users_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.image],
			foreignColumns: [directus_files.id],
			name: "intro_blogs_image_directus_files_id_fk"
		}).onDelete("set null"),
	unique("intro_blogs_slug_key").on(table.slug),
]);

export const documents = pgTable("documents", {
	id: serial().primaryKey().notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	category: varchar({ length: 100 }),
	is_active: boolean().default(true).notNull(),
	display_order: integer().default(0).notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	file: uuid(),
}, (table) => [
	index("idx_documents_active_order").using("btree", table.is_active.asc().nullsLast().op("int4_ops"), table.display_order.asc().nullsLast().op("int4_ops")),
	index("idx_documents_category").using("btree", table.category.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.file],
			foreignColumns: [directus_files.id],
			name: "documents_file_directus_files_id_fk"
		}).onDelete("set null"),
]);

export const events = pgTable("events", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	event_date: date().notNull(),
	description: text(),
	description_logged_in: text(),
	price_members: numeric({ precision: 10, scale:  2 }).default('0.00').notNull(),
	price_non_members: numeric({ precision: 10, scale:  2 }).default('0.00').notNull(),
	max_sign_ups: integer(),
	only_members: boolean().default(false).notNull(),
	one_sign_up_max: boolean().default(false).notNull(),
	committee_id: integer(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }),
	image: uuid(),
	contact: varchar({ length: 255 }),
	event_time: time(),
	location: varchar({ length: 255 }).default('Rachelsmolen'),
	event_time_end: time(),
	registration_deadline: date(),
	status: varchar({ length: 255 }),
	publish_date: timestamp({ mode: 'string' }),
	event_date_end: date(),
	custom_url: text(),
	short_description: text(),
}, (table) => [
	index("idx_events_committee").using("btree", table.committee_id.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.committee_id],
			foreignColumns: [committees.id],
			name: "events_committee_id_committees_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.image],
			foreignColumns: [directus_files.id],
			name: "events_image_directus_files_id_fk"
		}).onDelete("set null"),
]);

export const event_signups = pgTable("event_signups", {
	event_id: integer().notNull(),
	submission_file_url: varchar({ length: 255 }),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	id: serial().primaryKey().notNull(),
	qr_token: varchar({ length: 255 }),
	checked_in: boolean().default(false),
	checked_in_at: timestamp({ mode: 'string' }),
	participant_name: text(),
	participant_email: text(),
	participant_phone: text(),
	payment_status: varchar({ length: 255 }).default('open'),
	directus_relations: uuid(),
	is_member: boolean().default(false),
}, (table) => [
	index("idx_event_signups_event").using("btree", table.event_id.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.event_id],
			foreignColumns: [events.id],
			name: "event_signups_event_id_events_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.directus_relations],
			foreignColumns: [directus_users.id],
			name: "event_signups_directus_relations_directus_users_id_fk"
		}).onDelete("set null"),
]);

export const events_directus_users = pgTable("events_directus_users", {
	id: serial().primaryKey().notNull(),
	events_id: integer(),
	directus_users_id: uuid(),
}, (table) => [
	foreignKey({
			columns: [table.events_id],
			foreignColumns: [events.id],
			name: "events_directus_users_events_id_events_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.directus_users_id],
			foreignColumns: [directus_users.id],
			name: "events_directus_users_directus_users_id_directus_users_id_fk"
		}).onDelete("set null"),
]);

export const hero_banners_files = pgTable("hero_banners_files", {
	id: serial().primaryKey().notNull(),
	hero_banners_id: integer(),
	directus_files_id: uuid(),
});

export const intro_blog_likes = pgTable("intro_blog_likes", {
	id: serial().primaryKey().notNull(),
	blog: integer().notNull(),
	user_id: uuid().notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	ip_address: inet(),
	user_agent: text(),
}, (table) => [
	foreignKey({
			columns: [table.blog],
			foreignColumns: [intro_blogs.id],
			name: "intro_blog_likes_blog_intro_blogs_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.user_id],
			foreignColumns: [directus_users.id],
			name: "intro_blog_likes_user_id_directus_users_id_fk"
		}).onDelete("cascade"),
	unique("uniq_blog_user").on(table.blog, table.user_id),
]);

export const events_members = pgTable("events_members", {
	id: serial().primaryKey().notNull(),
	events_id: integer(),
}, (table) => [
	foreignKey({
			columns: [table.events_id],
			foreignColumns: [events.id],
			name: "events_members_events_id_events_id_fk"
		}).onDelete("set null"),
]);

export const hero_banners = pgTable("hero_banners", {
	id: serial().primaryKey().notNull(),
	user_created: uuid(),
	date_created: timestamp({ withTimezone: true, mode: 'string' }),
	image: uuid(),
	sort: integer(),
	title: varchar({ length: 255 }),
}, (table) => [
	foreignKey({
			columns: [table.user_created],
			foreignColumns: [directus_users.id],
			name: "hero_banners_user_created_directus_users_id_fk"
		}),
	foreignKey({
			columns: [table.image],
			foreignColumns: [directus_files.id],
			name: "hero_banners_image_directus_files_id_fk"
		}).onDelete("set null"),
]);

export const intro_blog_gallery = pgTable("intro_blog_gallery", {
	id: serial().primaryKey().notNull(),
	intro_blog_id: integer().notNull(),
	directus_files_id: uuid().notNull(),
	sort: integer().default(0),
	caption: varchar({ length: 500 }),
	created_at: timestamp({ mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_intro_blog_gallery_blog").using("btree", table.intro_blog_id.asc().nullsLast().op("int4_ops"), table.sort.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.intro_blog_id],
			foreignColumns: [intro_blogs.id],
			name: "intro_blog_gallery_intro_blog_id_intro_blogs_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.directus_files_id],
			foreignColumns: [directus_files.id],
			name: "intro_blog_gallery_directus_files_id_directus_files_id_fk"
		}).onDelete("cascade"),
	unique("intro_blog_gallery_intro_blog_id_directus_files_id_key").on(table.intro_blog_id, table.directus_files_id),
]);

export const pub_crawl_events = pgTable("pub_crawl_events", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 255 }).default(sql`NULL`).notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }),
	image: uuid(),
	date: timestamp({ mode: 'string' }),
	description: text(),
	whatsapp_community_url: varchar({ length: 255 }),
	groups: jsonb().default([]),
}, (table) => [
	foreignKey({
			columns: [table.image],
			foreignColumns: [directus_files.id],
			name: "pub_crawl_events_image_directus_files_id_fk"
		}).onDelete("set null"),
]);

export const membership_history = pgTable("membership_history", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	user_id: uuid(),
	previous_status: varchar({ length: 255 }),
	new_status: varchar({ length: 255 }),
	changed_at: timestamp({ mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.user_id],
			foreignColumns: [directus_users.id],
			name: "membership_history_user_id_directus_users_id_fk"
		}).onDelete("cascade"),
]);

export const jobs = pgTable("jobs", {
	job_id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	pay: numeric({ precision: 10, scale:  2 }),
	location: varchar({ length: 255 }).notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	skills: text(),
	profile_description: text(),
});

export const pub_crawl_signups_transactions = pgTable("pub_crawl_signups_transactions", {
	id: serial().primaryKey().notNull(),
	pub_crawl_signups_id: integer(),
	transactions_id: integer(),
}, (table) => [
	foreignKey({
			columns: [table.pub_crawl_signups_id],
			foreignColumns: [pub_crawl_signups.id],
			name: "pub_crawl_signups_transactions_pub_crawl_signups_id_pub_crawl_s"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.transactions_id],
			foreignColumns: [transactions.id],
			name: "pub_crawl_signups_transactions_transactions_id_transactions_id_"
		}).onDelete("set null"),
]);

export const push_notification = pgTable("push_notification", {
	id: serial().primaryKey().notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }),
	endpoint: varchar({ length: 255 }),
	user_id: uuid(),
	keys: json(),
	user_agent: varchar({ length: 255 }),
	last_used: timestamp({ mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.user_id],
			foreignColumns: [directus_users.id],
			name: "push_notification_user_id_directus_users_id_fk"
		}).onDelete("set null"),
]);

export const permissions = pgTable("permissions", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }),
}, (table) => [
	unique("permissions_name_key").on(table.name),
]);

export const intro_signups = pgTable("intro_signups", {
	id: serial().primaryKey().notNull(),
	first_name: varchar({ length: 255 }),
	middle_name: varchar({ length: 255 }),
	last_name: varchar({ length: 255 }),
	date_of_birth: varchar({ length: 255 }),
	email: varchar({ length: 255 }),
	phone_number: varchar({ length: 255 }),
	favorite_gif: varchar({ length: 255 }),
	created_at: timestamp({ mode: 'string' }),
	status: varchar({ length: 255 }).default('registered'),
	approved: boolean().default(false),
});

export const pub_crawl_signups = pgTable("pub_crawl_signups", {
	id: serial().primaryKey().notNull(),
	association: varchar({ length: 255 }),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }),
	pub_crawl_event_id: integer(),
	email: varchar({ length: 255 }),
	name: varchar({ length: 50 }),
	amount_tickets: integer(),
	payment_status: varchar({ length: 255 }),
	name_initials: text(),
	directus_relations: uuid(),
	is_member: boolean().default(false),
	group_name: varchar({ length: 255 }),
}, (table) => [
	foreignKey({
			columns: [table.pub_crawl_event_id],
			foreignColumns: [pub_crawl_events.id],
			name: "pub_crawl_signups_pub_crawl_event_id_pub_crawl_events_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.directus_relations],
			foreignColumns: [directus_users.id],
			name: "pub_crawl_signups_directus_relations_directus_users_id_fk"
		}).onDelete("set null"),
]);

export const intro_planning = pgTable("intro_planning", {
	id: serial().primaryKey().notNull(),
	status: varchar({ length: 255 }).default('published'),
	sort: integer(),
	user_created: uuid(),
	date_created: timestamp({ mode: 'string' }).defaultNow(),
	user_updated: uuid(),
	date_updated: timestamp({ mode: 'string' }).defaultNow(),
	day: varchar({ length: 50 }).notNull(),
	date: date().notNull(),
	time_start: time().notNull(),
	time_end: time(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	location: varchar({ length: 255 }),
	sort_order: integer().default(0).notNull(),
	color: varchar({ length: 7 }),
	capacity: integer(),
	signup_required: boolean().default(false),
	created_at: timestamp({ mode: 'string' }).defaultNow(),
	updated_at: timestamp({ mode: 'string' }).defaultNow(),
	icon: varchar({ length: 255 }).default('Calendar Today'),
	is_mandatory: varchar({ length: 255 }),
}, (table) => [
	index("idx_intro_planning_date").using("btree", table.date.asc().nullsLast().op("date_ops"), table.sort_order.asc().nullsLast().op("int4_ops")),
	index("idx_intro_planning_day").using("btree", table.day.asc().nullsLast().op("text_ops")),
	index("idx_intro_planning_sort").using("btree", table.sort_order.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.user_created],
			foreignColumns: [directus_users.id],
			name: "intro_planning_user_created_directus_users_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.user_updated],
			foreignColumns: [directus_users.id],
			name: "intro_planning_user_updated_directus_users_id_fk"
		}).onDelete("set null"),
]);

export const pub_crawl_tickets = pgTable("pub_crawl_tickets", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	signup_id: integer(),
	name: varchar({ length: 255 }),
	initial: varchar({ length: 1 }),
	qr_token: varchar({ length: 255 }),
	checked_in: boolean().default(false),
	checked_in_at: timestamp({ mode: 'string' }),
	created_at: timestamp({ mode: 'string' }),
	updated_at: timestamp({ mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.signup_id],
			foreignColumns: [pub_crawl_signups.id],
			name: "pub_crawl_tickets_signup_id_pub_crawl_signups_id_fk"
		}).onDelete("set null"),
	unique("pub_crawl_tickets_qr_token_unique").on(table.qr_token),
]);

export const roles = pgTable("roles", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }),
}, (table) => [
	unique("roles_name_key").on(table.name),
]);

export const intro_parent_signups = pgTable("intro_parent_signups", {
	id: serial().primaryKey().notNull(),
	status: varchar({ length: 255 }).default('submitted'),
	user_created: uuid(),
	user_updated: uuid(),
	user_id: uuid().notNull(),
	first_name: varchar({ length: 255 }).notNull(),
	last_name: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	phone_number: varchar({ length: 50 }).notNull(),
	motivation: text().notNull(),
	previous_experience: text(),
	availability: jsonb().notNull(),
	approved: boolean().default(false),
	approved_by: uuid(),
	approved_at: timestamp({ mode: 'string' }),
	notes: text(),
	created_at: timestamp({ mode: 'string' }),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }),
	date_updated: timestamp({ withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_intro_parent_signups_approved").using("btree", table.approved.asc().nullsLast().op("bool_ops")),
	index("idx_intro_parent_signups_user").using("btree", table.user_id.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.user_created],
			foreignColumns: [directus_users.id],
			name: "intro_parent_signups_user_created_directus_users_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.user_updated],
			foreignColumns: [directus_users.id],
			name: "intro_parent_signups_user_updated_directus_users_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.user_id],
			foreignColumns: [directus_users.id],
			name: "intro_parent_signups_user_id_directus_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.approved_by],
			foreignColumns: [directus_users.id],
			name: "intro_parent_signups_approved_by_directus_users_id_fk"
		}).onDelete("set null"),
	unique("intro_parent_signups_user_id_key").on(table.user_id),
]);

export const trips = pgTable("trips", {
	id: serial().primaryKey().notNull(),
	status: varchar({ length: 255 }),
	name: varchar({ length: 255 }),
	description: text(),
	image: uuid(),
	registration_open: boolean().default(false),
	max_participants: integer(),
	base_price: numeric({ precision: 10, scale:  5 }),
	crew_discount: numeric({ precision: 10, scale:  5 }),
	deposit_amount: numeric({ precision: 10, scale:  5 }),
	is_bus_trip: boolean().default(true),
	created_at: date(),
	updated_at: date(),
	start_date: date(),
	end_date: date(),
	registration_start_date: timestamp({ withTimezone: true, mode: 'string' }),
	max_crew: integer(),
	allow_final_payments: boolean().default(false),
	allow_deposit_payments: boolean().default(false),
}, (table) => [
	foreignKey({
			columns: [table.image],
			foreignColumns: [directus_files.id],
			name: "trips_image_directus_files_id_fk"
		}).onDelete("set null"),
]);

export const whatsapp_groups = pgTable("whatsapp_groups", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	invite_link: varchar({ length: 500 }).notNull(),
	is_active: boolean().default(true),
	requires_membership: boolean().default(true),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_whatsapp_groups_active").using("btree", table.is_active.asc().nullsLast().op("bool_ops")),
	index("idx_whatsapp_groups_membership").using("btree", table.requires_membership.asc().nullsLast().op("bool_ops")),
	unique("uq_whatsapp_groups_invite_link").on(table.invite_link),
]);

export const trip_signups = pgTable("trip_signups", {
	id: serial().primaryKey().notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }),
	trip_id: integer(),
	first_name: varchar({ length: 255 }),
	last_name: varchar({ length: 255 }),
	email: varchar({ length: 255 }),
	phone_number: varchar({ length: 255 }),
	date_of_birth: date(),
	id_document: varchar({ length: 255 }),
	allergies: text(),
	special_notes: text(),
	willing_to_drive: boolean(),
	role: varchar({ length: 255 }).default('participant'),
	status: varchar({ length: 255 }).default('registered'),
	deposit_paid: boolean().default(false),
	deposit_paid_at: timestamp({ mode: 'string' }),
	full_payment_paid: boolean().default(false),
	full_payment_paid_at: timestamp({ mode: 'string' }),
	terms_accepted: boolean().default(false),
	deposit_email_sent: boolean().default(false),
	final_email_sent: boolean().default(false),
	document_number: text(),
	directus_relations: uuid(),
	access_token: varchar({ length: 255 }),
	document_expiry_date: date(),
	extra_luggage: boolean(),
}, (table) => [
	foreignKey({
			columns: [table.trip_id],
			foreignColumns: [trips.id],
			name: "trip_signups_trip_id_trips_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.directus_relations],
			foreignColumns: [directus_users.id],
			name: "trip_signups_directus_relations_directus_users_id_fk"
		}).onDelete("set null"),
]);

export const trip_activities = pgTable("trip_activities", {
	id: serial().primaryKey().notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }),
	trip_id: integer(),
	name: varchar({ length: 255 }),
	description: text(),
	price: numeric({ precision: 10, scale:  5 }),
	image: uuid(),
	max_participants: integer(),
	is_active: boolean(),
	display_order: integer(),
	options: json().default([]),
	max_selections: integer(),
}, (table) => [
	foreignKey({
			columns: [table.trip_id],
			foreignColumns: [trips.id],
			name: "trip_activities_trip_id_trips_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.image],
			foreignColumns: [directus_files.id],
			name: "trip_activities_image_directus_files_id_fk"
		}).onDelete("set null"),
]);

export const trip_signup_activities = pgTable("trip_signup_activities", {
	id: serial().primaryKey().notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }),
	trip_signup_id: integer(),
	trip_activity_id: integer(),
	selected_options: json(),
}, (table) => [
	foreignKey({
			columns: [table.trip_signup_id],
			foreignColumns: [trip_signups.id],
			name: "trip_signup_activities_trip_signup_id_trip_signups_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.trip_activity_id],
			foreignColumns: [trip_activities.id],
			name: "trip_signup_activities_trip_activity_id_trip_activities_id_fk"
		}).onDelete("set null"),
]);

export const safe_havens = pgTable("safe_havens", {
	id: serial().primaryKey().notNull(),
	contact_name: varchar({ length: 255 }).notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }),
	phone_number: varchar({ length: 20 }),
	image: uuid(),
	user_id: uuid(),
	email: varchar({ length: 255 }),
}, (table) => [
	foreignKey({
			columns: [table.image],
			foreignColumns: [directus_files.id],
			name: "safe_havens_image_directus_files_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.user_id],
			foreignColumns: [directus_users.id],
			name: "safe_havens_user_id_directus_users_id_fk"
		}).onDelete("set null"),
]);

export const sponsors = pgTable("sponsors", {
	sponsor_id: serial().primaryKey().notNull(),
	website_url: varchar({ length: 255 }),
	image: uuid(),
	dark_bg: boolean().default(false),
}, (table) => [
	foreignKey({
			columns: [table.image],
			foreignColumns: [directus_files.id],
			name: "sponsors_image_directus_files_id_fk"
		}).onDelete("set null"),
]);

export const system_logs = pgTable("system_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	type: varchar({ length: 255 }).notNull(),
	status: varchar({ length: 50 }).notNull(),
	payload: jsonb(),
	created_at: timestamp({ mode: 'string' }).defaultNow(),
	acknowledged_at: timestamp({ withTimezone: true, mode: 'string' }),
});

export const clubs = pgTable("clubs", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }),
	whatsapp_link: varchar({ length: 255 }),
	discord_link: varchar({ length: 255 }),
	website_link: varchar({ length: 255 }),
	description: text(),
	image: uuid(),
}, (table) => [
	foreignKey({
			columns: [table.image],
			foreignColumns: [directus_files.id],
			name: "clubs_image_directus_files_id_fk"
		}).onDelete("set null"),
	unique("clubs_name_key").on(table.name),
]);

export const directus_sessions = pgTable("directus_sessions", {
	token: varchar({ length: 64 }).primaryKey().notNull(),
	user: uuid(),
	expires: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	ip: varchar({ length: 255 }),
	user_agent: text(),
	share: uuid(),
	origin: varchar({ length: 255 }),
	next_token: varchar({ length: 64 }),
}, (table) => [
	foreignKey({
			columns: [table.user],
			foreignColumns: [directus_users.id],
			name: "directus_sessions_user_directus_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.share],
			foreignColumns: [directus_shares.id],
			name: "directus_sessions_share_directus_shares_id_fk"
		}).onDelete("cascade"),
]);

export const role_permissions = pgTable("role_permissions", {
	id: serial().primaryKey().notNull(),
	role_id: integer().notNull(),
	permission_id: integer().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.role_id],
			foreignColumns: [roles.id],
			name: "role_permissions_role_id_roles_id_fk"
		}),
	foreignKey({
			columns: [table.permission_id],
			foreignColumns: [permissions.id],
			name: "role_permissions_permission_id_permissions_id_fk"
		}),
	unique("role_permissions_role_id_permission_id_key").on(table.role_id, table.permission_id),
]);

export const transactions = pgTable("transactions", {
	id: serial().primaryKey().notNull(),
	user_id: uuid(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	transaction_id: varchar({ length: 255 }),
	product_name: varchar({ length: 255 }),
	email: varchar({ length: 255 }),
	amount: real(),
	payment_status: varchar({ length: 255 }).default('open'),
	registration: integer(),
	environment: varchar({ length: 255 }),
	approval_status: varchar({ length: 255 }).default('auto_approved'),
	approved_by: uuid(),
	approved_at: timestamp({ mode: 'string' }),
	first_name: varchar({ length: 255 }),
	last_name: varchar({ length: 255 }),
	pub_crawl_signup: integer(),
	trip_signup: integer(),
	coupon_code: varchar({ length: 255 }),
	product_type: varchar({ length: 255 }).notNull(),
	mollie_id: varchar({ length: 255 }).notNull(),
	access_token: uuid(),
	webshop_preorder: integer(),
}, (table) => [
	index("idx_transactions_created_at").using("btree", table.created_at.asc().nullsLast().op("timestamptz_ops")),
	index("idx_transactions_user_id").using("btree", table.user_id.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.user_id],
			foreignColumns: [directus_users.id],
			name: "transactions_user_id_directus_users_id_fk"
		}).onDelete("set default"),
	foreignKey({
			columns: [table.registration],
			foreignColumns: [event_signups.id],
			name: "transactions_registration_event_signups_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.approved_by],
			foreignColumns: [directus_users.id],
			name: "transactions_approved_by_directus_users_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.pub_crawl_signup],
			foreignColumns: [pub_crawl_signups.id],
			name: "transactions_pub_crawl_signup_pub_crawl_signups_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.trip_signup],
			foreignColumns: [trip_signups.id],
			name: "transactions_trip_signup_trip_signups_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.webshop_preorder],
			foreignColumns: [webshop_preorders.id],
			name: "transactions_webshop_preorder_webshop_preorders_id_fk"
		}).onDelete("set null"),
]);

export const auth_accounts = pgTable("auth_accounts", {
	id: text().primaryKey().notNull(),
	account_id: text("account_id", ).notNull(),
	provider_id: text("provider_id", ).notNull(),
	user_id: uuid("user_id", ).notNull(),
	access_token: text("access_token", ),
	refresh_token: text("refresh_token", ),
	id_token: text("id_token", ),
	access_token_expires_at: timestamp("access_token_expires_at", { mode: 'string' }),
	refresh_token_expires_at: timestamp("refresh_token_expires_at", { mode: 'string' }),
	scope: text(),
	password: text(),
	created_at: timestamp("created_at", { mode: 'string' }).notNull(),
	updated_at: timestamp("updated_at", { mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.user_id],
			foreignColumns: [directus_users.id],
			name: "auth_accounts_userId_directus_users_id_fk"
		}).onDelete("cascade"),
]);

export const auth_sessions = pgTable("auth_sessions", {
	id: text().primaryKey().notNull(),
	expires_at: timestamp("expires_at", { mode: 'string' }).notNull(),
	token: text().notNull(),
	created_at: timestamp("created_at", { mode: 'string' }).notNull(),
	updated_at: timestamp("updated_at", { mode: 'string' }).notNull(),
	ip_address: text("ip_address", ),
	user_agent: text("user_agent", ),
	user_id: uuid("user_id", ).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.user_id],
			foreignColumns: [directus_users.id],
			name: "auth_sessions_userId_directus_users_id_fk"
		}).onDelete("cascade"),
	unique("auth_sessions_token_key").on(table.token),
]);

export const verification = pgTable("verification", {
	id: text().primaryKey().notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expires_at: timestamp("expires_at", { mode: 'string' }).notNull(),
	created_at: timestamp("created_at", { mode: 'string' }),
	updated_at: timestamp("updated_at", { mode: 'string' }),
});

export const committee_members = pgTable("committee_members", {
	id: serial().primaryKey().notNull(),
	committee_id: integer().notNull(),
	user_id: uuid(),
	is_visible: boolean().default(true).notNull(),
	is_leader: boolean().default(false).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.committee_id],
			foreignColumns: [committees.id],
			name: "committee_members_committee_id_committees_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.user_id],
			foreignColumns: [directus_users.id],
			name: "committee_members_user_id_directus_users_id_fk"
		}).onDelete("cascade"),
]);

export const feature_flags = pgTable("feature_flags", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	route_match: varchar({ length: 255 }).notNull(),
	is_active: boolean().default(false).notNull(),
	message: text(),
});

export const intro_planning_signups = pgTable("intro_planning_signups", {
	id: serial().primaryKey().notNull(),
	intro_planning_id: integer().notNull(),
	intro_signup_id: integer(),
	user_id: uuid(),
	status: varchar({ length: 50 }).default('registered'),
	attended: boolean().default(false),
	attended_at: timestamp({ mode: 'string' }),
	created_at: timestamp({ mode: 'string' }).defaultNow(),
	updated_at: timestamp({ mode: 'string' }).defaultNow(),
	date_updated: timestamp({ withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_intro_planning_signups_activity").using("btree", table.intro_planning_id.asc().nullsLast().op("int4_ops")),
	index("idx_intro_planning_signups_user").using("btree", table.intro_signup_id.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.intro_planning_id],
			foreignColumns: [intro_planning.id],
			name: "intro_planning_signups_intro_planning_id_intro_planning_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.intro_signup_id],
			foreignColumns: [intro_signups.id],
			name: "intro_planning_signups_intro_signup_id_intro_signups_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.user_id],
			foreignColumns: [directus_users.id],
			name: "intro_planning_signups_user_id_directus_users_id_fk"
		}).onDelete("cascade"),
	unique("intro_planning_signups_intro_planning_id_intro_signup_id_key").on(table.intro_planning_id, table.intro_signup_id),
	unique("intro_planning_signups_intro_planning_id_user_id_key").on(table.intro_planning_id, table.user_id),
]);

export const directus_users = pgTable("directus_users", {
	id: uuid().primaryKey().notNull(),
	first_name: varchar({ length: 50 }),
	last_name: varchar({ length: 50 }),
	email: varchar({ length: 128 }),
	password: varchar({ length: 255 }),
	location: varchar({ length: 255 }),
	title: varchar({ length: 50 }),
	description: text(),
	tags: json(),
	avatar: uuid(),
	language: varchar({ length: 255 }),
	tfa_secret: varchar({ length: 255 }),
	status: varchar({ length: 16 }).default('active').notNull(),
	role: uuid(),
	token: varchar({ length: 255 }),
	last_access: timestamp({ withTimezone: true, mode: 'string' }),
	last_page: varchar({ length: 255 }),
	provider: varchar({ length: 128 }).default('default').notNull(),
	external_identifier: varchar({ length: 255 }),
	auth_data: json(),
	email_notifications: boolean().default(true),
	appearance: varchar({ length: 255 }),
	theme_dark: varchar({ length: 255 }),
	theme_light: varchar({ length: 255 }),
	theme_light_overrides: json(),
	theme_dark_overrides: json(),
	text_direction: varchar({ length: 255 }).default('auto').notNull(),
	entra_id: varchar({ length: 255 }),
	fontys_email: varchar({ length: 255 }),
	phone_number: varchar({ length: 255 }),
	membership_status: varchar({ length: 20 }).default('none'),
	membership_expiry: date(),
	minecraft_username: varchar({ length: 100 }),
	photo_etag: varchar({ length: 255 }),
	date_of_birth: date(),
	originele_betaaldatum: date(),
	emailverified: boolean().default(false),
	image: text(),
	name: text(),
	createdat: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	updatedat: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_directus_users_entra_id").using("btree", table.entra_id.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.role],
			foreignColumns: [directus_roles.id],
			name: "directus_users_role_directus_roles_id_fk"
		}).onDelete("set null"),
	unique("directus_users_email_unique").on(table.email),
	unique("directus_users_token_unique").on(table.token),
	unique("directus_users_external_identifier_unique").on(table.external_identifier),
]);

export const directus_deployments = pgTable("directus_deployments", {
	id: uuid().primaryKey().notNull(),
	provider: varchar({ length: 255 }).notNull(),
	credentials: text(),
	options: text(),
	date_created: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	user_created: uuid(),
	webhook_ids: json(),
	webhook_secret: varchar({ length: 255 }),
	last_synced_at: timestamp({ withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.user_created],
			foreignColumns: [directus_users.id],
			name: "directus_deployments_user_created_directus_users_id_fk"
		}).onDelete("set null"),
	unique("directus_deployments_provider_unique").on(table.provider),
]);

export const webshop_product_media = pgTable("webshop_product_media", {
	id: serial().primaryKey().notNull(),
	product_id: integer().notNull(),
	asset: uuid().notNull(),
	display_order: integer().default(0),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_webshop_product_media_product").using("btree", table.product_id.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.product_id],
			foreignColumns: [webshop_products.id],
			name: "webshop_product_media_product_id_webshop_products_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.asset],
			foreignColumns: [directus_files.id],
			name: "webshop_product_media_asset_directus_files_id_fk"
		}).onDelete("cascade"),
]);

export const directus_deployment_projects = pgTable("directus_deployment_projects", {
	id: uuid().primaryKey().notNull(),
	deployment: uuid().notNull(),
	external_id: varchar({ length: 255 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	date_created: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	user_created: uuid(),
	url: varchar({ length: 255 }),
	framework: varchar({ length: 255 }),
	deployable: boolean().default(true).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.deployment],
			foreignColumns: [directus_deployments.id],
			name: "directus_deployment_projects_deployment_directus_deployments_id"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.user_created],
			foreignColumns: [directus_users.id],
			name: "directus_deployment_projects_user_created_directus_users_id_fk"
		}).onDelete("set null"),
	unique("directus_deployment_projects_deployment_external_id_unique").on(table.deployment, table.external_id),
]);

export const directus_settings = pgTable("directus_settings", {
	id: serial().primaryKey().notNull(),
	project_name: varchar({ length: 100 }).default('Directus').notNull(),
	project_url: varchar({ length: 255 }),
	project_color: varchar({ length: 255 }).default('#6644FF').notNull(),
	project_logo: uuid(),
	public_foreground: uuid(),
	public_background: uuid(),
	public_note: text(),
	auth_login_attempts: integer().default(25),
	auth_password_policy: varchar({ length: 100 }),
	storage_asset_transform: varchar({ length: 7 }).default('all'),
	storage_asset_presets: json(),
	custom_css: text(),
	storage_default_folder: uuid(),
	basemaps: json(),
	mapbox_key: varchar({ length: 255 }),
	module_bar: json(),
	project_descriptor: varchar({ length: 100 }),
	default_language: varchar({ length: 255 }).default('en-US').notNull(),
	custom_aspect_ratios: json(),
	public_favicon: uuid(),
	default_appearance: varchar({ length: 255 }).default('auto').notNull(),
	default_theme_light: varchar({ length: 255 }),
	theme_light_overrides: json(),
	default_theme_dark: varchar({ length: 255 }),
	theme_dark_overrides: json(),
	report_error_url: varchar({ length: 255 }),
	report_bug_url: varchar({ length: 255 }),
	report_feature_url: varchar({ length: 255 }),
	public_registration: boolean().default(false).notNull(),
	public_registration_verify_email: boolean().default(true).notNull(),
	public_registration_role: uuid(),
	public_registration_email_filter: json(),
	visual_editor_urls: json(),
	project_id: uuid(),
	mcp_enabled: boolean().default(false).notNull(),
	mcp_allow_deletes: boolean().default(false).notNull(),
	mcp_prompts_collection: varchar({ length: 255 }),
	mcp_system_prompt_enabled: boolean().default(true).notNull(),
	mcp_system_prompt: text(),
	project_owner: varchar({ length: 255 }),
	project_usage: varchar({ length: 255 }),
	org_name: varchar({ length: 255 }),
	product_updates: boolean(),
	project_status: varchar({ length: 255 }),
	ai_openai_api_key: text(),
	ai_anthropic_api_key: text(),
	ai_system_prompt: text(),
	ai_google_api_key: text(),
	ai_openai_compatible_api_key: text(),
	ai_openai_compatible_base_url: text(),
	ai_openai_compatible_name: text(),
	ai_openai_compatible_models: json(),
	ai_openai_compatible_headers: json(),
	ai_openai_allowed_models: json(),
	ai_anthropic_allowed_models: json(),
	ai_google_allowed_models: json(),
	collaborative_editing_enabled: boolean().default(false).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.project_logo],
			foreignColumns: [directus_files.id],
			name: "directus_settings_project_logo_directus_files_id_fk"
		}),
	foreignKey({
			columns: [table.public_foreground],
			foreignColumns: [directus_files.id],
			name: "directus_settings_public_foreground_directus_files_id_fk"
		}),
	foreignKey({
			columns: [table.public_background],
			foreignColumns: [directus_files.id],
			name: "directus_settings_public_background_directus_files_id_fk"
		}),
	foreignKey({
			columns: [table.storage_default_folder],
			foreignColumns: [directus_folders.id],
			name: "directus_settings_storage_default_folder_directus_folders_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.public_favicon],
			foreignColumns: [directus_files.id],
			name: "directus_settings_public_favicon_directus_files_id_fk"
		}),
	foreignKey({
			columns: [table.public_registration_role],
			foreignColumns: [directus_roles.id],
			name: "directus_settings_public_registration_role_directus_roles_id_fk"
		}).onDelete("set null"),
]);

export const directus_deployment_runs = pgTable("directus_deployment_runs", {
	id: uuid().primaryKey().notNull(),
	project: uuid().notNull(),
	external_id: varchar({ length: 255 }).notNull(),
	target: varchar({ length: 255 }).notNull(),
	date_created: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	user_created: uuid(),
	status: varchar({ length: 255 }),
	url: varchar({ length: 255 }),
	started_at: timestamp({ withTimezone: true, mode: 'string' }),
	completed_at: timestamp({ withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.project],
			foreignColumns: [directus_deployment_projects.id],
			name: "directus_deployment_runs_project_directus_deployment_projects_i"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.user_created],
			foreignColumns: [directus_users.id],
			name: "directus_deployment_runs_user_created_directus_users_id_fk"
		}).onDelete("set null"),
]);

export const webshop_product_variants = pgTable("webshop_product_variants", {
	id: serial().primaryKey().notNull(),
	product_id: integer().notNull(),
	size: varchar({ length: 255 }),
	color: varchar({ length: 255 }),
	sku: varchar({ length: 255 }),
	is_active: boolean().default(true),
	display_order: integer().default(0),
}, (table) => [
	index("idx_webshop_product_variants_product").using("btree", table.product_id.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.product_id],
			foreignColumns: [webshop_products.id],
			name: "webshop_product_variants_product_id_webshop_products_id_fk"
		}).onDelete("cascade"),
]);

export const webshop_drop_windows = pgTable("webshop_drop_windows", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	status: varchar({ length: 255 }).default('draft'),
	opens_at: timestamp({ withTimezone: true, mode: 'string' }),
	closes_at: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
});

export const webshop_preorders = pgTable("webshop_preorders", {
	id: serial().primaryKey().notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	user_id: uuid(),
	drop_window_id: integer(),
	first_name: varchar({ length: 255 }).notNull(),
	last_name: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	phone_number: varchar({ length: 255 }),
	status: varchar({ length: 255 }).default('awaiting_deposit'),
	subtotal_amount: numeric({ precision: 10, scale:  5 }).notNull(),
	deposit_amount: numeric({ precision: 10, scale:  5 }).notNull(),
	deposit_paid: boolean().default(false),
	deposit_paid_at: timestamp({ withTimezone: true, mode: 'string' }),
	final_payment_paid: boolean().default(false),
	final_payment_paid_at: timestamp({ withTimezone: true, mode: 'string' }),
	terms_accepted: boolean().default(false),
	pickup_notes: text(),
	access_token: varchar({ length: 255 }),
}, (table) => [
	index("idx_webshop_preorders_drop_window").using("btree", table.drop_window_id.asc().nullsLast().op("int4_ops")),
	index("idx_webshop_preorders_user").using("btree", table.user_id.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.user_id],
			foreignColumns: [directus_users.id],
			name: "webshop_preorders_user_id_directus_users_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.drop_window_id],
			foreignColumns: [webshop_drop_windows.id],
			name: "webshop_preorders_drop_window_id_webshop_drop_windows_id_fk"
		}).onDelete("set null"),
]);

export const webshop_preorder_lines = pgTable("webshop_preorder_lines", {
	id: serial().primaryKey().notNull(),
	preorder_id: integer().notNull(),
	product_id: integer(),
	variant_id: integer(),
	quantity: integer().default(1).notNull(),
	unit_price: numeric({ precision: 10, scale:  5 }).notNull(),
	product_name_snapshot: varchar({ length: 255 }),
	variant_label_snapshot: varchar({ length: 255 }),
}, (table) => [
	index("idx_webshop_preorder_lines_preorder").using("btree", table.preorder_id.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.preorder_id],
			foreignColumns: [webshop_preorders.id],
			name: "webshop_preorder_lines_preorder_id_webshop_preorders_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.product_id],
			foreignColumns: [webshop_products.id],
			name: "webshop_preorder_lines_product_id_webshop_products_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.variant_id],
			foreignColumns: [webshop_product_variants.id],
			name: "webshop_preorder_lines_variant_id_webshop_product_variants_id_f"
		}).onDelete("set null"),
]);

export const webshop_products = pgTable("webshop_products", {
	id: serial().primaryKey().notNull(),
	drop_window_id: integer(),
	type: varchar({ length: 255 }).default('item').notNull(),
	name: varchar({ length: 255 }).notNull(),
	slug: varchar({ length: 255 }).notNull(),
	description: text(),
	price: numeric({ precision: 10, scale:  5 }).notNull(),
	deposit_amount: numeric({ precision: 10, scale:  5 }).notNull(),
	size_chart: jsonb(),
	is_active: boolean().default(true),
	display_order: integer().default(0),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_webshop_products_drop_window").using("btree", table.drop_window_id.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.drop_window_id],
			foreignColumns: [webshop_drop_windows.id],
			name: "webshop_products_drop_window_id_webshop_drop_windows_id_fk"
		}).onDelete("set null"),
	unique("uq_webshop_products_slug").on(table.slug),
]);

// --- Bijbanenbank (vacancy board) tables ---
// PROVISIONAL: hand-written to match what `drizzle-kit pull` should produce once the
// collections described in packages/db/BIJBANENBANK_DIRECTUS_SETUP.md exist in Directus.
// Run `pnpm db:sync` after applying that guide and replace this block with the real
// introspected output (column order / generated constraint names may differ slightly).

export const vacancy_ict_directions = pgTable("vacancy_ict_directions", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	slug: varchar({ length: 255 }).notNull(),
}, (table) => [
	unique("vacancy_ict_directions_name_unique").on(table.name),
	unique("vacancy_ict_directions_slug_unique").on(table.slug),
]);

export const vacancies = pgTable("vacancies", {
	id: serial().primaryKey().notNull(),
	title: varchar({ length: 255 }).notNull(),
	company: varchar({ length: 255 }).notNull(),
	description: text().notNull(),
	type: varchar({ length: 20 }).notNull(),
	contact_email: varchar({ length: 255 }).notNull(),
	contact_phone: varchar({ length: 50 }),
	contact_website: varchar({ length: 500 }),
	location: varchar({ length: 255 }).notNull(),
	salary: varchar({ length: 255 }),
	employment_type: varchar({ length: 100 }),
	working_hours: varchar({ length: 255 }),
	is_visible: boolean().default(true).notNull(),
	published_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	image: uuid(),
	document: uuid(),
	skills: jsonb().default([]),
	created_by: uuid(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.created_by],
			foreignColumns: [directus_users.id],
			name: "vacancies_created_by_directus_users_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.image],
			foreignColumns: [directus_files.id],
			name: "vacancies_image_directus_files_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.document],
			foreignColumns: [directus_files.id],
			name: "vacancies_document_directus_files_id_fk"
		}).onDelete("set null"),
]);

export const vacancy_direction_links = pgTable("vacancy_direction_links", {
	id: serial().primaryKey().notNull(),
	vacancies_id: integer().notNull(),
	vacancy_ict_directions_id: integer().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.vacancies_id],
			foreignColumns: [vacancies.id],
			name: "vacancy_direction_links_vacancies_id_vacancies_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.vacancy_ict_directions_id],
			foreignColumns: [vacancy_ict_directions.id],
			name: "vacancy_direction_links_vacancy_ict_directions_id_vacancy_ict_directions_id_fk"
		}).onDelete("cascade"),
	unique("vacancy_direction_links_vacancies_id_vacancy_ict_directions_id_unique").on(table.vacancies_id, table.vacancy_ict_directions_id),
]);

export const vacancy_submissions = pgTable("vacancy_submissions", {
	id: serial().primaryKey().notNull(),
	title: varchar({ length: 255 }).notNull(),
	company: varchar({ length: 255 }).notNull(),
	description: text().notNull(),
	type: varchar({ length: 20 }).notNull(),
	contact_email: varchar({ length: 255 }).notNull(),
	contact_phone: varchar({ length: 50 }),
	contact_website: varchar({ length: 500 }),
	location: varchar({ length: 255 }).notNull(),
	salary: varchar({ length: 255 }),
	employment_type: varchar({ length: 100 }),
	working_hours: varchar({ length: 255 }),
	status: varchar({ length: 30 }).default('pending_verification').notNull(),
	rejection_reason: text(),
	reviewed_by: uuid(),
	reviewed_at: timestamp({ withTimezone: true, mode: 'string' }),
	approved_vacancy_id: integer(),
	submitter_ip: varchar({ length: 64 }),
	verified_at: timestamp({ withTimezone: true, mode: 'string' }),
	image: uuid(),
	document: uuid(),
	skills: jsonb().default([]),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.reviewed_by],
			foreignColumns: [directus_users.id],
			name: "vacancy_submissions_reviewed_by_directus_users_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.approved_vacancy_id],
			foreignColumns: [vacancies.id],
			name: "vacancy_submissions_approved_vacancy_id_vacancies_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.image],
			foreignColumns: [directus_files.id],
			name: "vacancy_submissions_image_directus_files_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.document],
			foreignColumns: [directus_files.id],
			name: "vacancy_submissions_document_directus_files_id_fk"
		}).onDelete("set null"),
]);

export const vacancy_submission_direction_links_ = pgTable("vacancy_submission_direction_links_", {
	id: serial().primaryKey().notNull(),
	vacancy_submissions_id: integer().notNull(),
	vacancy_ict_directions_id: integer().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.vacancy_submissions_id],
			foreignColumns: [vacancy_submissions.id],
			name: "vacancy_submission_direction_links__vacancy_submissions_id_vacancy_submissions_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.vacancy_ict_directions_id],
			foreignColumns: [vacancy_ict_directions.id],
			name: "vacancy_submission_direction_links__vacancy_ict_directions_id_vacancy_ict_directions_id_fk"
		}).onDelete("cascade"),
	unique("vacancy_submission_direction_links__vacancy_submissions_id_vacancy_ict_directions_id_unique").on(table.vacancy_submissions_id, table.vacancy_ict_directions_id),
]);

export const vacancy_verification_tokens = pgTable("vacancy_verification_tokens", {
	id: serial().primaryKey().notNull(),
	submission_id: integer().notNull(),
	token: varchar({ length: 255 }).notNull(),
	expires_at: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	used_at: timestamp({ withTimezone: true, mode: 'string' }),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.submission_id],
			foreignColumns: [vacancy_submissions.id],
			name: "vacancy_verification_tokens_submission_id_vacancy_submissions_id_fk"
		}).onDelete("cascade"),
	unique("vacancy_verification_tokens_token_unique").on(table.token),
]);
