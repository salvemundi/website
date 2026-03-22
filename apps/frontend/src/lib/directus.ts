import { createDirectus, rest, staticToken } from '@directus/sdk';
import { DirectusSchema } from './schema';

const directusUrl = process.env.INTERNAL_DIRECTUS_URL!;

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

/**
 * LEGACY / COMPATIBILITY EXPORTS
 * These are deprecated and should be replaced with getSystemDirectus() or getUserDirectus().
 */
export const directus = getSystemDirectus();
export async function directusRequest<T>(options: any): Promise<T> {
    return (directus.request as any)(options);
}
