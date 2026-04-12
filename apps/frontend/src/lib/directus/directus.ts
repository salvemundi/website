import 'server-only';
import { createDirectus, rest, staticToken } from '@directus/sdk';
import { type DirectusSchema } from '@salvemundi/validations/directus/schema';

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
                // Add a highly unique version query param to bypass any internal/proxy cache
                const cacheBuster = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
                urlObj.searchParams.set('v', cacheBuster);
                const urlStr = urlObj.toString();
                

                // Add next tags for sticker-related items to enable granular revalidation
                const nextOptions = (options as any)?.next || {};
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

                const requestInit: RequestInit = {
                    ...options,
                    headers: {
                        ...(options?.headers as Record<string, string>),
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache',
                        'Expires': '0',
                    },
                    cache: 'no-store',
                    next: {
                        ...nextOptions,
                        tags,
                        revalidate: 0
                    },
                    signal: AbortSignal.timeout(15000),
                };

                return fetch(urlStr, requestInit);
            }
        }
    })
        .with(staticToken(process.env.DIRECTUS_STATIC_TOKEN!))
        .with(rest());
}

// getUserDirectus deleted as per "no user token" policy.
