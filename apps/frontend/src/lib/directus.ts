import { createDirectus, rest, staticToken } from '@directus/sdk';
import { DirectusSchema } from './schema';

const directusUrl = process.env.DIRECTUS_SERVICE_URL!;

/**
 * Get a Directus client with system-level permissions.
 * Used for public data or background tasks.
 */
export function getSystemDirectus() {
    return createDirectus<DirectusSchema>(directusUrl)
        .with(staticToken(process.env.DIRECTUS_STATIC_TOKEN!))
        .with(rest());
}

/**
 * Get a Directus client with user-level permissions.
 * Used in Server Actions when a user is authenticated.
 */
export function getUserDirectus(userToken: string) {
    return createDirectus<DirectusSchema>(directusUrl)
        .with(staticToken(userToken))
        .with(rest());
}