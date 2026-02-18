/**
 * @deprecated Use specialized barrel exports instead for better tree-shaking and HMR performance
 * 
 * MIGRATION GUIDE:
 * - Use './models' for types/interfaces
 * - Use './utilities' for helper functions (getImageUrl, utils)
 * - Use './activities.barrel' for events/activities APIs
 * - Use './organization.barrel' for organization-related APIs (committees, members, jobs, board)
 * - Use './social.barrel' for social/community APIs (clubs, pub-crawl, sponsors, whatsapp, safe-havens)
 * - Use './experiences.barrel' for trips and intro programs
 * - Use './user-data.barrel' for user management (payments, stickers, transactions, documents, settings)
 * 
 * This file is kept for backward compatibility but creates a large dependency graph.
 * It's recommended to import from specific barrel files or individual modules directly.
 */

// Models and types
export * from './models';

// Utilities
export * from './utilities';

// Activities and Events
export * from './activities.barrel';

// Organization
export * from './organization.barrel';

// Social and Community
export * from './social.barrel';

// Experiences and Trips
export * from './experiences.barrel';

// User Data and Management
export * from './user-data.barrel';
