import { createDirectus, rest, staticToken, RestCommand } from '@directus/sdk';
import { DirectusSchema } from './schema';

/**
 * Directus utility for V7.
 * Provides the official SDK client configured for internal use.
 */

const directusUrl = process.env.INTERNAL_DIRECTUS_URL!;

const getDirectusToken = () => process.env.DIRECTUS_STATIC_TOKEN!;

export const directus = createDirectus<DirectusSchema>(directusUrl)
    .with(staticToken(getDirectusToken()))
    .with(rest());

/**
 * Centralized request wrapper for Directus.
 * Logs duration and status for better observability.
 */
export async function directusRequest<T>(request: RestCommand<T, DirectusSchema>): Promise<T> {
    const start = Date.now();
    try {
        const result = await directus.request(request);
        const duration = Date.now() - start;
        
        // Only log in development or if DEBUG is enabled
        if (process.env.NODE_ENV !== 'production' || process.env.DEBUG_DIRECTUS === 'true') {
            console.log(`[DIRECTUS] Request successful - ${duration}ms`);
        }
        
        return result as T;
    } catch (error: any) {
        const duration = Date.now() - start;
        console.error(`[DIRECTUS] Request failed after ${duration}ms:`, error?.message || error);
        throw error;
    }
}
