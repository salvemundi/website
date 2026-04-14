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
                const urlStr = url.toString();
                
                const nextOptions = (options as any)?.next || {};
                const tags: string[] = nextOptions.tags || [];

                // ─── TIERED REVALIDATION STRATEGY ────────────────────────────────
                // If revalidate is not explicitly set, determine it based on URL
                let revalidate = nextOptions.revalidate;

                if (revalidate === undefined) {
                    if (urlStr.includes('/items/Stickers') || urlStr.includes('/items/feature_flags')) {
                        revalidate = 1; // Tier 1: Critical
                    } else if (urlStr.includes('/items/events') || urlStr.includes('/items/news')) {
                        revalidate = 60; // Tier 2: Fast
                    } else if (
                        urlStr.includes('/items/hero_banners') || 
                        urlStr.includes('/items/sponsors') || 
                        urlStr.includes('/items/committees')
                    ) {
                        revalidate = 3600; // Tier 3: Stable (Banners per user request)
                    } else {
                        revalidate = 300; // Default: 5 minutes
                    }
                }

                // Add next tags for granular revalidation support
                if (urlStr.includes('/items/Stickers') && !tags.includes('stickers')) tags.push('stickers');
                if (urlStr.includes('/items/feature_flags') && !tags.includes('feature_flags')) tags.push('feature_flags');
                if ((urlStr.includes('/items/trip_signups') || urlStr.includes('/items/trips')) && !tags.includes('reis-status')) tags.push('reis-status');

                const requestInit: RequestInit = {
                    ...options,
                    // Remove aggressive cache-busting headers
                    cache: revalidate === 0 ? 'no-store' : 'force-cache',
                    next: {
                        ...nextOptions,
                        tags,
                        revalidate: revalidate,
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
