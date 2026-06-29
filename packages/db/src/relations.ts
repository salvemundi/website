import { relations } from "drizzle-orm/relations";
import { clubs, club_members, directus_files, Stickers, directus_users, Board, Board_Members, contacts, directus_policies, directus_access, directus_roles, committees, directus_comments, directus_dashboards, directus_folders, directus_collections, directus_flows, directus_panels, directus_permissions, directus_presets, directus_activity, directus_revisions, directus_versions, directus_shares, directus_notifications, directus_operations, documents, events, event_signups, events_directus_users, intro_blogs, intro_blog_likes, events_members, hero_banners, intro_blog_gallery, pub_crawl_events, membership_history, pub_crawl_signups, pub_crawl_signups_transactions, transactions, push_notification, intro_planning, pub_crawl_tickets, intro_parent_signups, trips, trip_signups, trip_activities, trip_signup_activities, safe_havens, sponsors, directus_sessions, permissions, role_permissions, roles, auth_accounts, auth_sessions, committee_members, intro_planning_signups, intro_signups, directus_deployments, directus_deployment_projects, directus_settings, directus_deployment_runs } from "./schema.js";

export const club_membersRelations = relations(club_members, ({one}) => ({
	club: one(clubs, {
		fields: [club_members.club_id],
		references: [clubs.id]
	}),
}));

export const clubsRelations = relations(clubs, ({one, many}) => ({
	club_members: many(club_members),
	directus_file: one(directus_files, {
		fields: [clubs.image],
		references: [directus_files.id]
	}),
}));

export const StickersRelations = relations(Stickers, ({one}) => ({
	directus_file: one(directus_files, {
		fields: [Stickers.image],
		references: [directus_files.id]
	}),
	directus_user_user_created: one(directus_users, {
		fields: [Stickers.user_created],
		references: [directus_users.id],
		relationName: "Stickers_user_created_directus_users_id"
	}),
	directus_user_user_updated: one(directus_users, {
		fields: [Stickers.user_updated],
		references: [directus_users.id],
		relationName: "Stickers_user_updated_directus_users_id"
	}),
}));

export const directus_filesRelations = relations(directus_files, ({one, many}) => ({
	Stickers: many(Stickers),
	Boards: many(Board),
	contacts: many(contacts),
	committees: many(committees),
	directus_folder: one(directus_folders, {
		fields: [directus_files.folder],
		references: [directus_folders.id]
	}),
	directus_user_modified_by: one(directus_users, {
		fields: [directus_files.modified_by],
		references: [directus_users.id],
		relationName: "directus_files_modified_by_directus_users_id"
	}),
	directus_user_uploaded_by: one(directus_users, {
		fields: [directus_files.uploaded_by],
		references: [directus_users.id],
		relationName: "directus_files_uploaded_by_directus_users_id"
	}),
	documents: many(documents),
	events: many(events),
	intro_blogs: many(intro_blogs),
	hero_banners: many(hero_banners),
	intro_blog_galleries: many(intro_blog_gallery),
	pub_crawl_events: many(pub_crawl_events),
	trips: many(trips),
	trip_activities: many(trip_activities),
	safe_havens: many(safe_havens),
	sponsors: many(sponsors),
	clubs: many(clubs),
	directus_settings_project_logo: many(directus_settings, {
		relationName: "directus_settings_project_logo_directus_files_id"
	}),
	directus_settings_public_background: many(directus_settings, {
		relationName: "directus_settings_public_background_directus_files_id"
	}),
	directus_settings_public_favicon: many(directus_settings, {
		relationName: "directus_settings_public_favicon_directus_files_id"
	}),
	directus_settings_public_foreground: many(directus_settings, {
		relationName: "directus_settings_public_foreground_directus_files_id"
	}),
}));

export const directus_usersRelations = relations(directus_users, ({one, many}) => ({
	Stickers_user_created: many(Stickers, {
		relationName: "Stickers_user_created_directus_users_id"
	}),
	Stickers_user_updated: many(Stickers, {
		relationName: "Stickers_user_updated_directus_users_id"
	}),
	Boards_user_created: many(Board, {
		relationName: "Board_user_created_directus_users_id"
	}),
	Boards_user_updated: many(Board, {
		relationName: "Board_user_updated_directus_users_id"
	}),
	Board_Members: many(Board_Members),
	directus_accesses: many(directus_access),
	directus_comments_user_created: many(directus_comments, {
		relationName: "directus_comments_user_created_directus_users_id"
	}),
	directus_comments_user_updated: many(directus_comments, {
		relationName: "directus_comments_user_updated_directus_users_id"
	}),
	directus_dashboards: many(directus_dashboards),
	directus_files_modified_by: many(directus_files, {
		relationName: "directus_files_modified_by_directus_users_id"
	}),
	directus_files_uploaded_by: many(directus_files, {
		relationName: "directus_files_uploaded_by_directus_users_id"
	}),
	directus_flows: many(directus_flows),
	directus_panels: many(directus_panels),
	directus_presets: many(directus_presets),
	directus_shares: many(directus_shares),
	directus_notifications_recipient: many(directus_notifications, {
		relationName: "directus_notifications_recipient_directus_users_id"
	}),
	directus_notifications_sender: many(directus_notifications, {
		relationName: "directus_notifications_sender_directus_users_id"
	}),
	directus_operations: many(directus_operations),
	directus_versions_user_created: many(directus_versions, {
		relationName: "directus_versions_user_created_directus_users_id"
	}),
	directus_versions_user_updated: many(directus_versions, {
		relationName: "directus_versions_user_updated_directus_users_id"
	}),
	event_signups: many(event_signups),
	events_directus_users: many(events_directus_users),
	intro_blog_likes: many(intro_blog_likes),
	intro_blogs_user_created: many(intro_blogs, {
		relationName: "intro_blogs_user_created_directus_users_id"
	}),
	intro_blogs_user_updated: many(intro_blogs, {
		relationName: "intro_blogs_user_updated_directus_users_id"
	}),
	hero_banners: many(hero_banners),
	membership_histories: many(membership_history),
	push_notifications: many(push_notification),
	pub_crawl_signups: many(pub_crawl_signups),
	intro_plannings_user_created: many(intro_planning, {
		relationName: "intro_planning_user_created_directus_users_id"
	}),
	intro_plannings_user_updated: many(intro_planning, {
		relationName: "intro_planning_user_updated_directus_users_id"
	}),
	intro_parent_signups_approved_by: many(intro_parent_signups, {
		relationName: "intro_parent_signups_approved_by_directus_users_id"
	}),
	intro_parent_signups_user_created: many(intro_parent_signups, {
		relationName: "intro_parent_signups_user_created_directus_users_id"
	}),
	intro_parent_signups_user_id: many(intro_parent_signups, {
		relationName: "intro_parent_signups_user_id_directus_users_id"
	}),
	intro_parent_signups_user_updated: many(intro_parent_signups, {
		relationName: "intro_parent_signups_user_updated_directus_users_id"
	}),
	trip_signups: many(trip_signups),
	safe_havens: many(safe_havens),
	directus_sessions: many(directus_sessions),
	auth_accounts: many(auth_accounts),
	auth_sessions: many(auth_sessions),
	committee_members: many(committee_members),
	transactions_user_id: many(transactions, {
		relationName: "transactions_user_id_directus_users_id"
	}),
	transactions_approved_by: many(transactions, {
		relationName: "transactions_approved_by_directus_users_id"
	}),
	intro_planning_signups: many(intro_planning_signups),
	directus_role: one(directus_roles, {
		fields: [directus_users.role],
		references: [directus_roles.id]
	}),
	directus_deployments: many(directus_deployments),
	directus_deployment_projects: many(directus_deployment_projects),
	directus_deployment_runs: many(directus_deployment_runs),
}));

export const BoardRelations = relations(Board, ({one, many}) => ({
	directus_file: one(directus_files, {
		fields: [Board.image],
		references: [directus_files.id]
	}),
	directus_user_user_created: one(directus_users, {
		fields: [Board.user_created],
		references: [directus_users.id],
		relationName: "Board_user_created_directus_users_id"
	}),
	directus_user_user_updated: one(directus_users, {
		fields: [Board.user_updated],
		references: [directus_users.id],
		relationName: "Board_user_updated_directus_users_id"
	}),
	Board_Members: many(Board_Members),
}));

export const Board_MembersRelations = relations(Board_Members, ({one}) => ({
	Board: one(Board, {
		fields: [Board_Members.board_id],
		references: [Board.id]
	}),
	directus_user: one(directus_users, {
		fields: [Board_Members.user_id],
		references: [directus_users.id]
	}),
}));

export const contactsRelations = relations(contacts, ({one}) => ({
	directus_file: one(directus_files, {
		fields: [contacts.image],
		references: [directus_files.id]
	}),
}));

export const directus_accessRelations = relations(directus_access, ({one}) => ({
	directus_policy: one(directus_policies, {
		fields: [directus_access.policy],
		references: [directus_policies.id]
	}),
	directus_role: one(directus_roles, {
		fields: [directus_access.role],
		references: [directus_roles.id]
	}),
	directus_user: one(directus_users, {
		fields: [directus_access.user],
		references: [directus_users.id]
	}),
}));

export const directus_policiesRelations = relations(directus_policies, ({many}) => ({
	directus_accesses: many(directus_access),
	directus_permissions: many(directus_permissions),
}));

export const directus_rolesRelations = relations(directus_roles, ({one, many}) => ({
	directus_accesses: many(directus_access),
	directus_presets: many(directus_presets),
	directus_role: one(directus_roles, {
		fields: [directus_roles.parent],
		references: [directus_roles.id],
		relationName: "directus_roles_parent_directus_roles_id"
	}),
	directus_roles: many(directus_roles, {
		relationName: "directus_roles_parent_directus_roles_id"
	}),
	directus_shares: many(directus_shares),
	directus_users: many(directus_users),
	directus_settings: many(directus_settings),
}));

export const committeesRelations = relations(committees, ({one, many}) => ({
	directus_file: one(directus_files, {
		fields: [committees.image],
		references: [directus_files.id]
	}),
	events: many(events),
	committee_members: many(committee_members),
}));

export const directus_commentsRelations = relations(directus_comments, ({one}) => ({
	directus_user_user_created: one(directus_users, {
		fields: [directus_comments.user_created],
		references: [directus_users.id],
		relationName: "directus_comments_user_created_directus_users_id"
	}),
	directus_user_user_updated: one(directus_users, {
		fields: [directus_comments.user_updated],
		references: [directus_users.id],
		relationName: "directus_comments_user_updated_directus_users_id"
	}),
}));

export const directus_dashboardsRelations = relations(directus_dashboards, ({one, many}) => ({
	directus_user: one(directus_users, {
		fields: [directus_dashboards.user_created],
		references: [directus_users.id]
	}),
	directus_panels: many(directus_panels),
}));

export const directus_foldersRelations = relations(directus_folders, ({one, many}) => ({
	directus_folder: one(directus_folders, {
		fields: [directus_folders.parent],
		references: [directus_folders.id],
		relationName: "directus_folders_parent_directus_folders_id"
	}),
	directus_folders: many(directus_folders, {
		relationName: "directus_folders_parent_directus_folders_id"
	}),
	directus_files: many(directus_files),
	directus_settings: many(directus_settings),
}));

export const directus_collectionsRelations = relations(directus_collections, ({one, many}) => ({
	directus_collection: one(directus_collections, {
		fields: [directus_collections.group],
		references: [directus_collections.collection],
		relationName: "directus_collections_group_directus_collections_collection"
	}),
	directus_collections: many(directus_collections, {
		relationName: "directus_collections_group_directus_collections_collection"
	}),
	directus_shares: many(directus_shares),
	directus_versions: many(directus_versions),
}));

export const directus_flowsRelations = relations(directus_flows, ({one, many}) => ({
	directus_user: one(directus_users, {
		fields: [directus_flows.user_created],
		references: [directus_users.id]
	}),
	directus_operations: many(directus_operations),
}));

export const directus_panelsRelations = relations(directus_panels, ({one}) => ({
	directus_dashboard: one(directus_dashboards, {
		fields: [directus_panels.dashboard],
		references: [directus_dashboards.id]
	}),
	directus_user: one(directus_users, {
		fields: [directus_panels.user_created],
		references: [directus_users.id]
	}),
}));

export const directus_permissionsRelations = relations(directus_permissions, ({one}) => ({
	directus_policy: one(directus_policies, {
		fields: [directus_permissions.policy],
		references: [directus_policies.id]
	}),
}));

export const directus_presetsRelations = relations(directus_presets, ({one}) => ({
	directus_role: one(directus_roles, {
		fields: [directus_presets.role],
		references: [directus_roles.id]
	}),
	directus_user: one(directus_users, {
		fields: [directus_presets.user],
		references: [directus_users.id]
	}),
}));

export const directus_revisionsRelations = relations(directus_revisions, ({one, many}) => ({
	directus_activity: one(directus_activity, {
		fields: [directus_revisions.activity],
		references: [directus_activity.id]
	}),
	directus_revision: one(directus_revisions, {
		fields: [directus_revisions.parent],
		references: [directus_revisions.id],
		relationName: "directus_revisions_parent_directus_revisions_id"
	}),
	directus_revisions: many(directus_revisions, {
		relationName: "directus_revisions_parent_directus_revisions_id"
	}),
	directus_version: one(directus_versions, {
		fields: [directus_revisions.version],
		references: [directus_versions.id]
	}),
}));

export const directus_activityRelations = relations(directus_activity, ({many}) => ({
	directus_revisions: many(directus_revisions),
}));

export const directus_versionsRelations = relations(directus_versions, ({one, many}) => ({
	directus_revisions: many(directus_revisions),
	directus_collection: one(directus_collections, {
		fields: [directus_versions.collection],
		references: [directus_collections.collection]
	}),
	directus_user_user_created: one(directus_users, {
		fields: [directus_versions.user_created],
		references: [directus_users.id],
		relationName: "directus_versions_user_created_directus_users_id"
	}),
	directus_user_user_updated: one(directus_users, {
		fields: [directus_versions.user_updated],
		references: [directus_users.id],
		relationName: "directus_versions_user_updated_directus_users_id"
	}),
}));

export const directus_sharesRelations = relations(directus_shares, ({one, many}) => ({
	directus_collection: one(directus_collections, {
		fields: [directus_shares.collection],
		references: [directus_collections.collection]
	}),
	directus_role: one(directus_roles, {
		fields: [directus_shares.role],
		references: [directus_roles.id]
	}),
	directus_user: one(directus_users, {
		fields: [directus_shares.user_created],
		references: [directus_users.id]
	}),
	directus_sessions: many(directus_sessions),
}));

export const directus_notificationsRelations = relations(directus_notifications, ({one}) => ({
	directus_user_recipient: one(directus_users, {
		fields: [directus_notifications.recipient],
		references: [directus_users.id],
		relationName: "directus_notifications_recipient_directus_users_id"
	}),
	directus_user_sender: one(directus_users, {
		fields: [directus_notifications.sender],
		references: [directus_users.id],
		relationName: "directus_notifications_sender_directus_users_id"
	}),
}));

export const directus_operationsRelations = relations(directus_operations, ({one, many}) => ({
	directus_flow: one(directus_flows, {
		fields: [directus_operations.flow],
		references: [directus_flows.id]
	}),
	directus_operation_reject: one(directus_operations, {
		fields: [directus_operations.reject],
		references: [directus_operations.id],
		relationName: "directus_operations_reject_directus_operations_id"
	}),
	directus_operations_reject: many(directus_operations, {
		relationName: "directus_operations_reject_directus_operations_id"
	}),
	directus_operation_resolve: one(directus_operations, {
		fields: [directus_operations.resolve],
		references: [directus_operations.id],
		relationName: "directus_operations_resolve_directus_operations_id"
	}),
	directus_operations_resolve: many(directus_operations, {
		relationName: "directus_operations_resolve_directus_operations_id"
	}),
	directus_user: one(directus_users, {
		fields: [directus_operations.user_created],
		references: [directus_users.id]
	}),
}));

export const documentsRelations = relations(documents, ({one}) => ({
	directus_file: one(directus_files, {
		fields: [documents.file],
		references: [directus_files.id]
	}),
}));

export const eventsRelations = relations(events, ({one, many}) => ({
	committee: one(committees, {
		fields: [events.committee_id],
		references: [committees.id]
	}),
	directus_file: one(directus_files, {
		fields: [events.image],
		references: [directus_files.id]
	}),
	event_signups: many(event_signups),
	events_directus_users: many(events_directus_users),
	events_members: many(events_members),
}));

export const event_signupsRelations = relations(event_signups, ({one, many}) => ({
	directus_user: one(directus_users, {
		fields: [event_signups.directus_relations],
		references: [directus_users.id]
	}),
	event: one(events, {
		fields: [event_signups.event_id],
		references: [events.id]
	}),
	transactions: many(transactions),
}));

export const events_directus_usersRelations = relations(events_directus_users, ({one}) => ({
	directus_user: one(directus_users, {
		fields: [events_directus_users.directus_users_id],
		references: [directus_users.id]
	}),
	event: one(events, {
		fields: [events_directus_users.events_id],
		references: [events.id]
	}),
}));

export const intro_blog_likesRelations = relations(intro_blog_likes, ({one}) => ({
	intro_blog: one(intro_blogs, {
		fields: [intro_blog_likes.blog],
		references: [intro_blogs.id]
	}),
	directus_user: one(directus_users, {
		fields: [intro_blog_likes.user_id],
		references: [directus_users.id]
	}),
}));

export const intro_blogsRelations = relations(intro_blogs, ({one, many}) => ({
	intro_blog_likes: many(intro_blog_likes),
	directus_file: one(directus_files, {
		fields: [intro_blogs.image],
		references: [directus_files.id]
	}),
	directus_user_user_created: one(directus_users, {
		fields: [intro_blogs.user_created],
		references: [directus_users.id],
		relationName: "intro_blogs_user_created_directus_users_id"
	}),
	directus_user_user_updated: one(directus_users, {
		fields: [intro_blogs.user_updated],
		references: [directus_users.id],
		relationName: "intro_blogs_user_updated_directus_users_id"
	}),
	intro_blog_galleries: many(intro_blog_gallery),
}));

export const events_membersRelations = relations(events_members, ({one}) => ({
	event: one(events, {
		fields: [events_members.events_id],
		references: [events.id]
	}),
}));

export const hero_bannersRelations = relations(hero_banners, ({one}) => ({
	directus_file: one(directus_files, {
		fields: [hero_banners.image],
		references: [directus_files.id]
	}),
	directus_user: one(directus_users, {
		fields: [hero_banners.user_created],
		references: [directus_users.id]
	}),
}));

export const intro_blog_galleryRelations = relations(intro_blog_gallery, ({one}) => ({
	directus_file: one(directus_files, {
		fields: [intro_blog_gallery.directus_files_id],
		references: [directus_files.id]
	}),
	intro_blog: one(intro_blogs, {
		fields: [intro_blog_gallery.intro_blog_id],
		references: [intro_blogs.id]
	}),
}));

export const pub_crawl_eventsRelations = relations(pub_crawl_events, ({one, many}) => ({
	directus_file: one(directus_files, {
		fields: [pub_crawl_events.image],
		references: [directus_files.id]
	}),
	pub_crawl_signups: many(pub_crawl_signups),
}));

export const membership_historyRelations = relations(membership_history, ({one}) => ({
	directus_user: one(directus_users, {
		fields: [membership_history.user_id],
		references: [directus_users.id]
	}),
}));

export const pub_crawl_signups_transactionsRelations = relations(pub_crawl_signups_transactions, ({one}) => ({
	pub_crawl_signup: one(pub_crawl_signups, {
		fields: [pub_crawl_signups_transactions.pub_crawl_signups_id],
		references: [pub_crawl_signups.id]
	}),
	transaction: one(transactions, {
		fields: [pub_crawl_signups_transactions.transactions_id],
		references: [transactions.id]
	}),
}));

export const pub_crawl_signupsRelations = relations(pub_crawl_signups, ({one, many}) => ({
	pub_crawl_signups_transactions: many(pub_crawl_signups_transactions),
	directus_user: one(directus_users, {
		fields: [pub_crawl_signups.directus_relations],
		references: [directus_users.id]
	}),
	pub_crawl_event: one(pub_crawl_events, {
		fields: [pub_crawl_signups.pub_crawl_event_id],
		references: [pub_crawl_events.id]
	}),
	pub_crawl_tickets: many(pub_crawl_tickets),
	transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({one, many}) => ({
	pub_crawl_signups_transactions: many(pub_crawl_signups_transactions),
	directus_user_user_id: one(directus_users, {
		fields: [transactions.user_id],
		references: [directus_users.id],
		relationName: "transactions_user_id_directus_users_id"
	}),
	directus_user_approved_by: one(directus_users, {
		fields: [transactions.approved_by],
		references: [directus_users.id],
		relationName: "transactions_approved_by_directus_users_id"
	}),
	pub_crawl_signup: one(pub_crawl_signups, {
		fields: [transactions.pub_crawl_signup],
		references: [pub_crawl_signups.id]
	}),
	event_signup: one(event_signups, {
		fields: [transactions.registration],
		references: [event_signups.id]
	}),
	trip_signup: one(trip_signups, {
		fields: [transactions.trip_signup],
		references: [trip_signups.id]
	}),
}));

export const push_notificationRelations = relations(push_notification, ({one}) => ({
	directus_user: one(directus_users, {
		fields: [push_notification.user_id],
		references: [directus_users.id]
	}),
}));

export const intro_planningRelations = relations(intro_planning, ({one, many}) => ({
	directus_user_user_created: one(directus_users, {
		fields: [intro_planning.user_created],
		references: [directus_users.id],
		relationName: "intro_planning_user_created_directus_users_id"
	}),
	directus_user_user_updated: one(directus_users, {
		fields: [intro_planning.user_updated],
		references: [directus_users.id],
		relationName: "intro_planning_user_updated_directus_users_id"
	}),
	intro_planning_signups: many(intro_planning_signups),
}));

export const pub_crawl_ticketsRelations = relations(pub_crawl_tickets, ({one}) => ({
	pub_crawl_signup: one(pub_crawl_signups, {
		fields: [pub_crawl_tickets.signup_id],
		references: [pub_crawl_signups.id]
	}),
}));

export const intro_parent_signupsRelations = relations(intro_parent_signups, ({one}) => ({
	directus_user_approved_by: one(directus_users, {
		fields: [intro_parent_signups.approved_by],
		references: [directus_users.id],
		relationName: "intro_parent_signups_approved_by_directus_users_id"
	}),
	directus_user_user_created: one(directus_users, {
		fields: [intro_parent_signups.user_created],
		references: [directus_users.id],
		relationName: "intro_parent_signups_user_created_directus_users_id"
	}),
	directus_user_user_id: one(directus_users, {
		fields: [intro_parent_signups.user_id],
		references: [directus_users.id],
		relationName: "intro_parent_signups_user_id_directus_users_id"
	}),
	directus_user_user_updated: one(directus_users, {
		fields: [intro_parent_signups.user_updated],
		references: [directus_users.id],
		relationName: "intro_parent_signups_user_updated_directus_users_id"
	}),
}));

export const tripsRelations = relations(trips, ({one, many}) => ({
	directus_file: one(directus_files, {
		fields: [trips.image],
		references: [directus_files.id]
	}),
	trip_signups: many(trip_signups),
	trip_activities: many(trip_activities),
}));

export const trip_signupsRelations = relations(trip_signups, ({one, many}) => ({
	directus_user: one(directus_users, {
		fields: [trip_signups.directus_relations],
		references: [directus_users.id]
	}),
	trip: one(trips, {
		fields: [trip_signups.trip_id],
		references: [trips.id]
	}),
	trip_signup_activities: many(trip_signup_activities),
	transactions: many(transactions),
}));

export const trip_activitiesRelations = relations(trip_activities, ({one, many}) => ({
	directus_file: one(directus_files, {
		fields: [trip_activities.image],
		references: [directus_files.id]
	}),
	trip: one(trips, {
		fields: [trip_activities.trip_id],
		references: [trips.id]
	}),
	trip_signup_activities: many(trip_signup_activities),
}));

export const trip_signup_activitiesRelations = relations(trip_signup_activities, ({one}) => ({
	trip_activity: one(trip_activities, {
		fields: [trip_signup_activities.trip_activity_id],
		references: [trip_activities.id]
	}),
	trip_signup: one(trip_signups, {
		fields: [trip_signup_activities.trip_signup_id],
		references: [trip_signups.id]
	}),
}));

export const safe_havensRelations = relations(safe_havens, ({one}) => ({
	directus_file: one(directus_files, {
		fields: [safe_havens.image],
		references: [directus_files.id]
	}),
	directus_user: one(directus_users, {
		fields: [safe_havens.user_id],
		references: [directus_users.id]
	}),
}));

export const sponsorsRelations = relations(sponsors, ({one}) => ({
	directus_file: one(directus_files, {
		fields: [sponsors.image],
		references: [directus_files.id]
	}),
}));

export const directus_sessionsRelations = relations(directus_sessions, ({one}) => ({
	directus_share: one(directus_shares, {
		fields: [directus_sessions.share],
		references: [directus_shares.id]
	}),
	directus_user: one(directus_users, {
		fields: [directus_sessions.user],
		references: [directus_users.id]
	}),
}));

export const role_permissionsRelations = relations(role_permissions, ({one}) => ({
	permission: one(permissions, {
		fields: [role_permissions.permission_id],
		references: [permissions.id]
	}),
	role: one(roles, {
		fields: [role_permissions.role_id],
		references: [roles.id]
	}),
}));

export const permissionsRelations = relations(permissions, ({many}) => ({
	role_permissions: many(role_permissions),
}));

export const rolesRelations = relations(roles, ({many}) => ({
	role_permissions: many(role_permissions),
}));

export const auth_accountsRelations = relations(auth_accounts, ({one}) => ({
	directus_user: one(directus_users, {
		fields: [auth_accounts.userId],
		references: [directus_users.id]
	}),
}));

export const auth_sessionsRelations = relations(auth_sessions, ({one}) => ({
	directus_user: one(directus_users, {
		fields: [auth_sessions.userId],
		references: [directus_users.id]
	}),
}));

export const committee_membersRelations = relations(committee_members, ({one}) => ({
	committee: one(committees, {
		fields: [committee_members.committee_id],
		references: [committees.id]
	}),
	directus_user: one(directus_users, {
		fields: [committee_members.user_id],
		references: [directus_users.id]
	}),
}));

export const intro_planning_signupsRelations = relations(intro_planning_signups, ({one}) => ({
	intro_planning: one(intro_planning, {
		fields: [intro_planning_signups.intro_planning_id],
		references: [intro_planning.id]
	}),
	intro_signup: one(intro_signups, {
		fields: [intro_planning_signups.intro_signup_id],
		references: [intro_signups.id]
	}),
	directus_user: one(directus_users, {
		fields: [intro_planning_signups.user_id],
		references: [directus_users.id]
	}),
}));

export const intro_signupsRelations = relations(intro_signups, ({many}) => ({
	intro_planning_signups: many(intro_planning_signups),
}));

export const directus_deploymentsRelations = relations(directus_deployments, ({one, many}) => ({
	directus_user: one(directus_users, {
		fields: [directus_deployments.user_created],
		references: [directus_users.id]
	}),
	directus_deployment_projects: many(directus_deployment_projects),
}));

export const directus_deployment_projectsRelations = relations(directus_deployment_projects, ({one, many}) => ({
	directus_deployment: one(directus_deployments, {
		fields: [directus_deployment_projects.deployment],
		references: [directus_deployments.id]
	}),
	directus_user: one(directus_users, {
		fields: [directus_deployment_projects.user_created],
		references: [directus_users.id]
	}),
	directus_deployment_runs: many(directus_deployment_runs),
}));

export const directus_settingsRelations = relations(directus_settings, ({one}) => ({
	directus_file_project_logo: one(directus_files, {
		fields: [directus_settings.project_logo],
		references: [directus_files.id],
		relationName: "directus_settings_project_logo_directus_files_id"
	}),
	directus_file_public_background: one(directus_files, {
		fields: [directus_settings.public_background],
		references: [directus_files.id],
		relationName: "directus_settings_public_background_directus_files_id"
	}),
	directus_file_public_favicon: one(directus_files, {
		fields: [directus_settings.public_favicon],
		references: [directus_files.id],
		relationName: "directus_settings_public_favicon_directus_files_id"
	}),
	directus_file_public_foreground: one(directus_files, {
		fields: [directus_settings.public_foreground],
		references: [directus_files.id],
		relationName: "directus_settings_public_foreground_directus_files_id"
	}),
	directus_role: one(directus_roles, {
		fields: [directus_settings.public_registration_role],
		references: [directus_roles.id]
	}),
	directus_folder: one(directus_folders, {
		fields: [directus_settings.storage_default_folder],
		references: [directus_folders.id]
	}),
}));

export const directus_deployment_runsRelations = relations(directus_deployment_runs, ({one}) => ({
	directus_deployment_project: one(directus_deployment_projects, {
		fields: [directus_deployment_runs.project],
		references: [directus_deployment_projects.id]
	}),
	directus_user: one(directus_users, {
		fields: [directus_deployment_runs.user_created],
		references: [directus_users.id]
	}),
}));