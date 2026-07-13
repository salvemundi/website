import { pgTable, index, foreignKey, integer, boolean, serial, uuid, timestamp, varchar, text, doublePrecision, unique, json, real, bigint, date, numeric, time, inet, jsonb, bigserial } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const clubMembers = pgTable("club_members", {
	clubId: integer("club_id").notNull(),
	isVisible: boolean("is_visible").default(true).notNull(),
	isLeader: boolean("is_leader").default(false).notNull(),
	id: serial().primaryKey().notNull(),
}, (table) => [
	index("idx_club_members_club_id").using("btree", table.clubId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.clubId],
			foreignColumns: [clubs.id],
			name: "club_members_club_id_clubs_id_fk"
		}),
]);

export const stickers = pgTable("Stickers", {
	id: serial().primaryKey().notNull(),
	userCreated: uuid("user_created"),
	dateCreated: timestamp("date_created", { withTimezone: true, mode: 'string' }),
	userUpdated: uuid("user_updated"),
	dateUpdated: timestamp("date_updated", { withTimezone: true, mode: 'string' }),
	locationName: varchar("location_name", { length: 255 }),
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
			columns: [table.userCreated],
			foreignColumns: [directusUsers.id],
			name: "Stickers_user_created_directus_users_id_fk"
		}).onDelete("set default"),
	foreignKey({
			columns: [table.userUpdated],
			foreignColumns: [directusUsers.id],
			name: "Stickers_user_updated_directus_users_id_fk"
		}).onDelete("set default"),
	foreignKey({
			columns: [table.image],
			foreignColumns: [directusFiles.id],
			name: "Stickers_image_directus_files_id_fk"
		}).onDelete("set null"),
]);

export const board = pgTable("Board", {
	id: serial().primaryKey().notNull(),
	userCreated: uuid("user_created"),
	dateCreated: timestamp("date_created", { withTimezone: true, mode: 'string' }),
	userUpdated: uuid("user_updated"),
	dateUpdated: timestamp("date_updated", { withTimezone: true, mode: 'string' }),
	image: uuid(),
	naam: varchar({ length: 255 }),
	year: varchar({ length: 255 }),
}, (table) => [
	foreignKey({
			columns: [table.userCreated],
			foreignColumns: [directusUsers.id],
			name: "Board_user_created_directus_users_id_fk"
		}),
	foreignKey({
			columns: [table.userUpdated],
			foreignColumns: [directusUsers.id],
			name: "Board_user_updated_directus_users_id_fk"
		}),
	foreignKey({
			columns: [table.image],
			foreignColumns: [directusFiles.id],
			name: "Board_image_directus_files_id_fk"
		}).onDelete("set null"),
]);

export const boardMembers = pgTable("Board_Members", {
	id: serial().primaryKey().notNull(),
	dateCreated: timestamp("date_created", { withTimezone: true, mode: 'string' }),
	dateUpdated: timestamp("date_updated", { withTimezone: true, mode: 'string' }),
	boardId: integer("board_id"),
	functie: varchar({ length: 255 }),
	userId: uuid("user_id"),
	name: varchar({ length: 255 }),
}, (table) => [
	foreignKey({
			columns: [table.boardId],
			foreignColumns: [board.id],
			name: "Board_Members_board_id_Board_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [directusUsers.id],
			name: "Board_Members_user_id_directus_users_id_fk"
		}).onDelete("set null"),
]);

export const contacts = pgTable("contacts", {
	id: serial().primaryKey().notNull(),
	title: varchar({ length: 255 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	phoneNumber: varchar("phone_number", { length: 50 }),
	description: text(),
	isActive: boolean("is_active").default(true).notNull(),
	displayOrder: integer("display_order").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	image: uuid(),
}, (table) => [
	index("idx_contacts_display_order").using("btree", table.isActive.asc().nullsLast().op("int4_ops"), table.displayOrder.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.image],
			foreignColumns: [directusFiles.id],
			name: "contacts_image_directus_files_id_fk"
		}).onDelete("set null"),
]);

export const directusAccess = pgTable("directus_access", {
	id: uuid().primaryKey().notNull(),
	role: uuid(),
	user: uuid(),
	policy: uuid().notNull(),
	sort: integer(),
}, (table) => [
	foreignKey({
			columns: [table.role],
			foreignColumns: [directusRoles.id],
			name: "directus_access_role_directus_roles_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.user],
			foreignColumns: [directusUsers.id],
			name: "directus_access_user_directus_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.policy],
			foreignColumns: [directusPolicies.id],
			name: "directus_access_policy_directus_policies_id_fk"
		}).onDelete("cascade"),
]);

export const committees = pgTable("committees", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	image: uuid(),
	isVisible: boolean("is_visible").default(false),
	shortDescription: text("short_description"),
	description: text(),
	email: varchar({ length: 255 }),
	commissieToken: varchar("commissie_token", { length: 10 }),
	azureGroupId: varchar("azure_group_id", { length: 255 }),
}, (table) => [
	foreignKey({
			columns: [table.image],
			foreignColumns: [directusFiles.id],
			name: "committees_image_directus_files_id_fk"
		}).onDelete("set null"),
	unique("committees_name_key").on(table.name),
	unique("committees_commissie_token_unique").on(table.commissieToken),
]);

export const directusComments = pgTable("directus_comments", {
	id: uuid().primaryKey().notNull(),
	collection: varchar({ length: 64 }).notNull(),
	item: varchar({ length: 255 }).notNull(),
	comment: text().notNull(),
	dateCreated: timestamp("date_created", { withTimezone: true, mode: 'string' }).defaultNow(),
	dateUpdated: timestamp("date_updated", { withTimezone: true, mode: 'string' }).defaultNow(),
	userCreated: uuid("user_created"),
	userUpdated: uuid("user_updated"),
}, (table) => [
	foreignKey({
			columns: [table.userCreated],
			foreignColumns: [directusUsers.id],
			name: "directus_comments_user_created_directus_users_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.userUpdated],
			foreignColumns: [directusUsers.id],
			name: "directus_comments_user_updated_directus_users_id_fk"
		}),
]);

export const directusDashboards = pgTable("directus_dashboards", {
	id: uuid().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	icon: varchar({ length: 64 }).default('dashboard').notNull(),
	note: text(),
	dateCreated: timestamp("date_created", { withTimezone: true, mode: 'string' }).defaultNow(),
	userCreated: uuid("user_created"),
	color: varchar({ length: 255 }),
}, (table) => [
	foreignKey({
			columns: [table.userCreated],
			foreignColumns: [directusUsers.id],
			name: "directus_dashboards_user_created_directus_users_id_fk"
		}).onDelete("set null"),
]);

export const directusFolders = pgTable("directus_folders", {
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

export const directusExtensions = pgTable("directus_extensions", {
	enabled: boolean().default(true).notNull(),
	id: uuid().primaryKey().notNull(),
	folder: varchar({ length: 255 }).notNull(),
	source: varchar({ length: 255 }).notNull(),
	bundle: uuid(),
});

export const directusFields = pgTable("directus_fields", {
	id: serial().primaryKey().notNull(),
	collection: varchar({ length: 64 }).notNull(),
	field: varchar({ length: 64 }).notNull(),
	special: varchar({ length: 64 }),
	interface: varchar({ length: 64 }),
	options: json(),
	display: varchar({ length: 64 }),
	displayOptions: json("display_options"),
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
	validationMessage: text("validation_message"),
	searchable: boolean().default(true).notNull(),
});

export const coupons = pgTable("coupons", {
	id: serial().primaryKey().notNull(),
	couponCode: varchar("coupon_code", { length: 255 }),
	discountType: varchar("discount_type", { length: 255 }).default('fixed'),
	usageLimit: integer("usage_limit"),
	usageCount: integer("usage_count").default(0).notNull(),
	isActive: boolean("is_active").default(true),
	validFrom: timestamp("valid_from", { mode: 'string' }),
	validUntil: timestamp("valid_until", { mode: 'string' }),
	discountValue: real("discount_value"),
	dateCreated: timestamp("date_created", { mode: 'string' }),
}, (table) => [
	unique("coupons_coupon_code_unique").on(table.couponCode),
]);

export const directusActivity = pgTable("directus_activity", {
	id: serial().primaryKey().notNull(),
	action: varchar({ length: 45 }).notNull(),
	user: uuid(),
	timestamp: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	ip: varchar({ length: 50 }),
	userAgent: text("user_agent"),
	collection: varchar({ length: 64 }).notNull(),
	item: varchar({ length: 255 }).notNull(),
	origin: varchar({ length: 255 }),
}, (table) => [
	index().using("btree", table.timestamp.asc().nullsLast().op("timestamptz_ops")),
]);

export const directusMigrations = pgTable("directus_migrations", {
	version: varchar({ length: 255 }).primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	timestamp: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
});

export const directusFiles = pgTable("directus_files", {
	id: uuid().primaryKey().notNull(),
	storage: varchar({ length: 255 }).notNull(),
	filenameDisk: varchar("filename_disk", { length: 255 }),
	filenameDownload: varchar("filename_download", { length: 255 }).notNull(),
	title: varchar({ length: 255 }),
	type: varchar({ length: 255 }),
	folder: uuid(),
	uploadedBy: uuid("uploaded_by"),
	createdOn: timestamp("created_on", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	modifiedBy: uuid("modified_by"),
	modifiedOn: timestamp("modified_on", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
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
	focalPointX: integer("focal_point_x"),
	focalPointY: integer("focal_point_y"),
	tusId: varchar("tus_id", { length: 64 }),
	tusData: json("tus_data"),
	uploadedOn: timestamp("uploaded_on", { withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.folder],
			foreignColumns: [directusFolders.id],
			name: "directus_files_folder_directus_folders_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.uploadedBy],
			foreignColumns: [directusUsers.id],
			name: "directus_files_uploaded_by_directus_users_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.modifiedBy],
			foreignColumns: [directusUsers.id],
			name: "directus_files_modified_by_directus_users_id_fk"
		}).onDelete("set null"),
]);

export const directusCollections = pgTable("directus_collections", {
	collection: varchar({ length: 64 }).primaryKey().notNull(),
	icon: varchar({ length: 64 }),
	note: text(),
	displayTemplate: varchar("display_template", { length: 255 }),
	hidden: boolean().default(false).notNull(),
	singleton: boolean().default(false).notNull(),
	translations: json(),
	archiveField: varchar("archive_field", { length: 64 }),
	archiveAppFilter: boolean("archive_app_filter").default(true).notNull(),
	archiveValue: varchar("archive_value", { length: 255 }),
	unarchiveValue: varchar("unarchive_value", { length: 255 }),
	sortField: varchar("sort_field", { length: 64 }),
	accountability: varchar({ length: 255 }).default('all'),
	color: varchar({ length: 255 }),
	itemDuplicationFields: json("item_duplication_fields"),
	sort: integer(),
	group: varchar({ length: 64 }),
	collapse: varchar({ length: 255 }).default('open').notNull(),
	previewUrl: varchar("preview_url", { length: 255 }),
	versioning: boolean().default(false).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.group],
			foreignColumns: [table.collection],
			name: "directus_collections_group_foreign"
		}),
]);

export const directusFlows = pgTable("directus_flows", {
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
	dateCreated: timestamp("date_created", { withTimezone: true, mode: 'string' }).defaultNow(),
	userCreated: uuid("user_created"),
}, (table) => [
	foreignKey({
			columns: [table.userCreated],
			foreignColumns: [directusUsers.id],
			name: "directus_flows_user_created_directus_users_id_fk"
		}).onDelete("set null"),
	unique("directus_flows_operation_unique").on(table.operation),
]);

export const directusPanels = pgTable("directus_panels", {
	id: uuid().primaryKey().notNull(),
	dashboard: uuid().notNull(),
	name: varchar({ length: 255 }),
	icon: varchar({ length: 64 }),
	color: varchar({ length: 10 }),
	showHeader: boolean("show_header").default(false).notNull(),
	note: text(),
	type: varchar({ length: 255 }).notNull(),
	positionX: integer("position_x").notNull(),
	positionY: integer("position_y").notNull(),
	width: integer().notNull(),
	height: integer().notNull(),
	options: json(),
	dateCreated: timestamp("date_created", { withTimezone: true, mode: 'string' }).defaultNow(),
	userCreated: uuid("user_created"),
}, (table) => [
	foreignKey({
			columns: [table.dashboard],
			foreignColumns: [directusDashboards.id],
			name: "directus_panels_dashboard_directus_dashboards_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userCreated],
			foreignColumns: [directusUsers.id],
			name: "directus_panels_user_created_directus_users_id_fk"
		}).onDelete("set null"),
]);

export const directusPermissions = pgTable("directus_permissions", {
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
			foreignColumns: [directusPolicies.id],
			name: "directus_permissions_policy_directus_policies_id_fk"
		}).onDelete("cascade"),
]);

export const directusPresets = pgTable("directus_presets", {
	id: serial().primaryKey().notNull(),
	bookmark: varchar({ length: 255 }),
	user: uuid(),
	role: uuid(),
	collection: varchar({ length: 64 }),
	search: varchar({ length: 100 }),
	layout: varchar({ length: 100 }).default('tabular'),
	layoutQuery: json("layout_query"),
	layoutOptions: json("layout_options"),
	refreshInterval: integer("refresh_interval"),
	filter: json(),
	icon: varchar({ length: 64 }).default('bookmark'),
	color: varchar({ length: 255 }),
}, (table) => [
	foreignKey({
			columns: [table.user],
			foreignColumns: [directusUsers.id],
			name: "directus_presets_user_directus_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.role],
			foreignColumns: [directusRoles.id],
			name: "directus_presets_role_directus_roles_id_fk"
		}).onDelete("cascade"),
]);

export const directusRoles = pgTable("directus_roles", {
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

export const directusRevisions = pgTable("directus_revisions", {
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
			foreignColumns: [directusActivity.id],
			name: "directus_revisions_activity_directus_activity_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.version],
			foreignColumns: [directusVersions.id],
			name: "directus_revisions_version_directus_versions_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.parent],
			foreignColumns: [table.id],
			name: "directus_revisions_parent_foreign"
		}),
]);

export const directusRelations = pgTable("directus_relations", {
	id: serial().primaryKey().notNull(),
	manyCollection: varchar("many_collection", { length: 64 }).notNull(),
	manyField: varchar("many_field", { length: 64 }).notNull(),
	oneCollection: varchar("one_collection", { length: 64 }),
	oneField: varchar("one_field", { length: 64 }),
	oneCollectionField: varchar("one_collection_field", { length: 64 }),
	oneAllowedCollections: text("one_allowed_collections"),
	junctionField: varchar("junction_field", { length: 64 }),
	sortField: varchar("sort_field", { length: 64 }),
	oneDeselectAction: varchar("one_deselect_action", { length: 255 }).default('nullify').notNull(),
});

export const directusShares = pgTable("directus_shares", {
	id: uuid().primaryKey().notNull(),
	name: varchar({ length: 255 }),
	collection: varchar({ length: 64 }).notNull(),
	item: varchar({ length: 255 }).notNull(),
	role: uuid(),
	password: varchar({ length: 255 }),
	userCreated: uuid("user_created"),
	dateCreated: timestamp("date_created", { withTimezone: true, mode: 'string' }).defaultNow(),
	dateStart: timestamp("date_start", { withTimezone: true, mode: 'string' }),
	dateEnd: timestamp("date_end", { withTimezone: true, mode: 'string' }),
	timesUsed: integer("times_used").default(0),
	maxUses: integer("max_uses"),
}, (table) => [
	foreignKey({
			columns: [table.collection],
			foreignColumns: [directusCollections.collection],
			name: "directus_shares_collection_directus_collections_collection_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.role],
			foreignColumns: [directusRoles.id],
			name: "directus_shares_role_directus_roles_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userCreated],
			foreignColumns: [directusUsers.id],
			name: "directus_shares_user_created_directus_users_id_fk"
		}).onDelete("set null"),
]);

export const directusNotifications = pgTable("directus_notifications", {
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
			foreignColumns: [directusUsers.id],
			name: "directus_notifications_recipient_directus_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.sender],
			foreignColumns: [directusUsers.id],
			name: "directus_notifications_sender_directus_users_id_fk"
		}),
]);

export const directusPolicies = pgTable("directus_policies", {
	id: uuid().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	icon: varchar({ length: 64 }).default('badge').notNull(),
	description: text(),
	ipAccess: text("ip_access"),
	enforceTfa: boolean("enforce_tfa").default(false).notNull(),
	adminAccess: boolean("admin_access").default(false).notNull(),
	appAccess: boolean("app_access").default(false).notNull(),
});

export const directusOperations = pgTable("directus_operations", {
	id: uuid().primaryKey().notNull(),
	name: varchar({ length: 255 }),
	key: varchar({ length: 255 }).notNull(),
	type: varchar({ length: 255 }).notNull(),
	positionX: integer("position_x").notNull(),
	positionY: integer("position_y").notNull(),
	options: json(),
	resolve: uuid(),
	reject: uuid(),
	flow: uuid().notNull(),
	dateCreated: timestamp("date_created", { withTimezone: true, mode: 'string' }).defaultNow(),
	userCreated: uuid("user_created"),
}, (table) => [
	foreignKey({
			columns: [table.flow],
			foreignColumns: [directusFlows.id],
			name: "directus_operations_flow_directus_flows_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userCreated],
			foreignColumns: [directusUsers.id],
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

export const directusTranslations = pgTable("directus_translations", {
	id: uuid().primaryKey().notNull(),
	language: varchar({ length: 255 }).notNull(),
	key: varchar({ length: 255 }).notNull(),
	value: text().notNull(),
});

export const directusVersions = pgTable("directus_versions", {
	id: uuid().primaryKey().notNull(),
	key: varchar({ length: 64 }).notNull(),
	name: varchar({ length: 255 }),
	collection: varchar({ length: 64 }).notNull(),
	item: varchar({ length: 255 }).notNull(),
	hash: varchar({ length: 255 }),
	dateCreated: timestamp("date_created", { withTimezone: true, mode: 'string' }).defaultNow(),
	dateUpdated: timestamp("date_updated", { withTimezone: true, mode: 'string' }).defaultNow(),
	userCreated: uuid("user_created"),
	userUpdated: uuid("user_updated"),
	delta: json(),
}, (table) => [
	foreignKey({
			columns: [table.collection],
			foreignColumns: [directusCollections.collection],
			name: "directus_versions_collection_directus_collections_collection_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userCreated],
			foreignColumns: [directusUsers.id],
			name: "directus_versions_user_created_directus_users_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.userUpdated],
			foreignColumns: [directusUsers.id],
			name: "directus_versions_user_updated_directus_users_id_fk"
		}),
]);

export const introBlogs = pgTable("intro_blogs", {
	id: serial().primaryKey().notNull(),
	status: varchar({ length: 255 }).default('draft'),
	sort: integer(),
	userCreated: uuid("user_created"),
	userUpdated: uuid("user_updated"),
	title: varchar({ length: 255 }).notNull(),
	slug: varchar({ length: 255 }),
	content: text().notNull(),
	excerpt: varchar({ length: 500 }),
	image: uuid(),
	isPublished: boolean("is_published").default(false),
	blogType: varchar("blog_type", { length: 50 }).default('update'),
	metaTitle: varchar("meta_title", { length: 255 }),
	metaDescription: varchar("meta_description", { length: 500 }),
	viewsCount: integer("views_count").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	likes: varchar({ length: 255 }).default('0'),
	dateUpdated: timestamp("date_updated", { mode: 'string' }),
}, (table) => [
	index("idx_intro_blogs_slug").using("btree", table.slug.asc().nullsLast().op("text_ops")),
	index("idx_intro_blogs_type").using("btree", table.blogType.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userCreated],
			foreignColumns: [directusUsers.id],
			name: "intro_blogs_user_created_directus_users_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.userUpdated],
			foreignColumns: [directusUsers.id],
			name: "intro_blogs_user_updated_directus_users_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.image],
			foreignColumns: [directusFiles.id],
			name: "intro_blogs_image_directus_files_id_fk"
		}).onDelete("set null"),
	unique("intro_blogs_slug_key").on(table.slug),
]);

export const documents = pgTable("documents", {
	id: serial().primaryKey().notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	category: varchar({ length: 100 }),
	isActive: boolean("is_active").default(true).notNull(),
	displayOrder: integer("display_order").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	file: uuid(),
}, (table) => [
	index("idx_documents_active_order").using("btree", table.isActive.asc().nullsLast().op("int4_ops"), table.displayOrder.asc().nullsLast().op("int4_ops")),
	index("idx_documents_category").using("btree", table.category.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.file],
			foreignColumns: [directusFiles.id],
			name: "documents_file_directus_files_id_fk"
		}).onDelete("set null"),
]);

export const events = pgTable("events", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	eventDate: date("event_date").notNull(),
	description: text(),
	descriptionLoggedIn: text("description_logged_in"),
	priceMembers: numeric("price_members", { precision: 10, scale:  2 }).default('0.00').notNull(),
	priceNonMembers: numeric("price_non_members", { precision: 10, scale:  2 }).default('0.00').notNull(),
	maxSignUps: integer("max_sign_ups"),
	onlyMembers: boolean("only_members").default(false).notNull(),
	oneSignUpMax: boolean("one_sign_up_max").default(false).notNull(),
	committeeId: integer("committee_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	image: uuid(),
	contact: varchar({ length: 255 }),
	eventTime: time("event_time"),
	location: varchar({ length: 255 }).default('Rachelsmolen'),
	eventTimeEnd: time("event_time_end"),
	registrationDeadline: date("registration_deadline"),
	status: varchar({ length: 255 }),
	publishDate: timestamp("publish_date", { mode: 'string' }),
	eventDateEnd: date("event_date_end"),
	customUrl: text("custom_url"),
	shortDescription: text("short_description"),
}, (table) => [
	index("idx_events_committee").using("btree", table.committeeId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.committeeId],
			foreignColumns: [committees.id],
			name: "events_committee_id_committees_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.image],
			foreignColumns: [directusFiles.id],
			name: "events_image_directus_files_id_fk"
		}).onDelete("set null"),
]);

export const eventSignups = pgTable("event_signups", {
	eventId: integer("event_id").notNull(),
	submissionFileUrl: varchar("submission_file_url", { length: 255 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	id: serial().primaryKey().notNull(),
	qrToken: varchar("qr_token", { length: 255 }),
	checkedIn: boolean("checked_in").default(false),
	checkedInAt: timestamp("checked_in_at", { mode: 'string' }),
	participantName: text("participant_name"),
	participantEmail: text("participant_email"),
	participantPhone: text("participant_phone"),
	paymentStatus: varchar("payment_status", { length: 255 }).default('open'),
	directusRelations: uuid("directus_relations"),
	isMember: boolean("is_member").default(false),
}, (table) => [
	index("idx_event_signups_event").using("btree", table.eventId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.eventId],
			foreignColumns: [events.id],
			name: "event_signups_event_id_events_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.directusRelations],
			foreignColumns: [directusUsers.id],
			name: "event_signups_directus_relations_directus_users_id_fk"
		}).onDelete("set null"),
]);

export const eventsDirectusUsers = pgTable("events_directus_users", {
	id: serial().primaryKey().notNull(),
	eventsId: integer("events_id"),
	directusUsersId: uuid("directus_users_id"),
}, (table) => [
	foreignKey({
			columns: [table.eventsId],
			foreignColumns: [events.id],
			name: "events_directus_users_events_id_events_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.directusUsersId],
			foreignColumns: [directusUsers.id],
			name: "events_directus_users_directus_users_id_directus_users_id_fk"
		}).onDelete("set null"),
]);

export const heroBannersFiles = pgTable("hero_banners_files", {
	id: serial().primaryKey().notNull(),
	heroBannersId: integer("hero_banners_id"),
	directusFilesId: uuid("directus_files_id"),
});

export const introBlogLikes = pgTable("intro_blog_likes", {
	id: serial().primaryKey().notNull(),
	blog: integer().notNull(),
	userId: uuid("user_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	ipAddress: inet("ip_address"),
	userAgent: text("user_agent"),
}, (table) => [
	foreignKey({
			columns: [table.blog],
			foreignColumns: [introBlogs.id],
			name: "intro_blog_likes_blog_intro_blogs_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [directusUsers.id],
			name: "intro_blog_likes_user_id_directus_users_id_fk"
		}).onDelete("cascade"),
	unique("uniq_blog_user").on(table.blog, table.userId),
]);

export const eventsMembers = pgTable("events_members", {
	id: serial().primaryKey().notNull(),
	eventsId: integer("events_id"),
}, (table) => [
	foreignKey({
			columns: [table.eventsId],
			foreignColumns: [events.id],
			name: "events_members_events_id_events_id_fk"
		}).onDelete("set null"),
]);

export const heroBanners = pgTable("hero_banners", {
	id: serial().primaryKey().notNull(),
	userCreated: uuid("user_created"),
	dateCreated: timestamp("date_created", { withTimezone: true, mode: 'string' }),
	image: uuid(),
	sort: integer(),
	title: varchar({ length: 255 }),
}, (table) => [
	foreignKey({
			columns: [table.userCreated],
			foreignColumns: [directusUsers.id],
			name: "hero_banners_user_created_directus_users_id_fk"
		}),
	foreignKey({
			columns: [table.image],
			foreignColumns: [directusFiles.id],
			name: "hero_banners_image_directus_files_id_fk"
		}).onDelete("set null"),
]);

export const introBlogGallery = pgTable("intro_blog_gallery", {
	id: serial().primaryKey().notNull(),
	introBlogId: integer("intro_blog_id").notNull(),
	directusFilesId: uuid("directus_files_id").notNull(),
	sort: integer().default(0),
	caption: varchar({ length: 500 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_intro_blog_gallery_blog").using("btree", table.introBlogId.asc().nullsLast().op("int4_ops"), table.sort.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.introBlogId],
			foreignColumns: [introBlogs.id],
			name: "intro_blog_gallery_intro_blog_id_intro_blogs_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.directusFilesId],
			foreignColumns: [directusFiles.id],
			name: "intro_blog_gallery_directus_files_id_directus_files_id_fk"
		}).onDelete("cascade"),
	unique("intro_blog_gallery_intro_blog_id_directus_files_id_key").on(table.introBlogId, table.directusFilesId),
]);

export const pubCrawlEvents = pgTable("pub_crawl_events", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 255 }).default(sql`NULL`).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	image: uuid(),
	date: timestamp({ mode: 'string' }),
	description: text(),
	whatsappCommunityUrl: varchar("whatsapp_community_url", { length: 255 }),
	groups: jsonb().default([]),
}, (table) => [
	foreignKey({
			columns: [table.image],
			foreignColumns: [directusFiles.id],
			name: "pub_crawl_events_image_directus_files_id_fk"
		}).onDelete("set null"),
]);

export const membershipHistory = pgTable("membership_history", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id"),
	previousStatus: varchar("previous_status", { length: 255 }),
	newStatus: varchar("new_status", { length: 255 }),
	changedAt: timestamp("changed_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [directusUsers.id],
			name: "membership_history_user_id_directus_users_id_fk"
		}).onDelete("cascade"),
]);

export const jobs = pgTable("jobs", {
	jobId: serial("job_id").primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	pay: numeric({ precision: 10, scale:  2 }),
	location: varchar({ length: 255 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	skills: text(),
	profileDescription: text("profile_description"),
});

export const pubCrawlSignupsTransactions = pgTable("pub_crawl_signups_transactions", {
	id: serial().primaryKey().notNull(),
	pubCrawlSignupsId: integer("pub_crawl_signups_id"),
	transactionsId: integer("transactions_id"),
}, (table) => [
	foreignKey({
			columns: [table.pubCrawlSignupsId],
			foreignColumns: [pubCrawlSignups.id],
			name: "pub_crawl_signups_transactions_pub_crawl_signups_id_pub_crawl_s"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.transactionsId],
			foreignColumns: [transactions.id],
			name: "pub_crawl_signups_transactions_transactions_id_transactions_id_"
		}).onDelete("set null"),
]);

export const pushNotification = pgTable("push_notification", {
	id: serial().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	endpoint: varchar({ length: 255 }),
	userId: uuid("user_id"),
	keys: json(),
	userAgent: varchar("user_agent", { length: 255 }),
	lastUsed: timestamp("last_used", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [directusUsers.id],
			name: "push_notification_user_id_directus_users_id_fk"
		}).onDelete("set null"),
]);

export const permissions = pgTable("permissions", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	unique("permissions_name_key").on(table.name),
]);

export const introSignups = pgTable("intro_signups", {
	id: serial().primaryKey().notNull(),
	firstName: varchar("first_name", { length: 255 }),
	middleName: varchar("middle_name", { length: 255 }),
	lastName: varchar("last_name", { length: 255 }),
	dateOfBirth: varchar("date_of_birth", { length: 255 }),
	email: varchar({ length: 255 }),
	phoneNumber: varchar("phone_number", { length: 255 }),
	favoriteGif: varchar("favorite_gif", { length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	status: varchar({ length: 255 }).default('registered'),
	approved: boolean().default(false),
});

export const pubCrawlSignups = pgTable("pub_crawl_signups", {
	id: serial().primaryKey().notNull(),
	association: varchar({ length: 255 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	pubCrawlEventId: integer("pub_crawl_event_id"),
	email: varchar({ length: 255 }),
	name: varchar({ length: 50 }),
	amountTickets: integer("amount_tickets"),
	paymentStatus: varchar("payment_status", { length: 255 }),
	nameInitials: text("name_initials"),
	directusRelations: uuid("directus_relations"),
	isMember: boolean("is_member").default(false),
	groupName: varchar("group_name", { length: 255 }),
}, (table) => [
	foreignKey({
			columns: [table.pubCrawlEventId],
			foreignColumns: [pubCrawlEvents.id],
			name: "pub_crawl_signups_pub_crawl_event_id_pub_crawl_events_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.directusRelations],
			foreignColumns: [directusUsers.id],
			name: "pub_crawl_signups_directus_relations_directus_users_id_fk"
		}).onDelete("set null"),
]);

export const introPlanning = pgTable("intro_planning", {
	id: serial().primaryKey().notNull(),
	status: varchar({ length: 255 }).default('published'),
	sort: integer(),
	userCreated: uuid("user_created"),
	dateCreated: timestamp("date_created", { mode: 'string' }).defaultNow(),
	userUpdated: uuid("user_updated"),
	dateUpdated: timestamp("date_updated", { mode: 'string' }).defaultNow(),
	day: varchar({ length: 50 }).notNull(),
	date: date().notNull(),
	timeStart: time("time_start").notNull(),
	timeEnd: time("time_end"),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	location: varchar({ length: 255 }),
	sortOrder: integer("sort_order").default(0).notNull(),
	color: varchar({ length: 7 }),
	capacity: integer(),
	signupRequired: boolean("signup_required").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	icon: varchar({ length: 255 }).default('Calendar Today'),
	isMandatory: varchar("is_mandatory", { length: 255 }),
}, (table) => [
	index("idx_intro_planning_date").using("btree", table.date.asc().nullsLast().op("date_ops"), table.sortOrder.asc().nullsLast().op("int4_ops")),
	index("idx_intro_planning_day").using("btree", table.day.asc().nullsLast().op("text_ops")),
	index("idx_intro_planning_sort").using("btree", table.sortOrder.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.userCreated],
			foreignColumns: [directusUsers.id],
			name: "intro_planning_user_created_directus_users_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.userUpdated],
			foreignColumns: [directusUsers.id],
			name: "intro_planning_user_updated_directus_users_id_fk"
		}).onDelete("set null"),
]);

export const pubCrawlTickets = pgTable("pub_crawl_tickets", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	signupId: integer("signup_id"),
	name: varchar({ length: 255 }),
	initial: varchar({ length: 1 }),
	qrToken: varchar("qr_token", { length: 255 }),
	checkedIn: boolean("checked_in").default(false),
	checkedInAt: timestamp("checked_in_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.signupId],
			foreignColumns: [pubCrawlSignups.id],
			name: "pub_crawl_tickets_signup_id_pub_crawl_signups_id_fk"
		}).onDelete("set null"),
	unique("pub_crawl_tickets_qr_token_unique").on(table.qrToken),
]);

export const roles = pgTable("roles", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	unique("roles_name_key").on(table.name),
]);

export const introParentSignups = pgTable("intro_parent_signups", {
	id: serial().primaryKey().notNull(),
	status: varchar({ length: 255 }).default('submitted'),
	userCreated: uuid("user_created"),
	userUpdated: uuid("user_updated"),
	userId: uuid("user_id").notNull(),
	firstName: varchar("first_name", { length: 255 }).notNull(),
	lastName: varchar("last_name", { length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	phoneNumber: varchar("phone_number", { length: 50 }).notNull(),
	motivation: text().notNull(),
	previousExperience: text("previous_experience"),
	availability: jsonb().notNull(),
	approved: boolean().default(false),
	approvedBy: uuid("approved_by"),
	approvedAt: timestamp("approved_at", { mode: 'string' }),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	dateUpdated: timestamp("date_updated", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_intro_parent_signups_approved").using("btree", table.approved.asc().nullsLast().op("bool_ops")),
	index("idx_intro_parent_signups_user").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userCreated],
			foreignColumns: [directusUsers.id],
			name: "intro_parent_signups_user_created_directus_users_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.userUpdated],
			foreignColumns: [directusUsers.id],
			name: "intro_parent_signups_user_updated_directus_users_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [directusUsers.id],
			name: "intro_parent_signups_user_id_directus_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.approvedBy],
			foreignColumns: [directusUsers.id],
			name: "intro_parent_signups_approved_by_directus_users_id_fk"
		}).onDelete("set null"),
	unique("intro_parent_signups_user_id_key").on(table.userId),
]);

export const whatsappGroups = pgTable("whatsapp_groups", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	inviteLink: varchar("invite_link", { length: 500 }).notNull(),
	isActive: boolean("is_active").default(true),
	requiresMembership: boolean("requires_membership").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_whatsapp_groups_active").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("idx_whatsapp_groups_membership").using("btree", table.requiresMembership.asc().nullsLast().op("bool_ops")),
	unique("uq_whatsapp_groups_invite_link").on(table.inviteLink),
]);

export const trips = pgTable("trips", {
	id: serial().primaryKey().notNull(),
	status: varchar({ length: 255 }),
	name: varchar({ length: 255 }),
	description: text(),
	image: uuid(),
	registrationOpen: boolean("registration_open").default(false),
	maxParticipants: integer("max_participants"),
	basePrice: numeric("base_price", { precision: 10, scale:  5 }),
	crewDiscount: numeric("crew_discount", { precision: 10, scale:  5 }),
	depositAmount: numeric("deposit_amount", { precision: 10, scale:  5 }),
	isBusTrip: boolean("is_bus_trip").default(true),
	createdAt: date("created_at"),
	updatedAt: date("updated_at"),
	startDate: date("start_date"),
	endDate: date("end_date"),
	registrationStartDate: timestamp("registration_start_date", { withTimezone: true, mode: 'string' }),
	maxCrew: integer("max_crew"),
	allowFinalPayments: boolean("allow_final_payments").default(false),
}, (table) => [
	foreignKey({
			columns: [table.image],
			foreignColumns: [directusFiles.id],
			name: "trips_image_directus_files_id_fk"
		}).onDelete("set null"),
]);

export const tripSignups = pgTable("trip_signups", {
	id: serial().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	tripId: integer("trip_id"),
	firstName: varchar("first_name", { length: 255 }),
	lastName: varchar("last_name", { length: 255 }),
	email: varchar({ length: 255 }),
	phoneNumber: varchar("phone_number", { length: 255 }),
	dateOfBirth: date("date_of_birth"),
	idDocument: varchar("id_document", { length: 255 }),
	allergies: text(),
	specialNotes: text("special_notes"),
	willingToDrive: boolean("willing_to_drive"),
	role: varchar({ length: 255 }).default('participant'),
	status: varchar({ length: 255 }).default('registered'),
	depositPaid: boolean("deposit_paid").default(false),
	depositPaidAt: timestamp("deposit_paid_at", { mode: 'string' }),
	fullPaymentPaid: boolean("full_payment_paid").default(false),
	fullPaymentPaidAt: timestamp("full_payment_paid_at", { mode: 'string' }),
	termsAccepted: boolean("terms_accepted").default(false),
	depositEmailSent: boolean("deposit_email_sent").default(false),
	finalEmailSent: boolean("final_email_sent").default(false),
	documentNumber: text("document_number"),
	directusRelations: uuid("directus_relations"),
	accessToken: varchar("access_token", { length: 255 }),
	documentExpiryDate: date("document_expiry_date"),
	extraLuggage: boolean("extra_luggage"),
}, (table) => [
	foreignKey({
			columns: [table.tripId],
			foreignColumns: [trips.id],
			name: "trip_signups_trip_id_trips_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.directusRelations],
			foreignColumns: [directusUsers.id],
			name: "trip_signups_directus_relations_directus_users_id_fk"
		}).onDelete("set null"),
]);

export const tripActivities = pgTable("trip_activities", {
	id: serial().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	tripId: integer("trip_id"),
	name: varchar({ length: 255 }),
	description: text(),
	price: numeric({ precision: 10, scale:  5 }),
	image: uuid(),
	maxParticipants: integer("max_participants"),
	isActive: boolean("is_active"),
	displayOrder: integer("display_order"),
	options: json().default([]),
	maxSelections: integer("max_selections"),
}, (table) => [
	foreignKey({
			columns: [table.tripId],
			foreignColumns: [trips.id],
			name: "trip_activities_trip_id_trips_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.image],
			foreignColumns: [directusFiles.id],
			name: "trip_activities_image_directus_files_id_fk"
		}).onDelete("set null"),
]);

export const tripSignupActivities = pgTable("trip_signup_activities", {
	id: serial().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	tripSignupId: integer("trip_signup_id"),
	tripActivityId: integer("trip_activity_id"),
	selectedOptions: json("selected_options"),
}, (table) => [
	foreignKey({
			columns: [table.tripSignupId],
			foreignColumns: [tripSignups.id],
			name: "trip_signup_activities_trip_signup_id_trip_signups_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.tripActivityId],
			foreignColumns: [tripActivities.id],
			name: "trip_signup_activities_trip_activity_id_trip_activities_id_fk"
		}).onDelete("set null"),
]);

export const safeHavens = pgTable("safe_havens", {
	id: serial().primaryKey().notNull(),
	contactName: varchar("contact_name", { length: 255 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	phoneNumber: varchar("phone_number", { length: 20 }),
	image: uuid(),
	userId: uuid("user_id"),
	email: varchar({ length: 255 }),
}, (table) => [
	foreignKey({
			columns: [table.image],
			foreignColumns: [directusFiles.id],
			name: "safe_havens_image_directus_files_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [directusUsers.id],
			name: "safe_havens_user_id_directus_users_id_fk"
		}).onDelete("set null"),
]);

export const sponsors = pgTable("sponsors", {
	sponsorId: serial("sponsor_id").primaryKey().notNull(),
	websiteUrl: varchar("website_url", { length: 255 }),
	image: uuid(),
	darkBg: boolean("dark_bg").default(false),
}, (table) => [
	foreignKey({
			columns: [table.image],
			foreignColumns: [directusFiles.id],
			name: "sponsors_image_directus_files_id_fk"
		}).onDelete("set null"),
]);

export const systemLogs = pgTable("system_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	type: varchar({ length: 255 }).notNull(),
	status: varchar({ length: 50 }).notNull(),
	payload: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true, mode: 'string' }),
});

export const clubs = pgTable("clubs", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	whatsappLink: varchar("whatsapp_link", { length: 255 }),
	discordLink: varchar("discord_link", { length: 255 }),
	websiteLink: varchar("website_link", { length: 255 }),
	description: text(),
	image: uuid(),
}, (table) => [
	foreignKey({
			columns: [table.image],
			foreignColumns: [directusFiles.id],
			name: "clubs_image_directus_files_id_fk"
		}).onDelete("set null"),
	unique("clubs_name_key").on(table.name),
]);

export const directusSessions = pgTable("directus_sessions", {
	token: varchar({ length: 64 }).primaryKey().notNull(),
	user: uuid(),
	expires: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	ip: varchar({ length: 255 }),
	userAgent: text("user_agent"),
	share: uuid(),
	origin: varchar({ length: 255 }),
	nextToken: varchar("next_token", { length: 64 }),
}, (table) => [
	foreignKey({
			columns: [table.user],
			foreignColumns: [directusUsers.id],
			name: "directus_sessions_user_directus_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.share],
			foreignColumns: [directusShares.id],
			name: "directus_sessions_share_directus_shares_id_fk"
		}).onDelete("cascade"),
]);

export const rolePermissions = pgTable("role_permissions", {
	id: serial().primaryKey().notNull(),
	roleId: integer("role_id").notNull(),
	permissionId: integer("permission_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.roleId],
			foreignColumns: [roles.id],
			name: "role_permissions_role_id_roles_id_fk"
		}),
	foreignKey({
			columns: [table.permissionId],
			foreignColumns: [permissions.id],
			name: "role_permissions_permission_id_permissions_id_fk"
		}),
	unique("role_permissions_role_id_permission_id_key").on(table.roleId, table.permissionId),
]);

export const transactions = pgTable("transactions", {
	id: serial().primaryKey().notNull(),
	userId: uuid("user_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	transactionId: varchar("transaction_id", { length: 255 }),
	productName: varchar("product_name", { length: 255 }),
	email: varchar({ length: 255 }),
	amount: real(),
	paymentStatus: varchar("payment_status", { length: 255 }).default('open'),
	registration: integer(),
	environment: varchar({ length: 255 }),
	approvalStatus: varchar("approval_status", { length: 255 }).default('auto_approved'),
	approvedBy: uuid("approved_by"),
	approvedAt: timestamp("approved_at", { mode: 'string' }),
	firstName: varchar("first_name", { length: 255 }),
	lastName: varchar("last_name", { length: 255 }),
	pubCrawlSignup: integer("pub_crawl_signup"),
	tripSignup: integer("trip_signup"),
	couponCode: varchar("coupon_code", { length: 255 }),
	productType: varchar("product_type", { length: 255 }).notNull(),
	mollieId: varchar("mollie_id", { length: 255 }).notNull(),
	accessToken: uuid("access_token"),
	webshopPreorder: integer("webshop_preorder"),
}, (table) => [
	index("idx_transactions_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_transactions_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [directusUsers.id],
			name: "transactions_user_id_directus_users_id_fk"
		}).onDelete("set default"),
	foreignKey({
			columns: [table.registration],
			foreignColumns: [eventSignups.id],
			name: "transactions_registration_event_signups_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.approvedBy],
			foreignColumns: [directusUsers.id],
			name: "transactions_approved_by_directus_users_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.pubCrawlSignup],
			foreignColumns: [pubCrawlSignups.id],
			name: "transactions_pub_crawl_signup_pub_crawl_signups_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.tripSignup],
			foreignColumns: [tripSignups.id],
			name: "transactions_trip_signup_trip_signups_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.webshopPreorder],
			foreignColumns: [webshopPreorders.id],
			name: "transactions_webshop_preorder_webshop_preorders_id_fk"
		}).onDelete("set null"),
]);

export const authAccounts = pgTable("auth_accounts", {
	id: text().primaryKey().notNull(),
	accountId: text().notNull(),
	providerId: text().notNull(),
	userId: uuid().notNull(),
	accessToken: text(),
	refreshToken: text(),
	idToken: text(),
	accessTokenExpiresAt: timestamp({ mode: 'string' }),
	refreshTokenExpiresAt: timestamp({ mode: 'string' }),
	scope: text(),
	password: text(),
	createdAt: timestamp({ mode: 'string' }).notNull(),
	updatedAt: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [directusUsers.id],
			name: "auth_accounts_userId_directus_users_id_fk"
		}).onDelete("cascade"),
]);

export const authSessions = pgTable("auth_sessions", {
	id: text().primaryKey().notNull(),
	expiresAt: timestamp({ mode: 'string' }).notNull(),
	token: text().notNull(),
	createdAt: timestamp({ mode: 'string' }).notNull(),
	updatedAt: timestamp({ mode: 'string' }).notNull(),
	ipAddress: text(),
	userAgent: text(),
	userId: uuid().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [directusUsers.id],
			name: "auth_sessions_userId_directus_users_id_fk"
		}).onDelete("cascade"),
	unique("auth_sessions_token_key").on(table.token),
]);

export const verification = pgTable("verification", {
	id: text().primaryKey().notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp({ mode: 'string' }).notNull(),
	createdAt: timestamp({ mode: 'string' }),
	updatedAt: timestamp({ mode: 'string' }),
});

export const committeeMembers = pgTable("committee_members", {
	id: serial().primaryKey().notNull(),
	committeeId: integer("committee_id").notNull(),
	userId: uuid("user_id"),
	isVisible: boolean("is_visible").default(true).notNull(),
	isLeader: boolean("is_leader").default(false).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.committeeId],
			foreignColumns: [committees.id],
			name: "committee_members_committee_id_committees_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [directusUsers.id],
			name: "committee_members_user_id_directus_users_id_fk"
		}).onDelete("cascade"),
]);

export const featureFlags = pgTable("feature_flags", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	routeMatch: varchar("route_match", { length: 255 }).notNull(),
	isActive: boolean("is_active").default(false).notNull(),
	message: text(),
});

export const introPlanningSignups = pgTable("intro_planning_signups", {
	id: serial().primaryKey().notNull(),
	introPlanningId: integer("intro_planning_id").notNull(),
	introSignupId: integer("intro_signup_id"),
	userId: uuid("user_id"),
	status: varchar({ length: 50 }).default('registered'),
	attended: boolean().default(false),
	attendedAt: timestamp("attended_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	dateUpdated: timestamp("date_updated", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_intro_planning_signups_activity").using("btree", table.introPlanningId.asc().nullsLast().op("int4_ops")),
	index("idx_intro_planning_signups_user").using("btree", table.introSignupId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.introPlanningId],
			foreignColumns: [introPlanning.id],
			name: "intro_planning_signups_intro_planning_id_intro_planning_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.introSignupId],
			foreignColumns: [introSignups.id],
			name: "intro_planning_signups_intro_signup_id_intro_signups_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [directusUsers.id],
			name: "intro_planning_signups_user_id_directus_users_id_fk"
		}).onDelete("cascade"),
	unique("intro_planning_signups_intro_planning_id_intro_signup_id_key").on(table.introPlanningId, table.introSignupId),
	unique("intro_planning_signups_intro_planning_id_user_id_key").on(table.introPlanningId, table.userId),
]);

export const directusUsers = pgTable("directus_users", {
	id: uuid().primaryKey().notNull(),
	firstName: varchar("first_name", { length: 50 }),
	lastName: varchar("last_name", { length: 50 }),
	email: varchar({ length: 128 }),
	password: varchar({ length: 255 }),
	location: varchar({ length: 255 }),
	title: varchar({ length: 50 }),
	description: text(),
	tags: json(),
	avatar: uuid(),
	language: varchar({ length: 255 }),
	tfaSecret: varchar("tfa_secret", { length: 255 }),
	status: varchar({ length: 16 }).default('active').notNull(),
	role: uuid(),
	token: varchar({ length: 255 }),
	lastAccess: timestamp("last_access", { withTimezone: true, mode: 'string' }),
	lastPage: varchar("last_page", { length: 255 }),
	provider: varchar({ length: 128 }).default('default').notNull(),
	externalIdentifier: varchar("external_identifier", { length: 255 }),
	authData: json("auth_data"),
	emailNotifications: boolean("email_notifications").default(true),
	appearance: varchar({ length: 255 }),
	themeDark: varchar("theme_dark", { length: 255 }),
	themeLight: varchar("theme_light", { length: 255 }),
	themeLightOverrides: json("theme_light_overrides"),
	themeDarkOverrides: json("theme_dark_overrides"),
	textDirection: varchar("text_direction", { length: 255 }).default('auto').notNull(),
	entraId: varchar("entra_id", { length: 255 }),
	fontysEmail: varchar("fontys_email", { length: 255 }),
	phoneNumber: varchar("phone_number", { length: 255 }),
	membershipStatus: varchar("membership_status", { length: 20 }).default('none'),
	membershipExpiry: date("membership_expiry"),
	minecraftUsername: varchar("minecraft_username", { length: 100 }),
	photoEtag: varchar("photo_etag", { length: 255 }),
	dateOfBirth: date("date_of_birth"),
	origineleBetaaldatum: date("originele_betaaldatum"),
	emailverified: boolean().default(false),
	image: text(),
	name: text(),
	createdat: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	updatedat: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_directus_users_entra_id").using("btree", table.entraId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.role],
			foreignColumns: [directusRoles.id],
			name: "directus_users_role_directus_roles_id_fk"
		}).onDelete("set null"),
	unique("directus_users_email_unique").on(table.email),
	unique("directus_users_token_unique").on(table.token),
	unique("directus_users_external_identifier_unique").on(table.externalIdentifier),
]);

export const directusDeployments = pgTable("directus_deployments", {
	id: uuid().primaryKey().notNull(),
	provider: varchar({ length: 255 }).notNull(),
	credentials: text(),
	options: text(),
	dateCreated: timestamp("date_created", { withTimezone: true, mode: 'string' }).defaultNow(),
	userCreated: uuid("user_created"),
	webhookIds: json("webhook_ids"),
	webhookSecret: varchar("webhook_secret", { length: 255 }),
	lastSyncedAt: timestamp("last_synced_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.userCreated],
			foreignColumns: [directusUsers.id],
			name: "directus_deployments_user_created_directus_users_id_fk"
		}).onDelete("set null"),
	unique("directus_deployments_provider_unique").on(table.provider),
]);

export const webshopProductMedia = pgTable("webshop_product_media", {
	id: serial().primaryKey().notNull(),
	productId: integer("product_id").notNull(),
	asset: uuid().notNull(),
	displayOrder: integer("display_order").default(0),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_webshop_product_media_product").using("btree", table.productId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [webshopProducts.id],
			name: "webshop_product_media_product_id_webshop_products_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.asset],
			foreignColumns: [directusFiles.id],
			name: "webshop_product_media_asset_directus_files_id_fk"
		}).onDelete("cascade"),
]);

export const directusDeploymentProjects = pgTable("directus_deployment_projects", {
	id: uuid().primaryKey().notNull(),
	deployment: uuid().notNull(),
	externalId: varchar("external_id", { length: 255 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	dateCreated: timestamp("date_created", { withTimezone: true, mode: 'string' }).defaultNow(),
	userCreated: uuid("user_created"),
	url: varchar({ length: 255 }),
	framework: varchar({ length: 255 }),
	deployable: boolean().default(true).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.deployment],
			foreignColumns: [directusDeployments.id],
			name: "directus_deployment_projects_deployment_directus_deployments_id"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userCreated],
			foreignColumns: [directusUsers.id],
			name: "directus_deployment_projects_user_created_directus_users_id_fk"
		}).onDelete("set null"),
	unique("directus_deployment_projects_deployment_external_id_unique").on(table.deployment, table.externalId),
]);

export const directusSettings = pgTable("directus_settings", {
	id: serial().primaryKey().notNull(),
	projectName: varchar("project_name", { length: 100 }).default('Directus').notNull(),
	projectUrl: varchar("project_url", { length: 255 }),
	projectColor: varchar("project_color", { length: 255 }).default('#6644FF').notNull(),
	projectLogo: uuid("project_logo"),
	publicForeground: uuid("public_foreground"),
	publicBackground: uuid("public_background"),
	publicNote: text("public_note"),
	authLoginAttempts: integer("auth_login_attempts").default(25),
	authPasswordPolicy: varchar("auth_password_policy", { length: 100 }),
	storageAssetTransform: varchar("storage_asset_transform", { length: 7 }).default('all'),
	storageAssetPresets: json("storage_asset_presets"),
	customCss: text("custom_css"),
	storageDefaultFolder: uuid("storage_default_folder"),
	basemaps: json(),
	mapboxKey: varchar("mapbox_key", { length: 255 }),
	moduleBar: json("module_bar"),
	projectDescriptor: varchar("project_descriptor", { length: 100 }),
	defaultLanguage: varchar("default_language", { length: 255 }).default('en-US').notNull(),
	customAspectRatios: json("custom_aspect_ratios"),
	publicFavicon: uuid("public_favicon"),
	defaultAppearance: varchar("default_appearance", { length: 255 }).default('auto').notNull(),
	defaultThemeLight: varchar("default_theme_light", { length: 255 }),
	themeLightOverrides: json("theme_light_overrides"),
	defaultThemeDark: varchar("default_theme_dark", { length: 255 }),
	themeDarkOverrides: json("theme_dark_overrides"),
	reportErrorUrl: varchar("report_error_url", { length: 255 }),
	reportBugUrl: varchar("report_bug_url", { length: 255 }),
	reportFeatureUrl: varchar("report_feature_url", { length: 255 }),
	publicRegistration: boolean("public_registration").default(false).notNull(),
	publicRegistrationVerifyEmail: boolean("public_registration_verify_email").default(true).notNull(),
	publicRegistrationRole: uuid("public_registration_role"),
	publicRegistrationEmailFilter: json("public_registration_email_filter"),
	visualEditorUrls: json("visual_editor_urls"),
	projectId: uuid("project_id"),
	mcpEnabled: boolean("mcp_enabled").default(false).notNull(),
	mcpAllowDeletes: boolean("mcp_allow_deletes").default(false).notNull(),
	mcpPromptsCollection: varchar("mcp_prompts_collection", { length: 255 }),
	mcpSystemPromptEnabled: boolean("mcp_system_prompt_enabled").default(true).notNull(),
	mcpSystemPrompt: text("mcp_system_prompt"),
	projectOwner: varchar("project_owner", { length: 255 }),
	projectUsage: varchar("project_usage", { length: 255 }),
	orgName: varchar("org_name", { length: 255 }),
	productUpdates: boolean("product_updates"),
	projectStatus: varchar("project_status", { length: 255 }),
	aiOpenaiApiKey: text("ai_openai_api_key"),
	aiAnthropicApiKey: text("ai_anthropic_api_key"),
	aiSystemPrompt: text("ai_system_prompt"),
	aiGoogleApiKey: text("ai_google_api_key"),
	aiOpenaiCompatibleApiKey: text("ai_openai_compatible_api_key"),
	aiOpenaiCompatibleBaseUrl: text("ai_openai_compatible_base_url"),
	aiOpenaiCompatibleName: text("ai_openai_compatible_name"),
	aiOpenaiCompatibleModels: json("ai_openai_compatible_models"),
	aiOpenaiCompatibleHeaders: json("ai_openai_compatible_headers"),
	aiOpenaiAllowedModels: json("ai_openai_allowed_models"),
	aiAnthropicAllowedModels: json("ai_anthropic_allowed_models"),
	aiGoogleAllowedModels: json("ai_google_allowed_models"),
	collaborativeEditingEnabled: boolean("collaborative_editing_enabled").default(false).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.projectLogo],
			foreignColumns: [directusFiles.id],
			name: "directus_settings_project_logo_directus_files_id_fk"
		}),
	foreignKey({
			columns: [table.publicForeground],
			foreignColumns: [directusFiles.id],
			name: "directus_settings_public_foreground_directus_files_id_fk"
		}),
	foreignKey({
			columns: [table.publicBackground],
			foreignColumns: [directusFiles.id],
			name: "directus_settings_public_background_directus_files_id_fk"
		}),
	foreignKey({
			columns: [table.storageDefaultFolder],
			foreignColumns: [directusFolders.id],
			name: "directus_settings_storage_default_folder_directus_folders_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.publicFavicon],
			foreignColumns: [directusFiles.id],
			name: "directus_settings_public_favicon_directus_files_id_fk"
		}),
	foreignKey({
			columns: [table.publicRegistrationRole],
			foreignColumns: [directusRoles.id],
			name: "directus_settings_public_registration_role_directus_roles_id_fk"
		}).onDelete("set null"),
]);

export const directusDeploymentRuns = pgTable("directus_deployment_runs", {
	id: uuid().primaryKey().notNull(),
	project: uuid().notNull(),
	externalId: varchar("external_id", { length: 255 }).notNull(),
	target: varchar({ length: 255 }).notNull(),
	dateCreated: timestamp("date_created", { withTimezone: true, mode: 'string' }).defaultNow(),
	userCreated: uuid("user_created"),
	status: varchar({ length: 255 }),
	url: varchar({ length: 255 }),
	startedAt: timestamp("started_at", { withTimezone: true, mode: 'string' }),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.project],
			foreignColumns: [directusDeploymentProjects.id],
			name: "directus_deployment_runs_project_directus_deployment_projects_i"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userCreated],
			foreignColumns: [directusUsers.id],
			name: "directus_deployment_runs_user_created_directus_users_id_fk"
		}).onDelete("set null"),
]);

export const webshopProductVariants = pgTable("webshop_product_variants", {
	id: serial().primaryKey().notNull(),
	productId: integer("product_id").notNull(),
	size: varchar({ length: 255 }),
	color: varchar({ length: 255 }),
	sku: varchar({ length: 255 }),
	isActive: boolean("is_active").default(true),
	displayOrder: integer("display_order").default(0),
}, (table) => [
	index("idx_webshop_product_variants_product").using("btree", table.productId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [webshopProducts.id],
			name: "webshop_product_variants_product_id_webshop_products_id_fk"
		}).onDelete("cascade"),
]);

export const webshopDropWindows = pgTable("webshop_drop_windows", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	status: varchar({ length: 255 }).default('draft'),
	opensAt: timestamp("opens_at", { withTimezone: true, mode: 'string' }),
	closesAt: timestamp("closes_at", { withTimezone: true, mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const webshopPreorders = pgTable("webshop_preorders", {
	id: serial().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	userId: uuid("user_id"),
	dropWindowId: integer("drop_window_id"),
	firstName: varchar("first_name", { length: 255 }).notNull(),
	lastName: varchar("last_name", { length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	phoneNumber: varchar("phone_number", { length: 255 }),
	status: varchar({ length: 255 }).default('awaiting_deposit'),
	subtotalAmount: numeric("subtotal_amount", { precision: 10, scale:  5 }).notNull(),
	depositAmount: numeric("deposit_amount", { precision: 10, scale:  5 }).notNull(),
	depositPaid: boolean("deposit_paid").default(false),
	depositPaidAt: timestamp("deposit_paid_at", { withTimezone: true, mode: 'string' }),
	finalPaymentPaid: boolean("final_payment_paid").default(false),
	finalPaymentPaidAt: timestamp("final_payment_paid_at", { withTimezone: true, mode: 'string' }),
	termsAccepted: boolean("terms_accepted").default(false),
	pickupNotes: text("pickup_notes"),
	accessToken: varchar("access_token", { length: 255 }),
}, (table) => [
	index("idx_webshop_preorders_drop_window").using("btree", table.dropWindowId.asc().nullsLast().op("int4_ops")),
	index("idx_webshop_preorders_user").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [directusUsers.id],
			name: "webshop_preorders_user_id_directus_users_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.dropWindowId],
			foreignColumns: [webshopDropWindows.id],
			name: "webshop_preorders_drop_window_id_webshop_drop_windows_id_fk"
		}).onDelete("set null"),
]);

export const webshopPreorderLines = pgTable("webshop_preorder_lines", {
	id: serial().primaryKey().notNull(),
	preorderId: integer("preorder_id").notNull(),
	productId: integer("product_id"),
	variantId: integer("variant_id"),
	quantity: integer().default(1).notNull(),
	unitPrice: numeric("unit_price", { precision: 10, scale:  5 }).notNull(),
	productNameSnapshot: varchar("product_name_snapshot", { length: 255 }),
	variantLabelSnapshot: varchar("variant_label_snapshot", { length: 255 }),
}, (table) => [
	index("idx_webshop_preorder_lines_preorder").using("btree", table.preorderId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.preorderId],
			foreignColumns: [webshopPreorders.id],
			name: "webshop_preorder_lines_preorder_id_webshop_preorders_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [webshopProducts.id],
			name: "webshop_preorder_lines_product_id_webshop_products_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.variantId],
			foreignColumns: [webshopProductVariants.id],
			name: "webshop_preorder_lines_variant_id_webshop_product_variants_id_f"
		}).onDelete("set null"),
]);

export const webshopProducts = pgTable("webshop_products", {
	id: serial().primaryKey().notNull(),
	dropWindowId: integer("drop_window_id"),
	type: varchar({ length: 255 }).default('item').notNull(),
	name: varchar({ length: 255 }).notNull(),
	slug: varchar({ length: 255 }).notNull(),
	description: text(),
	price: numeric({ precision: 10, scale:  5 }).notNull(),
	depositAmount: numeric("deposit_amount", { precision: 10, scale:  5 }).notNull(),
	sizeChart: jsonb("size_chart"),
	isActive: boolean("is_active").default(true),
	displayOrder: integer("display_order").default(0),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_webshop_products_drop_window").using("btree", table.dropWindowId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.dropWindowId],
			foreignColumns: [webshopDropWindows.id],
			name: "webshop_products_drop_window_id_webshop_drop_windows_id_fk"
		}).onDelete("set null"),
	unique("uq_webshop_products_slug").on(table.slug),
]);
