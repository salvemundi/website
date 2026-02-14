// Note: Environment variables are read inside the function to ensure they are available at call time

export interface FetchOptions extends RequestInit {
    revalidate?: number | false;
    tags?: string[];
}

const getDirectusUrl = () => process.env.INTERNAL_DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8055';
const getAdminToken = () => process.env.DIRECTUS_ADMIN_TOKEN || '';

export async function serverDirectusFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const directusApiUrl = getDirectusUrl();
    const apiKey = getAdminToken();

    const { revalidate = 120, tags = [], ...fetchOptions } = options;
    const url = `${directusApiUrl}${endpoint}`;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {}),
        ...(fetchOptions.headers as Record<string, string> || {}),
    };

    const nextFetchOptions: RequestInit = {
        ...fetchOptions,
        headers,
        next: {
            revalidate: revalidate === false ? false : revalidate,
            ...(tags.length > 0 ? { tags } : {}),
        },
    };

    try {
        const response = await fetch(url, nextFetchOptions);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[serverDirectusFetch] API Error:', {
                url,
                status: response.status,
                statusText: response.statusText,
                body: errorText,
            });
            throw new Error(`Directus API error: ${response.status} ${response.statusText}`);
        }

        if (response.status === 204) {
            return {} as T;
        }

        const json = await response.json();
        return json.data as T;
    } catch (error) {
        console.error('[serverDirectusFetch] Request failed:', { url, error: error instanceof Error ? error.message : error });
        throw error;
    }
}

/**
 * Standard GET fetch for server actions.
 */
export async function fetchDirectus<T>(endpoint: string, revalidate: number = 120): Promise<T> {
    return serverDirectusFetch<T>(endpoint, { revalidate });
}

/**
 * Mutation (POST/PATCH/DELETE) fetch for server actions.
 */
export async function mutateDirectus<T>(endpoint: string, method: 'POST' | 'PATCH' | 'DELETE', body?: any): Promise<T> {
    const directusApiUrl = getDirectusUrl();
    const apiKey = getAdminToken();

    const options: RequestInit = {
        method,
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        cache: 'no-store',
    };

    if (body && method !== 'DELETE') {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`${directusApiUrl}${endpoint}`, options);

    if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        console.error(`[mutateDirectus] Mutation failed: ${method} ${endpoint} \u2192 ${response.status}: ${errorText}`);
        throw new Error(`Directus API error: ${response.status}`);
    }

    if (response.status === 204) return {} as T;

    const json = await response.json();
    return json.data as T;
}

/**
 * Utility to build query strings for Directus API.
 */
export function buildQuery(params: Record<string, any>): string {
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null) continue;
        if (typeof value === 'object') {
            qs.set(key, JSON.stringify(value));
        } else {
            qs.set(key, String(value));
        }
    }
    return qs.toString();
}

// Cache presets om consistente revalidation strategieën te forceren
export const CACHE_PRESETS = {
    DYNAMIC: { revalidate: 0 } as const,      // User-specifieke data
    FREQUENT: { revalidate: 120 } as const,   // Events, signups - 2 min
    MODERATE: { revalidate: 600 } as const,   // Committees, clubs - 10 min
    STATIC: { revalidate: 3600 } as const,    // Sponsors, settings - 1 uur
    PERMANENT: { revalidate: false } as const, // Nooit auto-revalidate, alleen via webhook
} as const;

// Collection tags voor webhook revalidation
// Gebruik deze in fetch calls EN in Directus webhook configuratie
export const COLLECTION_TAGS = {
    EVENTS: 'events',
    COMMITTEES: 'committees',
    CLUBS: 'clubs',
    SPONSORS: 'sponsors',
    EVENT_SIGNUPS: 'event_signups',
    MEMBERS: 'members',
    BLOG: 'intro_blogs',
    SAFE_HAVENS: 'safe_havens',
    WHATSAPP_GROUPS: 'whatsapp_groups',
    PUB_CRAWL: 'pub_crawl',
    TRIPS: 'trips',
    STICKERS: 'stickers',
    SITE_SETTINGS: 'site_settings',
    DOCUMENTS: 'documents',
    TRANSACTIONS: 'transactions',
} as const;
