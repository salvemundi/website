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
                const urlObj = new URL(url.toString());
                // Add a unique version query param to bypass any internal/proxy cache on the URL itself
                urlObj.searchParams.set('v', Date.now().toString());
                const urlStr = urlObj.toString();
                
                // Add next tags for sticker-related items to enable granular revalidation
                const nextOptions: any = (options as any)?.next || {};
                const tags: string[] = nextOptions.tags || [];

                if (urlStr.includes('/items/Stickers') && !tags.includes('stickers')) {
                    tags.push('stickers');
                }
                if (urlStr.includes('/items/feature_flags') && !tags.includes('feature_flags')) {
                    tags.push('feature_flags');
                }
                if ((urlStr.includes('/items/trip_signups') || urlStr.includes('/items/trips')) && !tags.includes('reis-status')) {
                    tags.push('reis-status');
                }

                nextOptions.tags = tags;
                nextOptions.revalidate = 0; // Strictly bypass any Data Cache

                return fetch(urlStr, {
                    ...options,
                    headers: {
                        ...(options as any)?.headers,
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache',
                        'Expires': '0',
                    },
                    cache: 'no-store', // Always fetch fresh data from Directus to avoid frozen status polling
                    next: {
                        ...nextOptions,
                        revalidate: 0 // Strictly bypass any Data Cache
                    },
                    signal: AbortSignal.timeout(10000),
                } as any);
            }
        }
    })
        .with(staticToken(process.env.DIRECTUS_STATIC_TOKEN!))
        .with(rest());
}

// getUserDirectus deleted as per "no user token" policy.