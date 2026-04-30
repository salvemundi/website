import 'server-only';
import { createDirectus, rest, staticToken } from '@directus/sdk';
import { type DirectusSchema } from '@salvemundi/validations/directus/schema';
import { insertSystemLogInternal } from '@/server/queries/audit.queries';

const directusUrl = process.env.DIRECTUS_SERVICE_URL!;

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
async function logDirectusError(err: DirectusError) {
    try {
        await insertSystemLogInternal({
            type: 'system_error_directus',
            status: 'ERROR',
            payload: {
                message: err.message,
                status: err.status,
                code: err.code,
                url: err.url,
                timestamp: new Date().toISOString()
            }
        });
    } catch (logErr) {
        console.error('[DirectusLog] Failed to persist error log:', logErr);
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
            
            // Only retry on 5xx or specific network failures. 
            // 4xx (like 404 or 401) are intentional and should not be retried.
            if (response.ok || response.status < 500) {
                return response;
            }
            
            throw new Error(`Server responded with ${response.status}`);
        } catch (err: any) {
            const isLastRetry = i === retries;
            const isTimeout = err.name === 'TimeoutError' || err.name === 'AbortError' || err.message?.includes('timeout');
            
            // We only retry on timeouts or server errors
            if (isLastRetry || (!isTimeout && !err.message?.includes('Server responded with 5'))) {
                throw err;
            }
            
            // Wait before retrying (exponential-ish backoff)
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
            fetch: async (url, options) => {
                const urlStr = url.toString();
                
                const nextOptions = (options as any)?.next || {};
                const tags: string[] = nextOptions.tags || [];

                // ─── TIERED REVALIDATION STRATEGY ────────────────────────────────
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
                        revalidate = 3600; // Tier 3: Stable
                    } else {
                        revalidate = 300; // Default: 5 minutes
                    }
                }

                if (urlStr.includes('/items/Stickers') && !tags.includes('stickers')) tags.push('stickers');
                if (urlStr.includes('/items/feature_flags') && !tags.includes('feature_flags')) tags.push('feature_flags');
                if ((urlStr.includes('/items/trip_signups') || urlStr.includes('/items/trips')) && !tags.includes('reis-status')) tags.push('reis-status');
                
                // Events tagging for targeted revalidation
                if (urlStr.includes('/items/events')) {
                    if (!tags.includes('events')) tags.push('events');
                    
                    // Try to extract ID for specific event revalidation
                    // 1. Path based: /items/events/123
                    const pathMatch = urlStr.match(/\/items\/events\/(\d+|[0-9a-f-]+)/);
                    if (pathMatch) {
                        const id = pathMatch[1];
                        if (!tags.includes(`event_${id}`)) tags.push(`event_${id}`);
                    } 
                    // 2. Query based: ?filter[id][_eq]=123
                    else if (urlStr.includes('filter') && urlStr.includes('id') && urlStr.includes('_eq')) {
                        const filterMatch = urlStr.match(/filter\[id\]\[_eq\]=(\d+|[0-9a-f-]+)/);
                        if (filterMatch) {
                            const id = filterMatch[1];
                            if (!tags.includes(`event_${id}`)) tags.push(`event_${id}`);
                        }
                    }
                }

                const requestInit: RequestInit = {
                    ...options,
                    cache: revalidate === 0 ? 'no-store' : 'force-cache',
                    next: {
                        ...nextOptions,
                        tags,
                        revalidate: revalidate,
                    },
                    signal: AbortSignal.timeout(8000),
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
                } catch (err: any) {
                    if (err.name === 'TimeoutError' || err.name === 'AbortError' || err.message?.includes('timeout')) {
                        const error = new DirectusError(
                            `Service timeout (15s) for ${urlStr}. The service might be under heavy load or unreachable via VPN.`,
                            504,
                            'TIMEOUT',
                            urlStr
                        );
                        await logDirectusError(error);
                        throw error;
                    }
                    
                    if (err instanceof DirectusError) throw err;
                    
                    const error = new DirectusError(
                        err.message || 'Unknown network error during Directus fetch',
                        500,
                        'FETCH_ERROR',
                        urlStr
                    );
                    await logDirectusError(error);
                    throw error;
                }
            }
        }
    })
        .with(staticToken(process.env.DIRECTUS_STATIC_TOKEN!))
        .with(rest());
}

// getUserDirectus deleted as per "no user token" policy.
