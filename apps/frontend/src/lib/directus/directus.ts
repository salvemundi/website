import 'server-only';
import { createDirectus, rest, staticToken } from '@directus/sdk';
import { type DirectusSchema } from '@salvemundi/validations/directus/schema';
import { insertSystemLogInternal } from '@/server/queries/audit.queries';
import { safeConsoleError } from '@/server/utils/logger';

const directusUrlEnv = process.env.DIRECTUS_SERVICE_URL || process.env.INTERNAL_DIRECTUS_URL;
const directusTokenEnv = process.env.DIRECTUS_STATIC_TOKEN;

if (!directusUrlEnv || !directusTokenEnv) {
    throw new Error('Missing DIRECTUS_SERVICE_URL or DIRECTUS_STATIC_TOKEN in environment variables');
}

const directusUrl: string = directusUrlEnv;
const directusToken: string = directusTokenEnv;

export class DirectusError extends Error {
    constructor(
        message: string,
        public status?: number,
        public code?: string,
        public url?: string
    ) {
        super(message);
        this.name = 'DirectusError';
    }
}

/**
 * Log a DirectusError to the system_logs table for monitoring.
 */
async function logDirectusError(error: DirectusError) {
    try {
        await insertSystemLogInternal({
            type: 'system_error_directus',
            status: 'ERROR',
            payload: {
                message: error.message,
                status: error.status,
                code: error.code,
                url: error.url,
                timestamp: new Date().toISOString()
            }
        });
    } catch (logErr) {
        safeConsoleError('[DirectusLog] Failed to persist error log:', logErr);
    }
}

/**
 * Fetch with a simple retry mechanism for transient network errors.
 */
export async function fetchWithRetry(
    url: string,
    init: RequestInit,
    retries = 2,
    backoff = 300
): Promise<Response> {
    for (let i = 0; i <= retries; i++) {
        try {
            const response = await fetch(url, init);

            if (response.ok || response.status < 500) {
                return response;
            }

            throw new Error(`Server responded with ${response.status}`);
        } catch (e: unknown) {
            const error = e instanceof Error ? e : new Error(String(e));
            const isLastRetry = i === retries;
            const isTimeout = error.name === 'TimeoutError' || error.name === 'AbortError' || error.message.includes('timeout');

            if (isLastRetry || (!isTimeout && !error.message.includes('Server responded with 5'))) {
                throw error;
            }

            await new Promise(res => setTimeout(res, backoff * (i + 1)));
        }
    }
    throw new Error('Fetch failed after retries');
}

/**
 * Get a Directus client with system-level permissions.
 * Used for public data or background tasks.
 */
export function getSystemDirectus() {
    return createDirectus<DirectusSchema>(directusUrl, {
        globals: {
            fetch: async (url: string | URL, options?: RequestInit) => {
                const urlStr = url.toString();

                const nextOptions = (options as (RequestInit & { next?: { revalidate?: number | false; tags?: string[] } }) | undefined)?.next || {};
                const tags: string[] = nextOptions.tags || [];

                // ─── TIERED REVALIDATION STRATEGY ────────────────────────────────
                let revalidate = nextOptions.revalidate;

                if (revalidate === undefined) {
                    if (urlStr.includes('/items/Stickers') || urlStr.includes('/items/feature_flags')) {
                        revalidate = 1;
                    } else if (urlStr.includes('/items/events') || urlStr.includes('/items/news')) {
                        revalidate = 60;
                    } else if (
                        urlStr.includes('/items/hero_banners') ||
                        urlStr.includes('/items/sponsors') ||
                        urlStr.includes('/items/committees')
                    ) {
                        revalidate = 3600;
                    } else {
                        revalidate = 300;
                    }
                }

                if (urlStr.includes('/items/Stickers') && !tags.includes('stickers')) tags.push('stickers');
                if (urlStr.includes('/items/feature_flags') && !tags.includes('feature_flags')) tags.push('feature_flags');
                if ((urlStr.includes('/items/trip_signups') || urlStr.includes('/items/trips')) && !tags.includes('reis-status')) tags.push('reis-status');

                if (urlStr.includes('/items/events')) {
                    if (!tags.includes('events')) tags.push('events');

                    const pathMatch = urlStr.match(/\/items\/events\/(\d+|[0-9a-f-]+)/);
                    if (pathMatch && pathMatch[1]) {
                        const id = pathMatch[1];
                        if (!tags.includes(`event_${id}`)) tags.push(`event_${id}`);
                    }
                    else if (urlStr.includes('filter') && urlStr.includes('id') && urlStr.includes('_eq')) {
                        const filterMatch = urlStr.match(/filter\[id\]\[_eq\]=(\d+|[0-9a-f-]+)/);
                        if (filterMatch && filterMatch[1]) {
                            const id = filterMatch[1];
                            if (!tags.includes(`event_${id}`)) tags.push(`event_${id}`);
                        }
                    }
                }

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 8000);

                const requestInit: RequestInit = {
                    ...options,
                    cache: revalidate === 0 ? 'no-store' : 'force-cache',
                    next: {
                        ...nextOptions,
                        tags,
                        revalidate
                    },
                    signal: controller.signal
                };

                try {
                    const response = await fetchWithRetry(urlStr, requestInit);

                    if (!response.ok && response.status >= 500) {
                        const error = new DirectusError(
                            `Directus server error (${response.status}) at ${urlStr}`,
                            response.status,
                            'SERVER_ERROR',
                            urlStr
                        );
                        await logDirectusError(error);
                        throw error;
                    }

                    return response;
                } catch (e: unknown) {
                    const error = e instanceof Error ? e : new Error(String(e));

                    if (error.name === 'TimeoutError' || error.name === 'AbortError' || error.message.includes('timeout')) {
                        const timeoutError = new DirectusError(
                            `Service timeout (15s) for ${urlStr}. The service might be under heavy load or unreachable via VPN.`,
                            504,
                            'TIMEOUT',
                            urlStr
                        );
                        await logDirectusError(timeoutError);
                        throw timeoutError;
                    }

                    if (e instanceof DirectusError) throw e;

                    const errorObj = new DirectusError(
                        error.message || 'Unknown network error during Directus fetch',
                        500,
                        'FETCH_ERROR',
                        urlStr
                    );
                    await logDirectusError(errorObj);
                    throw errorObj;
                } finally {
                    clearTimeout(timeoutId);
                }
            }
        }
    })
        .with(staticToken(directusToken))
        .with(rest());
}

