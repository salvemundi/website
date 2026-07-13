import { relations } from "drizzle-orm/relations";
import { clubs, clubMembers, directusUsers, stickers, directusFiles, board, boardMembers, contacts, directusRoles, directusAccess, directusPolicies, committees, directusComments, directusDashboards, directusFolders, directusCollections, directusFlows, directusPanels, directusPermissions, directusPresets, directusActivity, directusRevisions, directusVersions, directusShares, directusNotifications, directusOperations, introBlogs, documents, events, eventSignups, eventsDirectusUsers, introBlogLikes, eventsMembers, heroBanners, introBlogGallery, pubCrawlEvents, membershipHistory, pubCrawlSignups, pubCrawlSignupsTransactions, transactions, pushNotification, introPlanning, pubCrawlTickets, introParentSignups, trips, tripSignups, tripActivities, tripSignupActivities, safeHavens, sponsors, directusSessions, roles, rolePermissions, permissions, webshopPreorders, authAccounts, authSessions, committeeMembers, introPlanningSignups, introSignups, directusDeployments, webshopProducts, webshopProductMedia, directusDeploymentProjects, directusSettings, directusDeploymentRuns, webshopProductVariants, webshopDropWindows, webshopPreorderLines } from "./schema";

export const clubMembersRelations = relations(clubMembers, ({one}) => ({
	club: one(clubs, {
		fields: [clubMembers.clubId],
		references: [clubs.id]
	}),
}));

export const clubsRelations = relations(clubs, ({one, many}) => ({
	clubMembers: many(clubMembers),
	directusFile: one(directusFiles, {
		fields: [clubs.image],
		references: [directusFiles.id]
	}),
}));

export const stickersRelations = relations(stickers, ({one}) => ({
	directusUser_userCreated: one(directusUsers, {
		fields: [stickers.userCreated],
		references: [directusUsers.id],
		relationName: "stickers_userCreated_directusUsers_id"
	}),
	directusUser_userUpdated: one(directusUsers, {
		fields: [stickers.userUpdated],
		references: [directusUsers.id],
		relationName: "stickers_userUpdated_directusUsers_id"
	}),
	directusFile: one(directusFiles, {
		fields: [stickers.image],
		references: [directusFiles.id]
	}),
}));

export const directusUsersRelations = relations(directusUsers, ({one, many}) => ({
	stickers_userCreated: many(stickers, {
		relationName: "stickers_userCreated_directusUsers_id"
	}),
	stickers_userUpdated: many(stickers, {
		relationName: "stickers_userUpdated_directusUsers_id"
	}),
	boards_userCreated: many(board, {
		relationName: "board_userCreated_directusUsers_id"
	}),
	boards_userUpdated: many(board, {
		relationName: "board_userUpdated_directusUsers_id"
	}),
	boardMembers: many(boardMembers),
	directusAccesses: many(directusAccess),
	directusComments_userCreated: many(directusComments, {
		relationName: "directusComments_userCreated_directusUsers_id"
	}),
	directusComments_userUpdated: many(directusComments, {
		relationName: "directusComments_userUpdated_directusUsers_id"
	}),
	directusDashboards: many(directusDashboards),
	directusFiles_uploadedBy: many(directusFiles, {
		relationName: "directusFiles_uploadedBy_directusUsers_id"
	}),
	directusFiles_modifiedBy: many(directusFiles, {
		relationName: "directusFiles_modifiedBy_directusUsers_id"
	}),
	directusFlows: many(directusFlows),
	directusPanels: many(directusPanels),
	directusPresets: many(directusPresets),
	directusShares: many(directusShares),
	directusNotifications_recipient: many(directusNotifications, {
		relationName: "directusNotifications_recipient_directusUsers_id"
	}),
	directusNotifications_sender: many(directusNotifications, {
		relationName: "directusNotifications_sender_directusUsers_id"
	}),
	directusOperations: many(directusOperations),
	directusVersions_userCreated: many(directusVersions, {
		relationName: "directusVersions_userCreated_directusUsers_id"
	}),
	directusVersions_userUpdated: many(directusVersions, {
		relationName: "directusVersions_userUpdated_directusUsers_id"
	}),
	introBlogs_userCreated: many(introBlogs, {
		relationName: "introBlogs_userCreated_directusUsers_id"
	}),
	introBlogs_userUpdated: many(introBlogs, {
		relationName: "introBlogs_userUpdated_directusUsers_id"
	}),
	eventSignups: many(eventSignups),
	eventsDirectusUsers: many(eventsDirectusUsers),
	introBlogLikes: many(introBlogLikes),
	heroBanners: many(heroBanners),
	membershipHistories: many(membershipHistory),
	pushNotifications: many(pushNotification),
	pubCrawlSignups: many(pubCrawlSignups),
	introPlannings_userCreated: many(introPlanning, {
		relationName: "introPlanning_userCreated_directusUsers_id"
	}),
	introPlannings_userUpdated: many(introPlanning, {
		relationName: "introPlanning_userUpdated_directusUsers_id"
	}),
	introParentSignups_userCreated: many(introParentSignups, {
		relationName: "introParentSignups_userCreated_directusUsers_id"
	}),
	introParentSignups_userUpdated: many(introParentSignups, {
		relationName: "introParentSignups_userUpdated_directusUsers_id"
	}),
	introParentSignups_userId: many(introParentSignups, {
		relationName: "introParentSignups_userId_directusUsers_id"
	}),
	introParentSignups_approvedBy: many(introParentSignups, {
		relationName: "introParentSignups_approvedBy_directusUsers_id"
	}),
	tripSignups: many(tripSignups),
	safeHavens: many(safeHavens),
	directusSessions: many(directusSessions),
	transactions_userId: many(transactions, {
		relationName: "transactions_userId_directusUsers_id"
	}),
	transactions_approvedBy: many(transactions, {
		relationName: "transactions_approvedBy_directusUsers_id"
	}),
	authAccounts: many(authAccounts),
	authSessions: many(authSessions),
	committeeMembers: many(committeeMembers),
	introPlanningSignups: many(introPlanningSignups),
	directusRole: one(directusRoles, {
		fields: [directusUsers.role],
		references: [directusRoles.id]
	}),
	directusDeployments: many(directusDeployments),
	directusDeploymentProjects: many(directusDeploymentProjects),
	directusDeploymentRuns: many(directusDeploymentRuns),
	webshopPreorders: many(webshopPreorders),
}));

export const directusFilesRelations = relations(directusFiles, ({one, many}) => ({
	stickers: many(stickers),
	boards: many(board),
	contacts: many(contacts),
	committees: many(committees),
	directusFolder: one(directusFolders, {
		fields: [directusFiles.folder],
		references: [directusFolders.id]
	}),
	directusUser_uploadedBy: one(directusUsers, {
		fields: [directusFiles.uploadedBy],
		references: [directusUsers.id],
		relationName: "directusFiles_uploadedBy_directusUsers_id"
	}),
	directusUser_modifiedBy: one(directusUsers, {
		fields: [directusFiles.modifiedBy],
		references: [directusUsers.id],
		relationName: "directusFiles_modifiedBy_directusUsers_id"
	}),
	introBlogs: many(introBlogs),
	documents: many(documents),
	events: many(events),
	heroBanners: many(heroBanners),
	introBlogGalleries: many(introBlogGallery),
	pubCrawlEvents: many(pubCrawlEvents),
	trips: many(trips),
	tripActivities: many(tripActivities),
	safeHavens: many(safeHavens),
	sponsors: many(sponsors),
	clubs: many(clubs),
	webshopProductMedias: many(webshopProductMedia),
	directusSettings_projectLogo: many(directusSettings, {
		relationName: "directusSettings_projectLogo_directusFiles_id"
	}),
	directusSettings_publicForeground: many(directusSettings, {
		relationName: "directusSettings_publicForeground_directusFiles_id"
	}),
	directusSettings_publicBackground: many(directusSettings, {
		relationName: "directusSettings_publicBackground_directusFiles_id"
	}),
	directusSettings_publicFavicon: many(directusSettings, {
		relationName: "directusSettings_publicFavicon_directusFiles_id"
	}),
}));

export const boardRelations = relations(board, ({one, many}) => ({
	directusUser_userCreated: one(directusUsers, {
		fields: [board.userCreated],
		references: [directusUsers.id],
		relationName: "board_userCreated_directusUsers_id"
	}),
	directusUser_userUpdated: one(directusUsers, {
		fields: [board.userUpdated],
		references: [directusUsers.id],
		relationName: "board_userUpdated_directusUsers_id"
	}),
	directusFile: one(directusFiles, {
		fields: [board.image],
		references: [directusFiles.id]
	}),
	boardMembers: many(boardMembers),
}));

export const boardMembersRelations = relations(boardMembers, ({one}) => ({
	board: one(board, {
		fields: [boardMembers.boardId],
		references: [board.id]
	}),
	directusUser: one(directusUsers, {
		fields: [boardMembers.userId],
		references: [directusUsers.id]
	}),
}));

export const contactsRelations = relations(contacts, ({one}) => ({
	directusFile: one(directusFiles, {
		fields: [contacts.image],
		references: [directusFiles.id]
	}),
}));

export const directusAccessRelations = relations(directusAccess, ({one}) => ({
	directusRole: one(directusRoles, {
		fields: [directusAccess.role],
		references: [directusRoles.id]
	}),
	directusUser: one(directusUsers, {
		fields: [directusAccess.user],
		references: [directusUsers.id]
	}),
	directusPolicy: one(directusPolicies, {
		fields: [directusAccess.policy],
		references: [directusPolicies.id]
	}),
}));

export const directusRolesRelations = relations(directusRoles, ({one, many}) => ({
	directusAccesses: many(directusAccess),
	directusPresets: many(directusPresets),
	directusRole: one(directusRoles, {
		fields: [directusRoles.parent],
		references: [directusRoles.id],
		relationName: "directusRoles_parent_directusRoles_id"
	}),
	directusRoles: many(directusRoles, {
		relationName: "directusRoles_parent_directusRoles_id"
	}),
	directusShares: many(directusShares),
	directusUsers: many(directusUsers),
	directusSettings: many(directusSettings),
}));

export const directusPoliciesRelations = relations(directusPolicies, ({many}) => ({
	directusAccesses: many(directusAccess),
	directusPermissions: many(directusPermissions),
}));

export const committeesRelations = relations(committees, ({one, many}) => ({
	directusFile: one(directusFiles, {
		fields: [committees.image],
		references: [directusFiles.id]
	}),
	events: many(events),
	committeeMembers: many(committeeMembers),
}));

export const directusCommentsRelations = relations(directusComments, ({one}) => ({
	directusUser_userCreated: one(directusUsers, {
		fields: [directusComments.userCreated],
		references: [directusUsers.id],
		relationName: "directusComments_userCreated_directusUsers_id"
	}),
	directusUser_userUpdated: one(directusUsers, {
		fields: [directusComments.userUpdated],
		references: [directusUsers.id],
		relationName: "directusComments_userUpdated_directusUsers_id"
	}),
}));

export const directusDashboardsRelations = relations(directusDashboards, ({one, many}) => ({
	directusUser: one(directusUsers, {
		fields: [directusDashboards.userCreated],
		references: [directusUsers.id]
	}),
	directusPanels: many(directusPanels),
}));

export const directusFoldersRelations = relations(directusFolders, ({one, many}) => ({
	directusFolder: one(directusFolders, {
		fields: [directusFolders.parent],
		references: [directusFolders.id],
		relationName: "directusFolders_parent_directusFolders_id"
	}),
	directusFolders: many(directusFolders, {
		relationName: "directusFolders_parent_directusFolders_id"
	}),
	directusFiles: many(directusFiles),
	directusSettings: many(directusSettings),
}));

export const directusCollectionsRelations = relations(directusCollections, ({one, many}) => ({
	directusCollection: one(directusCollections, {
		fields: [directusCollections.group],
		references: [directusCollections.collection],
		relationName: "directusCollections_group_directusCollections_collection"
	}),
	directusCollections: many(directusCollections, {
		relationName: "directusCollections_group_directusCollections_collection"
	}),
	directusShares: many(directusShares),
	directusVersions: many(directusVersions),
}));

export const directusFlowsRelations = relations(directusFlows, ({one, many}) => ({
	directusUser: one(directusUsers, {
		fields: [directusFlows.userCreated],
		references: [directusUsers.id]
	}),
	directusOperations: many(directusOperations),
}));

export const directusPanelsRelations = relations(directusPanels, ({one}) => ({
	directusDashboard: one(directusDashboards, {
		fields: [directusPanels.dashboard],
		references: [directusDashboards.id]
	}),
	directusUser: one(directusUsers, {
		fields: [directusPanels.userCreated],
		references: [directusUsers.id]
	}),
}));

export const directusPermissionsRelations = relations(directusPermissions, ({one}) => ({
	directusPolicy: one(directusPolicies, {
		fields: [directusPermissions.policy],
		references: [directusPolicies.id]
	}),
}));

export const directusPresetsRelations = relations(directusPresets, ({one}) => ({
	directusUser: one(directusUsers, {
		fields: [directusPresets.user],
		references: [directusUsers.id]
	}),
	directusRole: one(directusRoles, {
		fields: [directusPresets.role],
		references: [directusRoles.id]
	}),
}));

export const directusRevisionsRelations = relations(directusRevisions, ({one, many}) => ({
	directusActivity: one(directusActivity, {
		fields: [directusRevisions.activity],
		references: [directusActivity.id]
	}),
	directusVersion: one(directusVersions, {
		fields: [directusRevisions.version],
		references: [directusVersions.id]
	}),
	directusRevision: one(directusRevisions, {
		fields: [directusRevisions.parent],
		references: [directusRevisions.id],
		relationName: "directusRevisions_parent_directusRevisions_id"
	}),
	directusRevisions: many(directusRevisions, {
		relationName: "directusRevisions_parent_directusRevisions_id"
	}),
}));

export const directusActivityRelations = relations(directusActivity, ({many}) => ({
	directusRevisions: many(directusRevisions),
}));

export const directusVersionsRelations = relations(directusVersions, ({one, many}) => ({
	directusRevisions: many(directusRevisions),
	directusCollection: one(directusCollections, {
		fields: [directusVersions.collection],
		references: [directusCollections.collection]
	}),
	directusUser_userCreated: one(directusUsers, {
		fields: [directusVersions.userCreated],
		references: [directusUsers.id],
		relationName: "directusVersions_userCreated_directusUsers_id"
	}),
	directusUser_userUpdated: one(directusUsers, {
		fields: [directusVersions.userUpdated],
		references: [directusUsers.id],
		relationName: "directusVersions_userUpdated_directusUsers_id"
	}),
}));

export const directusSharesRelations = relations(directusShares, ({one, many}) => ({
	directusCollection: one(directusCollections, {
		fields: [directusShares.collection],
		references: [directusCollections.collection]
	}),
	directusRole: one(directusRoles, {
		fields: [directusShares.role],
		references: [directusRoles.id]
	}),
	directusUser: one(directusUsers, {
		fields: [directusShares.userCreated],
		references: [directusUsers.id]
	}),
	directusSessions: many(directusSessions),
}));

export const directusNotificationsRelations = relations(directusNotifications, ({one}) => ({
	directusUser_recipient: one(directusUsers, {
		fields: [directusNotifications.recipient],
		references: [directusUsers.id],
		relationName: "directusNotifications_recipient_directusUsers_id"
	}),
	directusUser_sender: one(directusUsers, {
		fields: [directusNotifications.sender],
		references: [directusUsers.id],
		relationName: "directusNotifications_sender_directusUsers_id"
	}),
}));

export const directusOperationsRelations = relations(directusOperations, ({one, many}) => ({
	directusFlow: one(directusFlows, {
		fields: [directusOperations.flow],
		references: [directusFlows.id]
	}),
	directusUser: one(directusUsers, {
		fields: [directusOperations.userCreated],
		references: [directusUsers.id]
	}),
	directusOperation_reject: one(directusOperations, {
		fields: [directusOperations.reject],
		references: [directusOperations.id],
		relationName: "directusOperations_reject_directusOperations_id"
	}),
	directusOperations_reject: many(directusOperations, {
		relationName: "directusOperations_reject_directusOperations_id"
	}),
	directusOperation_resolve: one(directusOperations, {
		fields: [directusOperations.resolve],
		references: [directusOperations.id],
		relationName: "directusOperations_resolve_directusOperations_id"
	}),
	directusOperations_resolve: many(directusOperations, {
		relationName: "directusOperations_resolve_directusOperations_id"
	}),
}));

export const introBlogsRelations = relations(introBlogs, ({one, many}) => ({
	directusUser_userCreated: one(directusUsers, {
		fields: [introBlogs.userCreated],
		references: [directusUsers.id],
		relationName: "introBlogs_userCreated_directusUsers_id"
	}),
	directusUser_userUpdated: one(directusUsers, {
		fields: [introBlogs.userUpdated],
		references: [directusUsers.id],
		relationName: "introBlogs_userUpdated_directusUsers_id"
	}),
	directusFile: one(directusFiles, {
		fields: [introBlogs.image],
		references: [directusFiles.id]
	}),
	introBlogLikes: many(introBlogLikes),
	introBlogGalleries: many(introBlogGallery),
}));

export const documentsRelations = relations(documents, ({one}) => ({
	directusFile: one(directusFiles, {
		fields: [documents.file],
		references: [directusFiles.id]
	}),
}));

export const eventsRelations = relations(events, ({one, many}) => ({
	committee: one(committees, {
		fields: [events.committeeId],
		references: [committees.id]
	}),
	directusFile: one(directusFiles, {
		fields: [events.image],
		references: [directusFiles.id]
	}),
	eventSignups: many(eventSignups),
	eventsDirectusUsers: many(eventsDirectusUsers),
	eventsMembers: many(eventsMembers),
}));

export const eventSignupsRelations = relations(eventSignups, ({one, many}) => ({
	event: one(events, {
		fields: [eventSignups.eventId],
		references: [events.id]
	}),
	directusUser: one(directusUsers, {
		fields: [eventSignups.directusRelations],
		references: [directusUsers.id]
	}),
	transactions: many(transactions),
}));

export const eventsDirectusUsersRelations = relations(eventsDirectusUsers, ({one}) => ({
	event: one(events, {
		fields: [eventsDirectusUsers.eventsId],
		references: [events.id]
	}),
	directusUser: one(directusUsers, {
		fields: [eventsDirectusUsers.directusUsersId],
		references: [directusUsers.id]
	}),
}));

export const introBlogLikesRelations = relations(introBlogLikes, ({one}) => ({
	introBlog: one(introBlogs, {
		fields: [introBlogLikes.blog],
		references: [introBlogs.id]
	}),
	directusUser: one(directusUsers, {
		fields: [introBlogLikes.userId],
		references: [directusUsers.id]
	}),
}));

export const eventsMembersRelations = relations(eventsMembers, ({one}) => ({
	event: one(events, {
		fields: [eventsMembers.eventsId],
		references: [events.id]
	}),
}));

export const heroBannersRelations = relations(heroBanners, ({one}) => ({
	directusUser: one(directusUsers, {
		fields: [heroBanners.userCreated],
		references: [directusUsers.id]
	}),
	directusFile: one(directusFiles, {
		fields: [heroBanners.image],
		references: [directusFiles.id]
	}),
}));

export const introBlogGalleryRelations = relations(introBlogGallery, ({one}) => ({
	introBlog: one(introBlogs, {
		fields: [introBlogGallery.introBlogId],
		references: [introBlogs.id]
	}),
	directusFile: one(directusFiles, {
		fields: [introBlogGallery.directusFilesId],
		references: [directusFiles.id]
	}),
}));

export const pubCrawlEventsRelations = relations(pubCrawlEvents, ({one, many}) => ({
	directusFile: one(directusFiles, {
		fields: [pubCrawlEvents.image],
		references: [directusFiles.id]
	}),
	pubCrawlSignups: many(pubCrawlSignups),
}));

export const membershipHistoryRelations = relations(membershipHistory, ({one}) => ({
	directusUser: one(directusUsers, {
		fields: [membershipHistory.userId],
		references: [directusUsers.id]
	}),
}));

export const pubCrawlSignupsTransactionsRelations = relations(pubCrawlSignupsTransactions, ({one}) => ({
	pubCrawlSignup: one(pubCrawlSignups, {
		fields: [pubCrawlSignupsTransactions.pubCrawlSignupsId],
		references: [pubCrawlSignups.id]
	}),
	transaction: one(transactions, {
		fields: [pubCrawlSignupsTransactions.transactionsId],
		references: [transactions.id]
	}),
}));

export const pubCrawlSignupsRelations = relations(pubCrawlSignups, ({one, many}) => ({
	pubCrawlSignupsTransactions: many(pubCrawlSignupsTransactions),
	pubCrawlEvent: one(pubCrawlEvents, {
		fields: [pubCrawlSignups.pubCrawlEventId],
		references: [pubCrawlEvents.id]
	}),
	directusUser: one(directusUsers, {
		fields: [pubCrawlSignups.directusRelations],
		references: [directusUsers.id]
	}),
	pubCrawlTickets: many(pubCrawlTickets),
	transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({one, many}) => ({
	pubCrawlSignupsTransactions: many(pubCrawlSignupsTransactions),
	directusUser_userId: one(directusUsers, {
		fields: [transactions.userId],
		references: [directusUsers.id],
		relationName: "transactions_userId_directusUsers_id"
	}),
	eventSignup: one(eventSignups, {
		fields: [transactions.registration],
		references: [eventSignups.id]
	}),
	directusUser_approvedBy: one(directusUsers, {
		fields: [transactions.approvedBy],
		references: [directusUsers.id],
		relationName: "transactions_approvedBy_directusUsers_id"
	}),
	pubCrawlSignup: one(pubCrawlSignups, {
		fields: [transactions.pubCrawlSignup],
		references: [pubCrawlSignups.id]
	}),
	tripSignup: one(tripSignups, {
		fields: [transactions.tripSignup],
		references: [tripSignups.id]
	}),
	webshopPreorder: one(webshopPreorders, {
		fields: [transactions.webshopPreorder],
		references: [webshopPreorders.id]
	}),
}));

export const pushNotificationRelations = relations(pushNotification, ({one}) => ({
	directusUser: one(directusUsers, {
		fields: [pushNotification.userId],
		references: [directusUsers.id]
	}),
}));

export const introPlanningRelations = relations(introPlanning, ({one, many}) => ({
	directusUser_userCreated: one(directusUsers, {
		fields: [introPlanning.userCreated],
		references: [directusUsers.id],
		relationName: "introPlanning_userCreated_directusUsers_id"
	}),
	directusUser_userUpdated: one(directusUsers, {
		fields: [introPlanning.userUpdated],
		references: [directusUsers.id],
		relationName: "introPlanning_userUpdated_directusUsers_id"
	}),
	introPlanningSignups: many(introPlanningSignups),
}));

export const pubCrawlTicketsRelations = relations(pubCrawlTickets, ({one}) => ({
	pubCrawlSignup: one(pubCrawlSignups, {
		fields: [pubCrawlTickets.signupId],
		references: [pubCrawlSignups.id]
	}),
}));

export const introParentSignupsRelations = relations(introParentSignups, ({one}) => ({
	directusUser_userCreated: one(directusUsers, {
		fields: [introParentSignups.userCreated],
		references: [directusUsers.id],
		relationName: "introParentSignups_userCreated_directusUsers_id"
	}),
	directusUser_userUpdated: one(directusUsers, {
		fields: [introParentSignups.userUpdated],
		references: [directusUsers.id],
		relationName: "introParentSignups_userUpdated_directusUsers_id"
	}),
	directusUser_userId: one(directusUsers, {
		fields: [introParentSignups.userId],
		references: [directusUsers.id],
		relationName: "introParentSignups_userId_directusUsers_id"
	}),
	directusUser_approvedBy: one(directusUsers, {
		fields: [introParentSignups.approvedBy],
		references: [directusUsers.id],
		relationName: "introParentSignups_approvedBy_directusUsers_id"
	}),
}));

export const tripsRelations = relations(trips, ({one, many}) => ({
	directusFile: one(directusFiles, {
		fields: [trips.image],
		references: [directusFiles.id]
	}),
	tripSignups: many(tripSignups),
	tripActivities: many(tripActivities),
}));

export const tripSignupsRelations = relations(tripSignups, ({one, many}) => ({
	trip: one(trips, {
		fields: [tripSignups.tripId],
		references: [trips.id]
	}),
	directusUser: one(directusUsers, {
		fields: [tripSignups.directusRelations],
		references: [directusUsers.id]
	}),
	tripSignupActivities: many(tripSignupActivities),
	transactions: many(transactions),
}));

export const tripActivitiesRelations = relations(tripActivities, ({one, many}) => ({
	trip: one(trips, {
		fields: [tripActivities.tripId],
		references: [trips.id]
	}),
	directusFile: one(directusFiles, {
		fields: [tripActivities.image],
		references: [directusFiles.id]
	}),
	tripSignupActivities: many(tripSignupActivities),
}));

export const tripSignupActivitiesRelations = relations(tripSignupActivities, ({one}) => ({
	tripSignup: one(tripSignups, {
		fields: [tripSignupActivities.tripSignupId],
		references: [tripSignups.id]
	}),
	tripActivity: one(tripActivities, {
		fields: [tripSignupActivities.tripActivityId],
		references: [tripActivities.id]
	}),
}));

export const safeHavensRelations = relations(safeHavens, ({one}) => ({
	directusFile: one(directusFiles, {
		fields: [safeHavens.image],
		references: [directusFiles.id]
	}),
	directusUser: one(directusUsers, {
		fields: [safeHavens.userId],
		references: [directusUsers.id]
	}),
}));

export const sponsorsRelations = relations(sponsors, ({one}) => ({
	directusFile: one(directusFiles, {
		fields: [sponsors.image],
		references: [directusFiles.id]
	}),
}));

export const directusSessionsRelations = relations(directusSessions, ({one}) => ({
	directusUser: one(directusUsers, {
		fields: [directusSessions.user],
		references: [directusUsers.id]
	}),
	directusShare: one(directusShares, {
		fields: [directusSessions.share],
		references: [directusShares.id]
	}),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({one}) => ({
	role: one(roles, {
		fields: [rolePermissions.roleId],
		references: [roles.id]
	}),
	permission: one(permissions, {
		fields: [rolePermissions.permissionId],
		references: [permissions.id]
	}),
}));

export const rolesRelations = relations(roles, ({many}) => ({
	rolePermissions: many(rolePermissions),
}));

export const permissionsRelations = relations(permissions, ({many}) => ({
	rolePermissions: many(rolePermissions),
}));

export const webshopPreordersRelations = relations(webshopPreorders, ({one, many}) => ({
	transactions: many(transactions),
	directusUser: one(directusUsers, {
		fields: [webshopPreorders.userId],
		references: [directusUsers.id]
	}),
	webshopDropWindow: one(webshopDropWindows, {
		fields: [webshopPreorders.dropWindowId],
		references: [webshopDropWindows.id]
	}),
	webshopPreorderLines: many(webshopPreorderLines),
}));

export const authAccountsRelations = relations(authAccounts, ({one}) => ({
	directusUser: one(directusUsers, {
		fields: [authAccounts.userId],
		references: [directusUsers.id]
	}),
}));

export const authSessionsRelations = relations(authSessions, ({one}) => ({
	directusUser: one(directusUsers, {
		fields: [authSessions.userId],
		references: [directusUsers.id]
	}),
}));

export const committeeMembersRelations = relations(committeeMembers, ({one}) => ({
	committee: one(committees, {
		fields: [committeeMembers.committeeId],
		references: [committees.id]
	}),
	directusUser: one(directusUsers, {
		fields: [committeeMembers.userId],
		references: [directusUsers.id]
	}),
}));

export const introPlanningSignupsRelations = relations(introPlanningSignups, ({one}) => ({
	introPlanning: one(introPlanning, {
		fields: [introPlanningSignups.introPlanningId],
		references: [introPlanning.id]
	}),
	introSignup: one(introSignups, {
		fields: [introPlanningSignups.introSignupId],
		references: [introSignups.id]
	}),
	directusUser: one(directusUsers, {
		fields: [introPlanningSignups.userId],
		references: [directusUsers.id]
	}),
}));

export const introSignupsRelations = relations(introSignups, ({many}) => ({
	introPlanningSignups: many(introPlanningSignups),
}));

export const directusDeploymentsRelations = relations(directusDeployments, ({one, many}) => ({
	directusUser: one(directusUsers, {
		fields: [directusDeployments.userCreated],
		references: [directusUsers.id]
	}),
	directusDeploymentProjects: many(directusDeploymentProjects),
}));

export const webshopProductMediaRelations = relations(webshopProductMedia, ({one}) => ({
	webshopProduct: one(webshopProducts, {
		fields: [webshopProductMedia.productId],
		references: [webshopProducts.id]
	}),
	directusFile: one(directusFiles, {
		fields: [webshopProductMedia.asset],
		references: [directusFiles.id]
	}),
}));

export const webshopProductsRelations = relations(webshopProducts, ({one, many}) => ({
	webshopProductMedias: many(webshopProductMedia),
	webshopProductVariants: many(webshopProductVariants),
	webshopPreorderLines: many(webshopPreorderLines),
	webshopDropWindow: one(webshopDropWindows, {
		fields: [webshopProducts.dropWindowId],
		references: [webshopDropWindows.id]
	}),
}));

export const directusDeploymentProjectsRelations = relations(directusDeploymentProjects, ({one, many}) => ({
	directusDeployment: one(directusDeployments, {
		fields: [directusDeploymentProjects.deployment],
		references: [directusDeployments.id]
	}),
	directusUser: one(directusUsers, {
		fields: [directusDeploymentProjects.userCreated],
		references: [directusUsers.id]
	}),
	directusDeploymentRuns: many(directusDeploymentRuns),
}));

export const directusSettingsRelations = relations(directusSettings, ({one}) => ({
	directusFile_projectLogo: one(directusFiles, {
		fields: [directusSettings.projectLogo],
		references: [directusFiles.id],
		relationName: "directusSettings_projectLogo_directusFiles_id"
	}),
	directusFile_publicForeground: one(directusFiles, {
		fields: [directusSettings.publicForeground],
		references: [directusFiles.id],
		relationName: "directusSettings_publicForeground_directusFiles_id"
	}),
	directusFile_publicBackground: one(directusFiles, {
		fields: [directusSettings.publicBackground],
		references: [directusFiles.id],
		relationName: "directusSettings_publicBackground_directusFiles_id"
	}),
	directusFolder: one(directusFolders, {
		fields: [directusSettings.storageDefaultFolder],
		references: [directusFolders.id]
	}),
	directusFile_publicFavicon: one(directusFiles, {
		fields: [directusSettings.publicFavicon],
		references: [directusFiles.id],
		relationName: "directusSettings_publicFavicon_directusFiles_id"
	}),
	directusRole: one(directusRoles, {
		fields: [directusSettings.publicRegistrationRole],
		references: [directusRoles.id]
	}),
}));

export const directusDeploymentRunsRelations = relations(directusDeploymentRuns, ({one}) => ({
	directusDeploymentProject: one(directusDeploymentProjects, {
		fields: [directusDeploymentRuns.project],
		references: [directusDeploymentProjects.id]
	}),
	directusUser: one(directusUsers, {
		fields: [directusDeploymentRuns.userCreated],
		references: [directusUsers.id]
	}),
}));

export const webshopProductVariantsRelations = relations(webshopProductVariants, ({one, many}) => ({
	webshopProduct: one(webshopProducts, {
		fields: [webshopProductVariants.productId],
		references: [webshopProducts.id]
	}),
	webshopPreorderLines: many(webshopPreorderLines),
}));

export const webshopDropWindowsRelations = relations(webshopDropWindows, ({many}) => ({
	webshopPreorders: many(webshopPreorders),
	webshopProducts: many(webshopProducts),
}));

export const webshopPreorderLinesRelations = relations(webshopPreorderLines, ({one}) => ({
	webshopPreorder: one(webshopPreorders, {
		fields: [webshopPreorderLines.preorderId],
		references: [webshopPreorders.id]
	}),
	webshopProduct: one(webshopProducts, {
		fields: [webshopPreorderLines.productId],
		references: [webshopProducts.id]
	}),
	webshopProductVariant: one(webshopProductVariants, {
		fields: [webshopPreorderLines.variantId],
		references: [webshopProductVariants.id]
	}),
}));