import { pgTable, index, foreignKey, integer, boolean, serial, uuid, timestamp, varchar, text, doublePrecision, unique, json, real, bigint, date, numeric, time, inet, jsonb, bigserial } from "drizzle-orm/pg-core"



export const club_members = pgTable("club_members", {
	club_id: integer("club_id").notNull().references(() => clubs.id),
	is_visible: boolean("is_visible").default(true).notNull(),
	is_leader: boolean("is_leader").default(false).notNull(),
	id: serial("id").primaryKey().notNull(),
},
(table) => {
	return {
		idx_club_members_club_id: index("idx_club_members_club_id").on(table.club_id),
	}
});

export const Stickers = pgTable("Stickers", {
	id: serial("id").primaryKey().notNull(),
	user_created: uuid("user_created").references(() => directus_users.id, { onDelete: "set default" } ),
	date_created: timestamp("date_created", { withTimezone: true, mode: 'string' }),
	user_updated: uuid("user_updated").references(() => directus_users.id, { onDelete: "set default" } ),
	date_updated: timestamp("date_updated", { withTimezone: true, mode: 'string' }),
	location_name: varchar("location_name", { length: 255 }),
	address: text("address"),
	latitude: doublePrecision("latitude"),
	longitude: doublePrecision("longitude"),
	description: text("description"),
	country: varchar("country", { length: 255 }),
	city: varchar("city", { length: 255 }),
	image: uuid("image").references(() => directus_files.id, { onDelete: "set null" } ),
	status: varchar("status", { length: 255 }).default('draft'),
});

export const Board = pgTable("Board", {
	id: serial("id").primaryKey().notNull(),
	user_created: uuid("user_created").references(() => directus_users.id),
	date_created: timestamp("date_created", { withTimezone: true, mode: 'string' }),
	user_updated: uuid("user_updated").references(() => directus_users.id),
	date_updated: timestamp("date_updated", { withTimezone: true, mode: 'string' }),
	image: uuid("image").references(() => directus_files.id, { onDelete: "set null" } ),
	naam: varchar("naam", { length: 255 }),
	year: varchar("year", { length: 255 }),
});

export const Board_Members = pgTable("Board_Members", {
	id: serial("id").primaryKey().notNull(),
	date_created: timestamp("date_created", { withTimezone: true, mode: 'string' }),
	date_updated: timestamp("date_updated", { withTimezone: true, mode: 'string' }),
	board_id: integer("board_id").references(() => Board.id, { onDelete: "set null" } ),
	functie: varchar("functie", { length: 255 }),
	user_id: uuid("user_id").references(() => directus_users.id, { onDelete: "set null" } ),
	name: varchar("name", { length: 255 }),
});

export const contacts = pgTable("contacts", {
	id: serial("id").primaryKey().notNull(),
	title: varchar("title", { length: 255 }).notNull(),
	name: varchar("name", { length: 255 }).notNull(),
	email: varchar("email", { length: 255 }).notNull(),
	phone_number: varchar("phone_number", { length: 50 }),
	description: text("description"),
	is_active: boolean("is_active").default(true).notNull(),
	display_order: integer("display_order").default(0).notNull(),
	created_at: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	image: uuid("image").references(() => directus_files.id, { onDelete: "set null" } ),
},
(table) => {
	return {
		idx_contacts_display_order: index("idx_contacts_display_order").on(table.is_active, table.display_order),
	}
});

export const directus_access = pgTable("directus_access", {
	id: uuid("id").primaryKey().notNull(),
	role: uuid("role").references(() => directus_roles.id, { onDelete: "cascade" } ),
	user: uuid("user").references(() => directus_users.id, { onDelete: "cascade" } ),
	policy: uuid("policy").notNull().references(() => directus_policies.id, { onDelete: "cascade" } ),
	sort: integer("sort"),
});

export const committees = pgTable("committees", {
	id: serial("id").primaryKey().notNull(),
	name: varchar("name", { length: 255 }).notNull(),
	created_at: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	image: uuid("image").references(() => directus_files.id, { onDelete: "set null" } ),
	is_visible: boolean("is_visible").default(false),
	short_description: text("short_description"),
	description: text("description"),
	email: varchar("email", { length: 255 }),
	commissie_token: varchar("commissie_token", { length: 10 }),
	azure_group_id: varchar("azure_group_id", { length: 255 }),
},
(table) => {
	return {
		committees_name_key: unique("committees_name_key").on(table.name),
		committees_commissie_token_unique: unique("committees_commissie_token_unique").on(table.commissie_token),
	}
});

export const directus_comments = pgTable("directus_comments", {
	id: uuid("id").primaryKey().notNull(),
	collection: varchar("collection", { length: 64 }).notNull(),
	item: varchar("item", { length: 255 }).notNull(),
	comment: text("comment").notNull(),
	date_created: timestamp("date_created", { withTimezone: true, mode: 'string' }).defaultNow(),
	date_updated: timestamp("date_updated", { withTimezone: true, mode: 'string' }).defaultNow(),
	user_created: uuid("user_created").references(() => directus_users.id, { onDelete: "set null" } ),
	user_updated: uuid("user_updated").references(() => directus_users.id),
});

export const directus_dashboards = pgTable("directus_dashboards", {
	id: uuid("id").primaryKey().notNull(),
	name: varchar("name", { length: 255 }).notNull(),
	icon: varchar("icon", { length: 64 }).default('dashboard').notNull(),
	note: text("note"),
	date_created: timestamp("date_created", { withTimezone: true, mode: 'string' }).defaultNow(),
	user_created: uuid("user_created").references(() => directus_users.id, { onDelete: "set null" } ),
	color: varchar("color", { length: 255 }),
});

export const directus_folders = pgTable("directus_folders", {
	id: uuid("id").primaryKey().notNull(),
	name: varchar("name", { length: 255 }).notNull(),
	parent: uuid("parent"),
},
(table) => {
	return {
		directus_folders_parent_foreign: foreignKey({
			columns: [table.parent],
			foreignColumns: [table.id],
			name: "directus_folders_parent_foreign"
		}),
	}
});

export const directus_extensions = pgTable("directus_extensions", {
	enabled: boolean("enabled").default(true).notNull(),
	id: uuid("id").primaryKey().notNull(),
	folder: varchar("folder", { length: 255 }).notNull(),
	source: varchar("source", { length: 255 }).notNull(),
	bundle: uuid("bundle"),
});

export const directus_fields = pgTable("directus_fields", {
	id: serial("id").primaryKey().notNull(),
	collection: varchar("collection", { length: 64 }).notNull(),
	field: varchar("field", { length: 64 }).notNull(),
	special: varchar("special", { length: 64 }),
	interface: varchar("interface", { length: 64 }),
	options: json("options"),
	display: varchar("display", { length: 64 }),
	display_options: json("display_options"),
	readonly: boolean("readonly").default(false).notNull(),
	hidden: boolean("hidden").default(false).notNull(),
	sort: integer("sort"),
	width: varchar("width", { length: 30 }).default('full'),
	translations: json("translations"),
	note: text("note"),
	conditions: json("conditions"),
	required: boolean("required").default(false),
	group: varchar("group", { length: 64 }),
	validation: json("validation"),
	validation_message: text("validation_message"),
	searchable: boolean("searchable").default(true).notNull(),
});

export const coupons = pgTable("coupons", {
	id: serial("id").primaryKey().notNull(),
	coupon_code: varchar("coupon_code", { length: 255 }),
	discount_type: varchar("discount_type", { length: 255 }).default('fixed'),
	usage_limit: integer("usage_limit"),
	usage_count: integer("usage_count").default(0).notNull(),
	is_active: boolean("is_active").default(true),
	valid_from: timestamp("valid_from", { mode: 'string' }),
	valid_until: timestamp("valid_until", { mode: 'string' }),
	discount_value: real("discount_value"),
	date_created: timestamp("date_created", { mode: 'string' }),
},
(table) => {
	return {
		coupons_coupon_code_unique: unique("coupons_coupon_code_unique").on(table.coupon_code),
	}
});

export const directus_activity = pgTable("directus_activity", {
	id: serial("id").primaryKey().notNull(),
	action: varchar("action", { length: 45 }).notNull(),
	user: uuid("user"),
	timestamp: timestamp("timestamp", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	ip: varchar("ip", { length: 50 }),
	user_agent: text("user_agent"),
	collection: varchar("collection", { length: 64 }).notNull(),
	item: varchar("item", { length: 255 }).notNull(),
	origin: varchar("origin", { length: 255 }),
},
(table) => {
	return {
		timestamp_idx: index().on(table.timestamp),
	}
});

export const directus_migrations = pgTable("directus_migrations", {
	version: varchar("version", { length: 255 }).primaryKey().notNull(),
	name: varchar("name", { length: 255 }).notNull(),
	timestamp: timestamp("timestamp", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const directus_files = pgTable("directus_files", {
	id: uuid("id").primaryKey().notNull(),
	storage: varchar("storage", { length: 255 }).notNull(),
	filename_disk: varchar("filename_disk", { length: 255 }),
	filename_download: varchar("filename_download", { length: 255 }).notNull(),
	title: varchar("title", { length: 255 }),
	type: varchar("type", { length: 255 }),
	folder: uuid("folder").references(() => directus_folders.id, { onDelete: "set null" } ),
	uploaded_by: uuid("uploaded_by").references(() => directus_users.id, { onDelete: "set null" } ),
	created_on: timestamp("created_on", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	modified_by: uuid("modified_by").references(() => directus_users.id, { onDelete: "set null" } ),
	modified_on: timestamp("modified_on", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	charset: varchar("charset", { length: 50 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	filesize: bigint("filesize", { mode: "number" }),
	width: integer("width"),
	height: integer("height"),
	duration: integer("duration"),
	embed: varchar("embed", { length: 200 }),
	description: text("description"),
	location: text("location"),
	tags: text("tags"),
	metadata: json("metadata"),
	focal_point_x: integer("focal_point_x"),
	focal_point_y: integer("focal_point_y"),
	tus_id: varchar("tus_id", { length: 64 }),
	tus_data: json("tus_data"),
	uploaded_on: timestamp("uploaded_on", { withTimezone: true, mode: 'string' }),
});

export const directus_collections = pgTable("directus_collections", {
	collection: varchar("collection", { length: 64 }).primaryKey().notNull(),
	icon: varchar("icon", { length: 64 }),
	note: text("note"),
	display_template: varchar("display_template", { length: 255 }),
	hidden: boolean("hidden").default(false).notNull(),
	singleton: boolean("singleton").default(false).notNull(),
	translations: json("translations"),
	archive_field: varchar("archive_field", { length: 64 }),
	archive_app_filter: boolean("archive_app_filter").default(true).notNull(),
	archive_value: varchar("archive_value", { length: 255 }),
	unarchive_value: varchar("unarchive_value", { length: 255 }),
	sort_field: varchar("sort_field", { length: 64 }),
	accountability: varchar("accountability", { length: 255 }).default('all'),
	color: varchar("color", { length: 255 }),
	item_duplication_fields: json("item_duplication_fields"),
	sort: integer("sort"),
	group: varchar("group", { length: 64 }),
	collapse: varchar("collapse", { length: 255 }).default('open').notNull(),
	preview_url: varchar("preview_url", { length: 255 }),
	versioning: boolean("versioning").default(false).notNull(),
},
(table) => {
	return {
		directus_collections_group_foreign: foreignKey({
			columns: [table.group],
			foreignColumns: [table.collection],
			name: "directus_collections_group_foreign"
		}),
	}
});

export const directus_flows = pgTable("directus_flows", {
	id: uuid("id").primaryKey().notNull(),
	name: varchar("name", { length: 255 }).notNull(),
	icon: varchar("icon", { length: 64 }),
	color: varchar("color", { length: 255 }),
	description: text("description"),
	status: varchar("status", { length: 255 }).default('active').notNull(),
	trigger: varchar("trigger", { length: 255 }),
	accountability: varchar("accountability", { length: 255 }).default('all'),
	options: json("options"),
	operation: uuid("operation"),
	date_created: timestamp("date_created", { withTimezone: true, mode: 'string' }).defaultNow(),
	user_created: uuid("user_created").references(() => directus_users.id, { onDelete: "set null" } ),
},
(table) => {
	return {
		directus_flows_operation_unique: unique("directus_flows_operation_unique").on(table.operation),
	}
});

export const directus_panels = pgTable("directus_panels", {
	id: uuid("id").primaryKey().notNull(),
	dashboard: uuid("dashboard").notNull().references(() => directus_dashboards.id, { onDelete: "cascade" } ),
	name: varchar("name", { length: 255 }),
	icon: varchar("icon", { length: 64 }),
	color: varchar("color", { length: 10 }),
	show_header: boolean("show_header").default(false).notNull(),
	note: text("note"),
	type: varchar("type", { length: 255 }).notNull(),
	position_x: integer("position_x").notNull(),
	position_y: integer("position_y").notNull(),
	width: integer("width").notNull(),
	height: integer("height").notNull(),
	options: json("options"),
	date_created: timestamp("date_created", { withTimezone: true, mode: 'string' }).defaultNow(),
	user_created: uuid("user_created").references(() => directus_users.id, { onDelete: "set null" } ),
});

export const directus_permissions = pgTable("directus_permissions", {
	id: serial("id").primaryKey().notNull(),
	collection: varchar("collection", { length: 64 }).notNull(),
	action: varchar("action", { length: 10 }).notNull(),
	permissions: json("permissions"),
	validation: json("validation"),
	presets: json("presets"),
	fields: text("fields"),
	policy: uuid("policy").notNull().references(() => directus_policies.id, { onDelete: "cascade" } ),
});

export const directus_presets = pgTable("directus_presets", {
	id: serial("id").primaryKey().notNull(),
	bookmark: varchar("bookmark", { length: 255 }),
	user: uuid("user").references(() => directus_users.id, { onDelete: "cascade" } ),
	role: uuid("role").references(() => directus_roles.id, { onDelete: "cascade" } ),
	collection: varchar("collection", { length: 64 }),
	search: varchar("search", { length: 100 }),
	layout: varchar("layout", { length: 100 }).default('tabular'),
	layout_query: json("layout_query"),
	layout_options: json("layout_options"),
	refresh_interval: integer("refresh_interval"),
	filter: json("filter"),
	icon: varchar("icon", { length: 64 }).default('bookmark'),
	color: varchar("color", { length: 255 }),
});

export const directus_roles = pgTable("directus_roles", {
	id: uuid("id").primaryKey().notNull(),
	name: varchar("name", { length: 100 }).notNull(),
	icon: varchar("icon", { length: 64 }).default('supervised_user_circle').notNull(),
	description: text("description"),
	parent: uuid("parent"),
},
(table) => {
	return {
		directus_roles_parent_foreign: foreignKey({
			columns: [table.parent],
			foreignColumns: [table.id],
			name: "directus_roles_parent_foreign"
		}),
	}
});

export const directus_revisions = pgTable("directus_revisions", {
	id: serial("id").primaryKey().notNull(),
	activity: integer("activity").notNull().references(() => directus_activity.id, { onDelete: "cascade" } ),
	collection: varchar("collection", { length: 64 }).notNull(),
	item: varchar("item", { length: 255 }).notNull(),
	data: json("data"),
	delta: json("delta"),
	parent: integer("parent"),
	version: uuid("version").references(() => directus_versions.id, { onDelete: "cascade" } ),
},
(table) => {
	return {
		parent_idx: index().on(table.parent),
		activity_idx: index().on(table.activity),
		directus_revisions_parent_foreign: foreignKey({
			columns: [table.parent],
			foreignColumns: [table.id],
			name: "directus_revisions_parent_foreign"
		}),
	}
});

export const directus_relations = pgTable("directus_relations", {
	id: serial("id").primaryKey().notNull(),
	many_collection: varchar("many_collection", { length: 64 }).notNull(),
	many_field: varchar("many_field", { length: 64 }).notNull(),
	one_collection: varchar("one_collection", { length: 64 }),
	one_field: varchar("one_field", { length: 64 }),
	one_collection_field: varchar("one_collection_field", { length: 64 }),
	one_allowed_collections: text("one_allowed_collections"),
	junction_field: varchar("junction_field", { length: 64 }),
	sort_field: varchar("sort_field", { length: 64 }),
	one_deselect_action: varchar("one_deselect_action", { length: 255 }).default('nullify').notNull(),
});

export const directus_shares = pgTable("directus_shares", {
	id: uuid("id").primaryKey().notNull(),
	name: varchar("name", { length: 255 }),
	collection: varchar("collection", { length: 64 }).notNull().references(() => directus_collections.collection, { onDelete: "cascade" } ),
	item: varchar("item", { length: 255 }).notNull(),
	role: uuid("role").references(() => directus_roles.id, { onDelete: "cascade" } ),
	password: varchar("password", { length: 255 }),
	user_created: uuid("user_created").references(() => directus_users.id, { onDelete: "set null" } ),
	date_created: timestamp("date_created", { withTimezone: true, mode: 'string' }).defaultNow(),
	date_start: timestamp("date_start", { withTimezone: true, mode: 'string' }),
	date_end: timestamp("date_end", { withTimezone: true, mode: 'string' }),
	times_used: integer("times_used").default(0),
	max_uses: integer("max_uses"),
});

export const directus_notifications = pgTable("directus_notifications", {
	id: serial("id").primaryKey().notNull(),
	timestamp: timestamp("timestamp", { withTimezone: true, mode: 'string' }).defaultNow(),
	status: varchar("status", { length: 255 }).default('inbox'),
	recipient: uuid("recipient").notNull().references(() => directus_users.id, { onDelete: "cascade" } ),
	sender: uuid("sender").references(() => directus_users.id),
	subject: varchar("subject", { length: 255 }).notNull(),
	message: text("message"),
	collection: varchar("collection", { length: 64 }),
	item: varchar("item", { length: 255 }),
});

export const directus_policies = pgTable("directus_policies", {
	id: uuid("id").primaryKey().notNull(),
	name: varchar("name", { length: 100 }).notNull(),
	icon: varchar("icon", { length: 64 }).default('badge').notNull(),
	description: text("description"),
	ip_access: text("ip_access"),
	enforce_tfa: boolean("enforce_tfa").default(false).notNull(),
	admin_access: boolean("admin_access").default(false).notNull(),
	app_access: boolean("app_access").default(false).notNull(),
});

export const directus_operations = pgTable("directus_operations", {
	id: uuid("id").primaryKey().notNull(),
	name: varchar("name", { length: 255 }),
	key: varchar("key", { length: 255 }).notNull(),
	type: varchar("type", { length: 255 }).notNull(),
	position_x: integer("position_x").notNull(),
	position_y: integer("position_y").notNull(),
	options: json("options"),
	resolve: uuid("resolve"),
	reject: uuid("reject"),
	flow: uuid("flow").notNull().references(() => directus_flows.id, { onDelete: "cascade" } ),
	date_created: timestamp("date_created", { withTimezone: true, mode: 'string' }).defaultNow(),
	user_created: uuid("user_created").references(() => directus_users.id, { onDelete: "set null" } ),
},
(table) => {
	return {
		directus_operations_reject_foreign: foreignKey({
			columns: [table.reject],
			foreignColumns: [table.id],
			name: "directus_operations_reject_foreign"
		}),
		directus_operations_resolve_foreign: foreignKey({
			columns: [table.resolve],
			foreignColumns: [table.id],
			name: "directus_operations_resolve_foreign"
		}),
		directus_operations_resolve_unique: unique("directus_operations_resolve_unique").on(table.resolve),
		directus_operations_reject_unique: unique("directus_operations_reject_unique").on(table.reject),
	}
});

export const directus_translations = pgTable("directus_translations", {
	id: uuid("id").primaryKey().notNull(),
	language: varchar("language", { length: 255 }).notNull(),
	key: varchar("key", { length: 255 }).notNull(),
	value: text("value").notNull(),
});

export const directus_versions = pgTable("directus_versions", {
	id: uuid("id").primaryKey().notNull(),
	key: varchar("key", { length: 64 }).notNull(),
	name: varchar("name", { length: 255 }),
	collection: varchar("collection", { length: 64 }).notNull().references(() => directus_collections.collection, { onDelete: "cascade" } ),
	item: varchar("item", { length: 255 }).notNull(),
	hash: varchar("hash", { length: 255 }),
	date_created: timestamp("date_created", { withTimezone: true, mode: 'string' }).defaultNow(),
	date_updated: timestamp("date_updated", { withTimezone: true, mode: 'string' }).defaultNow(),
	user_created: uuid("user_created").references(() => directus_users.id, { onDelete: "set null" } ),
	user_updated: uuid("user_updated").references(() => directus_users.id),
	delta: json("delta"),
});

export const documents = pgTable("documents", {
	id: serial("id").primaryKey().notNull(),
	title: varchar("title", { length: 255 }).notNull(),
	description: text("description"),
	category: varchar("category", { length: 100 }),
	is_active: boolean("is_active").default(true).notNull(),
	display_order: integer("display_order").default(0).notNull(),
	created_at: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	file: uuid("file").references(() => directus_files.id, { onDelete: "set null" } ),
},
(table) => {
	return {
		idx_documents_active_order: index("idx_documents_active_order").on(table.is_active, table.display_order),
		idx_documents_category: index("idx_documents_category").on(table.category),
	}
});

export const events = pgTable("events", {
	id: serial("id").primaryKey().notNull(),
	name: varchar("name", { length: 255 }).notNull(),
	event_date: date("event_date").notNull(),
	description: text("description"),
	description_logged_in: text("description_logged_in"),
	price_members: numeric("price_members", { precision: 10, scale:  2 }).default('0.00').notNull(),
	price_non_members: numeric("price_non_members", { precision: 10, scale:  2 }).default('0.00').notNull(),
	max_sign_ups: integer("max_sign_ups"),
	only_members: boolean("only_members").default(false).notNull(),
	one_sign_up_max: boolean("one_sign_up_max").default(false).notNull(),
	committee_id: integer("committee_id").references(() => committees.id, { onDelete: "set null" } ),
	created_at: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	image: uuid("image").references(() => directus_files.id, { onDelete: "set null" } ),
	contact: varchar("contact", { length: 255 }),
	event_time: time("event_time"),
	location: varchar("location", { length: 255 }).default('Rachelsmolen'),
	event_time_end: time("event_time_end"),
	registration_deadline: date("registration_deadline"),
	status: varchar("status", { length: 255 }),
	publish_date: timestamp("publish_date", { mode: 'string' }),
	event_date_end: date("event_date_end"),
	custom_url: text("custom_url"),
	short_description: text("short_description"),
},
(table) => {
	return {
		idx_events_committee: index("idx_events_committee").on(table.committee_id),
	}
});

export const event_signups = pgTable("event_signups", {
	event_id: integer("event_id").notNull().references(() => events.id, { onDelete: "cascade" } ),
	submission_file_url: varchar("submission_file_url", { length: 255 }),
	created_at: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	id: serial("id").primaryKey().notNull(),
	qr_token: varchar("qr_token", { length: 255 }),
	checked_in: boolean("checked_in").default(false),
	checked_in_at: timestamp("checked_in_at", { mode: 'string' }),
	participant_name: text("participant_name"),
	participant_email: text("participant_email"),
	participant_phone: text("participant_phone"),
	payment_status: varchar("payment_status", { length: 255 }).default('open'),
	directus_relations: uuid("directus_relations").references(() => directus_users.id, { onDelete: "set null" } ),
	is_member: boolean("is_member").default(false),
},
(table) => {
	return {
		idx_event_signups_event: index("idx_event_signups_event").on(table.event_id),
	}
});

export const events_directus_users = pgTable("events_directus_users", {
	id: serial("id").primaryKey().notNull(),
	events_id: integer("events_id").references(() => events.id, { onDelete: "set null" } ),
	directus_users_id: uuid("directus_users_id").references(() => directus_users.id, { onDelete: "set null" } ),
});

export const hero_banners_files = pgTable("hero_banners_files", {
	id: serial("id").primaryKey().notNull(),
	hero_banners_id: integer("hero_banners_id"),
	directus_files_id: uuid("directus_files_id"),
});

export const intro_blog_likes = pgTable("intro_blog_likes", {
	id: serial("id").primaryKey().notNull(),
	blog: integer("blog").notNull().references(() => intro_blogs.id, { onDelete: "cascade" } ),
	user_id: uuid("user_id").notNull().references(() => directus_users.id, { onDelete: "cascade" } ),
	created_at: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	ip_address: inet("ip_address"),
	user_agent: text("user_agent"),
},
(table) => {
	return {
		uniq_blog_user: unique("uniq_blog_user").on(table.blog, table.user_id),
	}
});

export const intro_blogs = pgTable("intro_blogs", {
	id: serial("id").primaryKey().notNull(),
	status: varchar("status", { length: 255 }).default('draft'),
	sort: integer("sort"),
	user_created: uuid("user_created").references(() => directus_users.id, { onDelete: "set null" } ),
	user_updated: uuid("user_updated").references(() => directus_users.id, { onDelete: "set null" } ),
	title: varchar("title", { length: 255 }).notNull(),
	slug: varchar("slug", { length: 255 }),
	content: text("content").notNull(),
	excerpt: varchar("excerpt", { length: 500 }),
	image: uuid("image").references(() => directus_files.id, { onDelete: "set null" } ),
	is_published: boolean("is_published").default(false),
	blog_type: varchar("blog_type", { length: 50 }).default('update'),
	meta_title: varchar("meta_title", { length: 255 }),
	meta_description: varchar("meta_description", { length: 500 }),
	views_count: integer("views_count").default(0),
	created_at: timestamp("created_at", { mode: 'string' }),
	updated_at: timestamp("updated_at", { mode: 'string' }),
	likes: varchar("likes", { length: 255 }).default('0'),
	date_updated: timestamp("date_updated", { mode: 'string' }),
},
(table) => {
	return {
		idx_intro_blogs_slug: index("idx_intro_blogs_slug").on(table.slug),
		idx_intro_blogs_type: index("idx_intro_blogs_type").on(table.blog_type),
		intro_blogs_slug_key: unique("intro_blogs_slug_key").on(table.slug),
	}
});

export const events_members = pgTable("events_members", {
	id: serial("id").primaryKey().notNull(),
	events_id: integer("events_id").references(() => events.id, { onDelete: "set null" } ),
});

export const hero_banners = pgTable("hero_banners", {
	id: serial("id").primaryKey().notNull(),
	user_created: uuid("user_created").references(() => directus_users.id),
	date_created: timestamp("date_created", { withTimezone: true, mode: 'string' }),
	image: uuid("image").references(() => directus_files.id, { onDelete: "set null" } ),
	sort: integer("sort"),
	title: varchar("title", { length: 255 }),
});

export const intro_blog_gallery = pgTable("intro_blog_gallery", {
	id: serial("id").primaryKey().notNull(),
	intro_blog_id: integer("intro_blog_id").notNull().references(() => intro_blogs.id, { onDelete: "cascade" } ),
	directus_files_id: uuid("directus_files_id").notNull().references(() => directus_files.id, { onDelete: "cascade" } ),
	sort: integer("sort").default(0),
	caption: varchar("caption", { length: 500 }),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		idx_intro_blog_gallery_blog: index("idx_intro_blog_gallery_blog").on(table.intro_blog_id, table.sort),
		intro_blog_gallery_intro_blog_id_directus_files_id_key: unique("intro_blog_gallery_intro_blog_id_directus_files_id_key").on(table.intro_blog_id, table.directus_files_id),
	}
});

export const pub_crawl_events = pgTable("pub_crawl_events", {
	id: serial("id").primaryKey().notNull(),
	name: varchar("name", { length: 255 }).notNull(),
	email: varchar("email", { length: 255 }).notNull(),
	created_at: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	image: uuid("image").references(() => directus_files.id, { onDelete: "set null" } ),
	date: timestamp("date", { mode: 'string' }),
	description: text("description"),
	whatsapp_community_url: varchar("whatsapp_community_url", { length: 255 }),
	groups: jsonb("groups").default([]),
},
(table) => {
	return {
		pub_crawl_events_email_key: unique("pub_crawl_events_email_key").on(table.email),
	}
});

export const membership_history = pgTable("membership_history", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	user_id: uuid("user_id").references(() => directus_users.id, { onDelete: "cascade" } ),
	previous_status: varchar("previous_status", { length: 255 }),
	new_status: varchar("new_status", { length: 255 }),
	changed_at: timestamp("changed_at", { mode: 'string' }).defaultNow(),
});

export const jobs = pgTable("jobs", {
	job_id: serial("job_id").primaryKey().notNull(),
	name: varchar("name", { length: 255 }).notNull(),
	description: text("description"),
	pay: numeric("pay", { precision: 10, scale:  2 }),
	location: varchar("location", { length: 255 }).notNull(),
	created_at: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	skills: text("skills"),
	profile_description: text("profile_description"),
});

export const pub_crawl_signups_transactions = pgTable("pub_crawl_signups_transactions", {
	id: serial("id").primaryKey().notNull(),
	pub_crawl_signups_id: integer("pub_crawl_signups_id").references(() => pub_crawl_signups.id, { onDelete: "set null" } ),
	transactions_id: integer("transactions_id").references(() => transactions.id, { onDelete: "set null" } ),
});

export const push_notification = pgTable("push_notification", {
	id: serial("id").primaryKey().notNull(),
	created_at: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	endpoint: varchar("endpoint", { length: 255 }),
	user_id: uuid("user_id").references(() => directus_users.id, { onDelete: "set null" } ),
	keys: json("keys"),
	user_agent: varchar("user_agent", { length: 255 }),
	last_used: timestamp("last_used", { mode: 'string' }),
});

export const permissions = pgTable("permissions", {
	id: serial("id").primaryKey().notNull(),
	name: varchar("name", { length: 255 }).notNull(),
	created_at: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
},
(table) => {
	return {
		permissions_name_key: unique("permissions_name_key").on(table.name),
	}
});

export const intro_signups = pgTable("intro_signups", {
	id: serial("id").primaryKey().notNull(),
	first_name: varchar("first_name", { length: 255 }),
	middle_name: varchar("middle_name", { length: 255 }),
	last_name: varchar("last_name", { length: 255 }),
	date_of_birth: varchar("date_of_birth", { length: 255 }),
	email: varchar("email", { length: 255 }),
	phone_number: varchar("phone_number", { length: 255 }),
	favorite_gif: varchar("favorite_gif", { length: 255 }),
	created_at: timestamp("created_at", { mode: 'string' }),
	status: varchar("status", { length: 255 }).default('registered'),
	approved: boolean("approved").default(false),
});

export const pub_crawl_signups = pgTable("pub_crawl_signups", {
	id: serial("id").primaryKey().notNull(),
	association: varchar("association", { length: 255 }),
	created_at: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	pub_crawl_event_id: integer("pub_crawl_event_id").references(() => pub_crawl_events.id, { onDelete: "cascade" } ),
	email: varchar("email", { length: 255 }),
	name: varchar("name", { length: 50 }),
	amount_tickets: integer("amount_tickets"),
	payment_status: varchar("payment_status", { length: 255 }),
	name_initials: text("name_initials"),
	directus_relations: uuid("directus_relations").references(() => directus_users.id, { onDelete: "set null" } ),
	is_member: boolean("is_member").default(false),
	group_name: varchar("group_name", { length: 255 }),
});

export const intro_planning = pgTable("intro_planning", {
	id: serial("id").primaryKey().notNull(),
	status: varchar("status", { length: 255 }).default('published'),
	sort: integer("sort"),
	user_created: uuid("user_created").references(() => directus_users.id, { onDelete: "set null" } ),
	date_created: timestamp("date_created", { mode: 'string' }).defaultNow(),
	user_updated: uuid("user_updated").references(() => directus_users.id, { onDelete: "set null" } ),
	date_updated: timestamp("date_updated", { mode: 'string' }).defaultNow(),
	day: varchar("day", { length: 50 }).notNull(),
	date: date("date").notNull(),
	time_start: time("time_start").notNull(),
	time_end: time("time_end"),
	title: varchar("title", { length: 255 }).notNull(),
	description: text("description"),
	location: varchar("location", { length: 255 }),
	sort_order: integer("sort_order").default(0).notNull(),
	color: varchar("color", { length: 7 }),
	capacity: integer("capacity"),
	signup_required: boolean("signup_required").default(false),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	icon: varchar("icon", { length: 255 }).default('Calendar Today'),
	is_mandatory: varchar("is_mandatory", { length: 255 }),
},
(table) => {
	return {
		idx_intro_planning_date: index("idx_intro_planning_date").on(table.date, table.sort_order),
		idx_intro_planning_day: index("idx_intro_planning_day").on(table.day),
		idx_intro_planning_sort: index("idx_intro_planning_sort").on(table.sort_order),
	}
});

export const pub_crawl_tickets = pgTable("pub_crawl_tickets", {
	id: bigserial("id", { mode: "bigint" }).primaryKey().notNull(),
	signup_id: integer("signup_id").references(() => pub_crawl_signups.id, { onDelete: "set null" } ),
	name: varchar("name", { length: 255 }),
	initial: varchar("initial", { length: 1 }),
	qr_token: varchar("qr_token", { length: 255 }),
	checked_in: boolean("checked_in").default(false),
	checked_in_at: timestamp("checked_in_at", { mode: 'string' }),
	created_at: timestamp("created_at", { mode: 'string' }),
	updated_at: timestamp("updated_at", { mode: 'string' }),
},
(table) => {
	return {
		pub_crawl_tickets_qr_token_unique: unique("pub_crawl_tickets_qr_token_unique").on(table.qr_token),
	}
});

export const roles = pgTable("roles", {
	id: serial("id").primaryKey().notNull(),
	name: varchar("name", { length: 255 }).notNull(),
	created_at: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
},
(table) => {
	return {
		roles_name_key: unique("roles_name_key").on(table.name),
	}
});

export const intro_parent_signups = pgTable("intro_parent_signups", {
	id: serial("id").primaryKey().notNull(),
	status: varchar("status", { length: 255 }).default('submitted'),
	user_created: uuid("user_created").references(() => directus_users.id, { onDelete: "set null" } ),
	user_updated: uuid("user_updated").references(() => directus_users.id, { onDelete: "set null" } ),
	user_id: uuid("user_id").notNull().references(() => directus_users.id, { onDelete: "cascade" } ),
	first_name: varchar("first_name", { length: 255 }).notNull(),
	last_name: varchar("last_name", { length: 255 }).notNull(),
	email: varchar("email", { length: 255 }).notNull(),
	phone_number: varchar("phone_number", { length: 50 }).notNull(),
	motivation: text("motivation").notNull(),
	previous_experience: text("previous_experience"),
	availability: jsonb("availability").notNull(),
	approved: boolean("approved").default(false),
	approved_by: uuid("approved_by").references(() => directus_users.id, { onDelete: "set null" } ),
	approved_at: timestamp("approved_at", { mode: 'string' }),
	notes: text("notes"),
	created_at: timestamp("created_at", { mode: 'string' }),
	updated_at: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	date_updated: timestamp("date_updated", { withTimezone: true, mode: 'string' }),
},
(table) => {
	return {
		idx_intro_parent_signups_approved: index("idx_intro_parent_signups_approved").on(table.approved),
		idx_intro_parent_signups_user: index("idx_intro_parent_signups_user").on(table.user_id),
		intro_parent_signups_user_id_key: unique("intro_parent_signups_user_id_key").on(table.user_id),
	}
});

export const whatsapp_groups = pgTable("whatsapp_groups", {
	id: serial("id").primaryKey().notNull(),
	name: varchar("name", { length: 255 }).notNull(),
	description: text("description"),
	invite_link: varchar("invite_link", { length: 500 }).notNull(),
	is_active: boolean("is_active").default(true),
	requires_membership: boolean("requires_membership").default(true),
	created_at: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updated_at: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		idx_whatsapp_groups_active: index("idx_whatsapp_groups_active").on(table.is_active),
		idx_whatsapp_groups_membership: index("idx_whatsapp_groups_membership").on(table.requires_membership),
		uq_whatsapp_groups_invite_link: unique("uq_whatsapp_groups_invite_link").on(table.invite_link),
	}
});

export const trips = pgTable("trips", {
	id: serial("id").primaryKey().notNull(),
	status: varchar("status", { length: 255 }),
	name: varchar("name", { length: 255 }),
	description: text("description"),
	image: uuid("image").references(() => directus_files.id, { onDelete: "set null" } ),
	registration_open: boolean("registration_open").default(false),
	max_participants: integer("max_participants"),
	base_price: numeric("base_price", { precision: 10, scale:  5 }),
	crew_discount: numeric("crew_discount", { precision: 10, scale:  5 }),
	deposit_amount: numeric("deposit_amount", { precision: 10, scale:  5 }),
	is_bus_trip: boolean("is_bus_trip").default(true),
	created_at: date("created_at"),
	updated_at: date("updated_at"),
	start_date: date("start_date"),
	end_date: date("end_date"),
	registration_start_date: timestamp("registration_start_date", { withTimezone: true, mode: 'string' }),
	max_crew: integer("max_crew"),
	allow_final_payments: boolean("allow_final_payments").default(false),
});

export const trip_signups = pgTable("trip_signups", {
	id: serial("id").primaryKey().notNull(),
	created_at: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	updated_at: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	trip_id: integer("trip_id").references(() => trips.id, { onDelete: "set null" } ),
	first_name: varchar("first_name", { length: 255 }),
	last_name: varchar("last_name", { length: 255 }),
	email: varchar("email", { length: 255 }),
	phone_number: varchar("phone_number", { length: 255 }),
	date_of_birth: date("date_of_birth"),
	id_document: varchar("id_document", { length: 255 }),
	allergies: text("allergies"),
	special_notes: text("special_notes"),
	willing_to_drive: boolean("willing_to_drive"),
	role: varchar("role", { length: 255 }).default('participant'),
	status: varchar("status", { length: 255 }).default('registered'),
	deposit_paid: boolean("deposit_paid").default(false),
	deposit_paid_at: timestamp("deposit_paid_at", { mode: 'string' }),
	full_payment_paid: boolean("full_payment_paid").default(false),
	full_payment_paid_at: timestamp("full_payment_paid_at", { mode: 'string' }),
	terms_accepted: boolean("terms_accepted").default(false),
	deposit_email_sent: boolean("deposit_email_sent").default(false),
	final_email_sent: boolean("final_email_sent").default(false),
	document_number: text("document_number"),
	directus_relations: uuid("directus_relations").references(() => directus_users.id, { onDelete: "set null" } ),
	access_token: varchar("access_token", { length: 255 }),
	document_expiry_date: date("document_expiry_date"),
	extra_luggage: boolean("extra_luggage"),
});

export const trip_activities = pgTable("trip_activities", {
	id: serial("id").primaryKey().notNull(),
	created_at: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	updated_at: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	trip_id: integer("trip_id").references(() => trips.id, { onDelete: "set null" } ),
	name: varchar("name", { length: 255 }),
	description: text("description"),
	price: numeric("price", { precision: 10, scale:  5 }),
	image: uuid("image").references(() => directus_files.id, { onDelete: "set null" } ),
	max_participants: integer("max_participants"),
	is_active: boolean("is_active"),
	display_order: integer("display_order"),
	options: json("options").default([]),
	max_selections: integer("max_selections"),
});

export const trip_signup_activities = pgTable("trip_signup_activities", {
	id: serial("id").primaryKey().notNull(),
	created_at: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	trip_signup_id: integer("trip_signup_id").references(() => trip_signups.id, { onDelete: "set null" } ),
	trip_activity_id: integer("trip_activity_id").references(() => trip_activities.id, { onDelete: "set null" } ),
	selected_options: json("selected_options"),
});

export const safe_havens = pgTable("safe_havens", {
	id: serial("id").primaryKey().notNull(),
	contact_name: varchar("contact_name", { length: 255 }).notNull(),
	created_at: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	phone_number: varchar("phone_number", { length: 20 }),
	image: uuid("image").references(() => directus_files.id, { onDelete: "set null" } ),
	user_id: uuid("user_id").references(() => directus_users.id, { onDelete: "set null" } ),
	email: varchar("email", { length: 255 }),
});

export const sponsors = pgTable("sponsors", {
	sponsor_id: serial("sponsor_id").primaryKey().notNull(),
	website_url: varchar("website_url", { length: 255 }),
	image: uuid("image").references(() => directus_files.id, { onDelete: "set null" } ),
	dark_bg: boolean("dark_bg").default(false),
});

export const system_logs = pgTable("system_logs", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	type: varchar("type", { length: 255 }).notNull(),
	status: varchar("status", { length: 50 }).notNull(),
	payload: jsonb("payload"),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow(),
	acknowledged_at: timestamp("acknowledged_at", { withTimezone: true, mode: 'string' }),
});

export const clubs = pgTable("clubs", {
	id: serial("id").primaryKey().notNull(),
	name: varchar("name", { length: 255 }).notNull(),
	created_at: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	whatsapp_link: varchar("whatsapp_link", { length: 255 }),
	discord_link: varchar("discord_link", { length: 255 }),
	website_link: varchar("website_link", { length: 255 }),
	description: text("description"),
	image: uuid("image").references(() => directus_files.id, { onDelete: "set null" } ),
},
(table) => {
	return {
		clubs_name_key: unique("clubs_name_key").on(table.name),
	}
});

export const directus_sessions = pgTable("directus_sessions", {
	token: varchar("token", { length: 64 }).primaryKey().notNull(),
	user: uuid("user").references(() => directus_users.id, { onDelete: "cascade" } ),
	expires: timestamp("expires", { withTimezone: true, mode: 'string' }).notNull(),
	ip: varchar("ip", { length: 255 }),
	user_agent: text("user_agent"),
	share: uuid("share").references(() => directus_shares.id, { onDelete: "cascade" } ),
	origin: varchar("origin", { length: 255 }),
	next_token: varchar("next_token", { length: 64 }),
});

export const role_permissions = pgTable("role_permissions", {
	id: serial("id").primaryKey().notNull(),
	role_id: integer("role_id").notNull().references(() => roles.id),
	permission_id: integer("permission_id").notNull().references(() => permissions.id),
},
(table) => {
	return {
		role_permissions_role_id_permission_id_key: unique("role_permissions_role_id_permission_id_key").on(table.role_id, table.permission_id),
	}
});

export const auth_accounts = pgTable("auth_accounts", {
	id: text("id").primaryKey().notNull(),
	accountId: text("accountId").notNull(),
	providerId: text("providerId").notNull(),
	userId: uuid("userId").notNull().references(() => directus_users.id, { onDelete: "cascade" } ),
	accessToken: text("accessToken"),
	refreshToken: text("refreshToken"),
	idToken: text("idToken"),
	accessTokenExpiresAt: timestamp("accessTokenExpiresAt", { mode: 'string' }),
	refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt", { mode: 'string' }),
	scope: text("scope"),
	password: text("password"),
	createdAt: timestamp("createdAt", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updatedAt", { mode: 'string' }).notNull(),
});

export const auth_sessions = pgTable("auth_sessions", {
	id: text("id").primaryKey().notNull(),
	expiresAt: timestamp("expiresAt", { mode: 'string' }).notNull(),
	token: text("token").notNull(),
	createdAt: timestamp("createdAt", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updatedAt", { mode: 'string' }).notNull(),
	ipAddress: text("ipAddress"),
	userAgent: text("userAgent"),
	userId: uuid("userId").notNull().references(() => directus_users.id, { onDelete: "cascade" } ),
},
(table) => {
	return {
		auth_sessions_token_key: unique("auth_sessions_token_key").on(table.token),
	}
});

export const verification = pgTable("verification", {
	id: text("id").primaryKey().notNull(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: timestamp("expiresAt", { mode: 'string' }).notNull(),
	createdAt: timestamp("createdAt", { mode: 'string' }),
	updatedAt: timestamp("updatedAt", { mode: 'string' }),
});

export const committee_members = pgTable("committee_members", {
	id: serial("id").primaryKey().notNull(),
	committee_id: integer("committee_id").notNull().references(() => committees.id, { onDelete: "cascade" } ),
	user_id: uuid("user_id").references(() => directus_users.id, { onDelete: "cascade" } ),
	is_visible: boolean("is_visible").default(true).notNull(),
	is_leader: boolean("is_leader").default(false).notNull(),
});

export const feature_flags = pgTable("feature_flags", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	name: varchar("name", { length: 255 }).notNull(),
	route_match: varchar("route_match", { length: 255 }).notNull(),
	is_active: boolean("is_active").default(false).notNull(),
	message: text("message"),
});

export const transactions = pgTable("transactions", {
	id: serial("id").primaryKey().notNull(),
	user_id: uuid("user_id").references(() => directus_users.id, { onDelete: "set default" } ),
	created_at: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updated_at: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	transaction_id: varchar("transaction_id", { length: 255 }),
	product_name: varchar("product_name", { length: 255 }),
	email: varchar("email", { length: 255 }),
	amount: real("amount"),
	payment_status: varchar("payment_status", { length: 255 }).default('open'),
	registration: integer("registration").references(() => event_signups.id, { onDelete: "set null" } ),
	environment: varchar("environment", { length: 255 }),
	approval_status: varchar("approval_status", { length: 255 }).default('auto_approved'),
	approved_by: uuid("approved_by").references(() => directus_users.id, { onDelete: "set null" } ),
	approved_at: timestamp("approved_at", { mode: 'string' }),
	first_name: varchar("first_name", { length: 255 }),
	last_name: varchar("last_name", { length: 255 }),
	pub_crawl_signup: integer("pub_crawl_signup").references(() => pub_crawl_signups.id, { onDelete: "set null" } ),
	trip_signup: integer("trip_signup").references(() => trip_signups.id, { onDelete: "set null" } ),
	webshop_preorder: integer("webshop_preorder").references(() => webshop_preorders.id, { onDelete: "set null" } ),
	coupon_code: varchar("coupon_code", { length: 255 }),
	product_type: varchar("product_type", { length: 255 }).notNull(),
	mollie_id: varchar("mollie_id", { length: 255 }).notNull(),
	access_token: uuid("access_token"),
},
(table) => {
	return {
		idx_transactions_created_at: index("idx_transactions_created_at").on(table.created_at),
		idx_transactions_user_id: index("idx_transactions_user_id").on(table.user_id),
	}
});

export const intro_planning_signups = pgTable("intro_planning_signups", {
	id: serial("id").primaryKey().notNull(),
	intro_planning_id: integer("intro_planning_id").notNull().references(() => intro_planning.id, { onDelete: "cascade" } ),
	intro_signup_id: integer("intro_signup_id").references(() => intro_signups.id, { onDelete: "cascade" } ),
	user_id: uuid("user_id").references(() => directus_users.id, { onDelete: "cascade" } ),
	status: varchar("status", { length: 50 }).default('registered'),
	attended: boolean("attended").default(false),
	attended_at: timestamp("attended_at", { mode: 'string' }),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	date_updated: timestamp("date_updated", { withTimezone: true, mode: 'string' }),
},
(table) => {
	return {
		idx_intro_planning_signups_activity: index("idx_intro_planning_signups_activity").on(table.intro_planning_id),
		idx_intro_planning_signups_user: index("idx_intro_planning_signups_user").on(table.intro_signup_id),
		intro_planning_signups_intro_planning_id_intro_signup_id_key: unique("intro_planning_signups_intro_planning_id_intro_signup_id_key").on(table.intro_planning_id, table.intro_signup_id),
		intro_planning_signups_intro_planning_id_user_id_key: unique("intro_planning_signups_intro_planning_id_user_id_key").on(table.intro_planning_id, table.user_id),
	}
});

export const directus_users = pgTable("directus_users", {
	id: uuid("id").primaryKey().notNull(),
	first_name: varchar("first_name", { length: 50 }),
	last_name: varchar("last_name", { length: 50 }),
	email: varchar("email", { length: 128 }),
	password: varchar("password", { length: 255 }),
	location: varchar("location", { length: 255 }),
	title: varchar("title", { length: 50 }),
	description: text("description"),
	tags: json("tags"),
	avatar: uuid("avatar"),
	language: varchar("language", { length: 255 }),
	tfa_secret: varchar("tfa_secret", { length: 255 }),
	status: varchar("status", { length: 16 }).default('active').notNull(),
	role: uuid("role").references(() => directus_roles.id, { onDelete: "set null" } ),
	token: varchar("token", { length: 255 }),
	last_access: timestamp("last_access", { withTimezone: true, mode: 'string' }),
	last_page: varchar("last_page", { length: 255 }),
	provider: varchar("provider", { length: 128 }).default('default').notNull(),
	external_identifier: varchar("external_identifier", { length: 255 }),
	auth_data: json("auth_data"),
	email_notifications: boolean("email_notifications").default(true),
	appearance: varchar("appearance", { length: 255 }),
	theme_dark: varchar("theme_dark", { length: 255 }),
	theme_light: varchar("theme_light", { length: 255 }),
	theme_light_overrides: json("theme_light_overrides"),
	theme_dark_overrides: json("theme_dark_overrides"),
	text_direction: varchar("text_direction", { length: 255 }).default('auto').notNull(),
	entra_id: varchar("entra_id", { length: 255 }),
	fontys_email: varchar("fontys_email", { length: 255 }),
	phone_number: varchar("phone_number", { length: 255 }),
	membership_status: varchar("membership_status", { length: 20 }).default('none'),
	membership_expiry: date("membership_expiry"),
	minecraft_username: varchar("minecraft_username", { length: 100 }),
	photo_etag: varchar("photo_etag", { length: 255 }),
	date_of_birth: date("date_of_birth"),
	admin_access: boolean("admin_access"),
	originele_betaaldatum: date("originele_betaaldatum"),
	emailverified: boolean("emailverified").default(false),
	image: text("image"),
	name: text("name"),
	createdat: timestamp("createdat", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedat: timestamp("updatedat", { withTimezone: true, mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		idx_directus_users_entra_id: index("idx_directus_users_entra_id").on(table.entra_id),
		admin_access_idx: index().on(table.admin_access),
		directus_users_email_unique: unique("directus_users_email_unique").on(table.email),
		directus_users_token_unique: unique("directus_users_token_unique").on(table.token),
		directus_users_external_identifier_unique: unique("directus_users_external_identifier_unique").on(table.external_identifier),
	}
});

export const directus_deployments = pgTable("directus_deployments", {
	id: uuid("id").primaryKey().notNull(),
	provider: varchar("provider", { length: 255 }).notNull(),
	credentials: text("credentials"),
	options: text("options"),
	date_created: timestamp("date_created", { withTimezone: true, mode: 'string' }).defaultNow(),
	user_created: uuid("user_created").references(() => directus_users.id, { onDelete: "set null" } ),
	webhook_ids: json("webhook_ids"),
	webhook_secret: varchar("webhook_secret", { length: 255 }),
	last_synced_at: timestamp("last_synced_at", { withTimezone: true, mode: 'string' }),
},
(table) => {
	return {
		directus_deployments_provider_unique: unique("directus_deployments_provider_unique").on(table.provider),
	}
});

export const directus_deployment_projects = pgTable("directus_deployment_projects", {
	id: uuid("id").primaryKey().notNull(),
	deployment: uuid("deployment").notNull().references(() => directus_deployments.id, { onDelete: "cascade" } ),
	external_id: varchar("external_id", { length: 255 }).notNull(),
	name: varchar("name", { length: 255 }).notNull(),
	date_created: timestamp("date_created", { withTimezone: true, mode: 'string' }).defaultNow(),
	user_created: uuid("user_created").references(() => directus_users.id, { onDelete: "set null" } ),
	url: varchar("url", { length: 255 }),
	framework: varchar("framework", { length: 255 }),
	deployable: boolean("deployable").default(true).notNull(),
},
(table) => {
	return {
		directus_deployment_projects_deployment_external_id_unique: unique("directus_deployment_projects_deployment_external_id_unique").on(table.deployment, table.external_id),
	}
});

export const directus_settings = pgTable("directus_settings", {
	id: serial("id").primaryKey().notNull(),
	project_name: varchar("project_name", { length: 100 }).default('Directus').notNull(),
	project_url: varchar("project_url", { length: 255 }),
	project_color: varchar("project_color", { length: 255 }).default('#6644FF').notNull(),
	project_logo: uuid("project_logo").references(() => directus_files.id),
	public_foreground: uuid("public_foreground").references(() => directus_files.id),
	public_background: uuid("public_background").references(() => directus_files.id),
	public_note: text("public_note"),
	auth_login_attempts: integer("auth_login_attempts").default(25),
	auth_password_policy: varchar("auth_password_policy", { length: 100 }),
	storage_asset_transform: varchar("storage_asset_transform", { length: 7 }).default('all'),
	storage_asset_presets: json("storage_asset_presets"),
	custom_css: text("custom_css"),
	storage_default_folder: uuid("storage_default_folder").references(() => directus_folders.id, { onDelete: "set null" } ),
	basemaps: json("basemaps"),
	mapbox_key: varchar("mapbox_key", { length: 255 }),
	module_bar: json("module_bar"),
	project_descriptor: varchar("project_descriptor", { length: 100 }),
	default_language: varchar("default_language", { length: 255 }).default('en-US').notNull(),
	custom_aspect_ratios: json("custom_aspect_ratios"),
	public_favicon: uuid("public_favicon").references(() => directus_files.id),
	default_appearance: varchar("default_appearance", { length: 255 }).default('auto').notNull(),
	default_theme_light: varchar("default_theme_light", { length: 255 }),
	theme_light_overrides: json("theme_light_overrides"),
	default_theme_dark: varchar("default_theme_dark", { length: 255 }),
	theme_dark_overrides: json("theme_dark_overrides"),
	report_error_url: varchar("report_error_url", { length: 255 }),
	report_bug_url: varchar("report_bug_url", { length: 255 }),
	report_feature_url: varchar("report_feature_url", { length: 255 }),
	public_registration: boolean("public_registration").default(false).notNull(),
	public_registration_verify_email: boolean("public_registration_verify_email").default(true).notNull(),
	public_registration_role: uuid("public_registration_role").references(() => directus_roles.id, { onDelete: "set null" } ),
	public_registration_email_filter: json("public_registration_email_filter"),
	visual_editor_urls: json("visual_editor_urls"),
	project_id: uuid("project_id"),
	mcp_enabled: boolean("mcp_enabled").default(false).notNull(),
	mcp_allow_deletes: boolean("mcp_allow_deletes").default(false).notNull(),
	mcp_prompts_collection: varchar("mcp_prompts_collection", { length: 255 }),
	mcp_system_prompt_enabled: boolean("mcp_system_prompt_enabled").default(true).notNull(),
	mcp_system_prompt: text("mcp_system_prompt"),
	project_owner: varchar("project_owner", { length: 255 }),
	project_usage: varchar("project_usage", { length: 255 }),
	org_name: varchar("org_name", { length: 255 }),
	product_updates: boolean("product_updates"),
	project_status: varchar("project_status", { length: 255 }),
	ai_openai_api_key: text("ai_openai_api_key"),
	ai_anthropic_api_key: text("ai_anthropic_api_key"),
	ai_system_prompt: text("ai_system_prompt"),
	ai_google_api_key: text("ai_google_api_key"),
	ai_openai_compatible_api_key: text("ai_openai_compatible_api_key"),
	ai_openai_compatible_base_url: text("ai_openai_compatible_base_url"),
	ai_openai_compatible_name: text("ai_openai_compatible_name"),
	ai_openai_compatible_models: json("ai_openai_compatible_models"),
	ai_openai_compatible_headers: json("ai_openai_compatible_headers"),
	ai_openai_allowed_models: json("ai_openai_allowed_models"),
	ai_anthropic_allowed_models: json("ai_anthropic_allowed_models"),
	ai_google_allowed_models: json("ai_google_allowed_models"),
	collaborative_editing_enabled: boolean("collaborative_editing_enabled").default(false).notNull(),
});

export const directus_deployment_runs = pgTable("directus_deployment_runs", {
	id: uuid("id").primaryKey().notNull(),
	project: uuid("project").notNull().references(() => directus_deployment_projects.id, { onDelete: "cascade" } ),
	external_id: varchar("external_id", { length: 255 }).notNull(),
	target: varchar("target", { length: 255 }).notNull(),
	date_created: timestamp("date_created", { withTimezone: true, mode: 'string' }).defaultNow(),
	user_created: uuid("user_created").references(() => directus_users.id, { onDelete: "set null" } ),
	status: varchar("status", { length: 255 }),
	url: varchar("url", { length: 255 }),
	started_at: timestamp("started_at", { withTimezone: true, mode: 'string' }),
	completed_at: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
});

// --- Webshop preorder domain ---
// NOTE: staged contract — these tables do not exist on the live database yet.
// See packages/db/drizzle/webshop_preorder_staged.sql for the matching migration
// to apply (or recreate as Directus collections) before this domain can run.

export const webshop_drop_windows = pgTable("webshop_drop_windows", {
	id: serial("id").primaryKey().notNull(),
	name: varchar("name", { length: 255 }).notNull(),
	status: varchar("status", { length: 50 }).default('draft'), // 'draft' | 'open' | 'closed'
	opens_at: timestamp("opens_at", { withTimezone: true, mode: 'string' }),
	closes_at: timestamp("closes_at", { withTimezone: true, mode: 'string' }).notNull(),
	created_at: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updated_at: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const webshop_products = pgTable("webshop_products", {
	id: serial("id").primaryKey().notNull(),
	drop_window_id: integer("drop_window_id").references(() => webshop_drop_windows.id, { onDelete: "set null" } ),
	type: varchar("type", { length: 50 }).notNull().default('item'), // 'clothing' | 'item'
	name: varchar("name", { length: 255 }).notNull(),
	slug: varchar("slug", { length: 255 }).notNull(),
	description: text("description"),
	price: numeric("price", { precision: 10, scale: 5 }).notNull(),
	deposit_amount: numeric("deposit_amount", { precision: 10, scale: 5 }).notNull(),
	size_chart: jsonb("size_chart"),
	is_active: boolean("is_active").default(true),
	display_order: integer("display_order").default(0),
	created_at: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updated_at: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		uq_webshop_products_slug: unique("uq_webshop_products_slug").on(table.slug),
		idx_webshop_products_drop_window: index("idx_webshop_products_drop_window").on(table.drop_window_id),
	}
});

export const webshop_product_media = pgTable("webshop_product_media", {
	id: serial("id").primaryKey().notNull(),
	product_id: integer("product_id").notNull().references(() => webshop_products.id, { onDelete: "cascade" } ),
	asset: uuid("asset").notNull().references(() => directus_files.id, { onDelete: "cascade" } ),
	display_order: integer("display_order").default(0),
	created_at: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		idx_webshop_product_media_product: index("idx_webshop_product_media_product").on(table.product_id),
	}
});

export const webshop_product_variants = pgTable("webshop_product_variants", {
	id: serial("id").primaryKey().notNull(),
	product_id: integer("product_id").notNull().references(() => webshop_products.id, { onDelete: "cascade" } ),
	size: varchar("size", { length: 50 }),
	color: varchar("color", { length: 50 }),
	sku: varchar("sku", { length: 100 }),
	is_active: boolean("is_active").default(true),
	display_order: integer("display_order").default(0),
},
(table) => {
	return {
		idx_webshop_product_variants_product: index("idx_webshop_product_variants_product").on(table.product_id),
	}
});

export const webshop_preorders = pgTable("webshop_preorders", {
	id: serial("id").primaryKey().notNull(),
	created_at: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updated_at: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	user_id: uuid("user_id").references(() => directus_users.id, { onDelete: "set null" } ),
	drop_window_id: integer("drop_window_id").references(() => webshop_drop_windows.id, { onDelete: "set null" } ),
	first_name: varchar("first_name", { length: 255 }).notNull(),
	last_name: varchar("last_name", { length: 255 }).notNull(),
	email: varchar("email", { length: 255 }).notNull(),
	phone_number: varchar("phone_number", { length: 255 }),
	status: varchar("status", { length: 50 }).default('awaiting_deposit'), // 'awaiting_deposit' | 'awaiting_final' | 'completed' | 'cancelled'
	subtotal_amount: numeric("subtotal_amount", { precision: 10, scale: 5 }).notNull(),
	deposit_amount: numeric("deposit_amount", { precision: 10, scale: 5 }).notNull(),
	deposit_paid: boolean("deposit_paid").default(false),
	deposit_paid_at: timestamp("deposit_paid_at", { mode: 'string' }),
	final_payment_paid: boolean("final_payment_paid").default(false),
	final_payment_paid_at: timestamp("final_payment_paid_at", { mode: 'string' }),
	terms_accepted: boolean("terms_accepted").default(false),
	pickup_notes: text("pickup_notes"),
	access_token: varchar("access_token", { length: 255 }),
},
(table) => {
	return {
		idx_webshop_preorders_user: index("idx_webshop_preorders_user").on(table.user_id),
		idx_webshop_preorders_drop_window: index("idx_webshop_preorders_drop_window").on(table.drop_window_id),
	}
});

export const webshop_preorder_lines = pgTable("webshop_preorder_lines", {
	id: serial("id").primaryKey().notNull(),
	preorder_id: integer("preorder_id").notNull().references(() => webshop_preorders.id, { onDelete: "cascade" } ),
	product_id: integer("product_id").references(() => webshop_products.id, { onDelete: "set null" } ),
	variant_id: integer("variant_id").references(() => webshop_product_variants.id, { onDelete: "set null" } ),
	quantity: integer("quantity").notNull().default(1),
	unit_price: numeric("unit_price", { precision: 10, scale: 5 }).notNull(),
	product_name_snapshot: varchar("product_name_snapshot", { length: 255 }),
	variant_label_snapshot: varchar("variant_label_snapshot", { length: 255 }),
},
(table) => {
	return {
		idx_webshop_preorder_lines_preorder: index("idx_webshop_preorder_lines_preorder").on(table.preorder_id),
	}
});