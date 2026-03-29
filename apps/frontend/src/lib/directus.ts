import { createDirectus, rest, staticToken } from '@directus/sdk';
import { type DirectusSchema } from '@salvemundi/validations';

const directusUrl = process.env.DIRECTUS_SERVICE_URL!;

/**
 * Get a Directus client with system-level permissions.
 * Used for public data or background tasks.
 */
export function getSystemDirectus() {
    return createDirectus<DirectusSchema>(directusUrl, {
        globals: {
            fetch: (url, options) => {
                const urlStr = url.toString();
                // Add next tags for sticker-related items to enable granular revalidation
                const nextOptions: any = (options as any)?.next || {};
                const tags: string[] = nextOptions.tags || [];

                if (urlStr.includes('/items/Stickers') && !tags.includes('stickers')) {
                    tags.push('stickers');
                }
                if (urlStr.includes('/items/feature_flags') && !tags.includes('feature_flags')) {
                    tags.push('feature_flags');
                }

                nextOptions.tags = tags;

                return fetch(url, {
                    ...options,
                    headers: {
                        ...(options as any)?.headers,
                        'Cache-Control': 'no-cache', // Bypass Directus internal API cache
                    },
                    cache: 'no-store', // Always fetch fresh data from Directus to avoid frozen status polling
                    next: nextOptions,
                    signal: AbortSignal.timeout(10000),
                } as any);
            }
        }
    })
        .with(staticToken(process.env.DIRECTUS_STATIC_TOKEN!))
        .with(rest());
}

// getUserDirectus deleted as per "no user token" policy.