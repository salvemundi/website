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
                const nextOptions: any = {};
                if (urlStr.includes('/items/Stickers')) {
                    nextOptions.tags = ['stickers'];
                }

                return fetch(url, {
                    ...options,
                    signal: AbortSignal.timeout(10000),
                    next: Object.keys(nextOptions).length > 0 ? nextOptions : undefined
                } as RequestInit);
            }
        }
    })
        .with(staticToken(process.env.DIRECTUS_STATIC_TOKEN!))
        .with(rest());
}

// getUserDirectus deleted as per "no user token" policy.