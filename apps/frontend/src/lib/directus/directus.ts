import 'server-only';
import { createDirectus, rest, staticToken } from '@directus/sdk';
import { type Schema } from '@salvemundi/validations';
import { insertSystemLogInternal } from '@/server/queries/audit.queries';
import { safeConsoleError } from '@/server/utils/logger';

type FilterFriendlySchema = {
    [K in keyof Schema]: Schema[K] extends readonly unknown[]
        ? {
            [F in keyof Schema[K][number]]: Schema[K][number][F] extends string | null ? Schema[K][number][F] | "datetime" : Schema[K][number][F]
          }[]
        : {
            [F in keyof Schema[K]]: Schema[K][F] extends string | null ? Schema[K][F] | "datetime" : Schema[K][F]
        }
};

const directusUrlEnv = process.env.DIRECTUS_SERVICE_URL || process.env.INTERNAL_DIRECTUS_URL;
const directusTokenEnv = process.env.DIRECTUS_STATIC_TOKEN;

if (!directusUrlEnv || !directusTokenEnv) {
    throw new Error('directus.ts] Missing DIRECTUS_SERVICE_URL or DIRECTUS_STATIC_TOKEN');
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
    } catch (logError: unknown) {
        const typedLogError = logError instanceof Error ? logError : new Error(String(logError));
        safeConsoleError('directus.ts][logDirectusError]', `Failed to persist error log: ${typedLogError.message}`);
    }
}

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
        } catch (error: unknown) {
            const typedError = error instanceof Error ? error : new Error(String(error));
            const isLastRetry = i === retries;
            const isTimeout = typedError.name === 'TimeoutError' || typedError.name === 'AbortError' || typedError.message.includes('timeout');

            if (isLastRetry || (!isTimeout && !typedError.message.includes('Server responded with 5'))) {
                safeConsoleError('directus.ts][fetchWithRetry]', typedError);
                throw typedError;
            }

            await new Promise(resolve => setTimeout(resolve, backoff * (i + 1)));
        }
    }
    throw new Error('directus.ts][fetchWithRetry] Fetch failed after retries');
}

export function getSystemDirectus() {
    return createDirectus<FilterFriendlySchema>(directusUrl, {
        globals: {
            fetch: async (url: string | URL, options?: RequestInit) => {
                const urlStr = url.toString();
                const nextOptions = (options as (RequestInit & { next?: { revalidate?: number | false; tags?: string[] } }) | undefined)?.next || {};
                const tags: string[] = nextOptions.tags || [];

                let revalidate = nextOptions.revalidate;

                if (revalidate === undefined) {
                    if (
                        urlStr.includes('/users') ||
                        urlStr.includes('/items/committee_members') ||
                        urlStr.includes('/items/event_signups')
                    ) {
                        revalidate = 0;
                    } else if (urlStr.includes('/items/Stickers') || urlStr.includes('/items/feature_flags')) {
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
                } catch (error: unknown) {
                    const typedError = error instanceof Error ? error : new Error(String(error));

                    if (typedError.name === 'TimeoutError' || typedError.name === 'AbortError' || typedError.message.includes('timeout')) {
                        const timeoutError = new DirectusError(
                            `Service timeout (8s) for ${urlStr}.`,
                            504,
                            'TIMEOUT',
                            urlStr
                        );
                        await logDirectusError(timeoutError);
                        throw timeoutError;
                    }

                    if (error instanceof DirectusError) throw error;

                    const errorObj = new DirectusError(
                        typedError.message || 'Unknown network error during Directus fetch',
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