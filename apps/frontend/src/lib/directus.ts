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
        .with(rest({
            fetch: (url, options) => {
                const urlStr = url.toString();
                // Add next tags for sticker-related items to enable granular revalidation
                const nextOptions: any = {};
                if (urlStr.includes('/items/Stickers')) {
                    nextOptions.tags = ['stickers'];
                }

                return fetch(url, {
                    ...options,
                    next: Object.keys(nextOptions).length > 0 ? nextOptions : undefined
                });
            }
        }));
}

// getUserDirectus deleted as per "no user token" policy.