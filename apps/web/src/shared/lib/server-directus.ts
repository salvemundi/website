// Note: Environment variables are read inside the function to ensure they are available at call time

export interface FetchOptions extends RequestInit {
    revalidate?: number | false;
    tags?: string[];
}

export async function serverDirectusFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const directusApiUrl = process.env.INTERNAL_DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8055';
    const apiKey = process.env.DIRECTUS_ADMIN_TOKEN || '';

    const { revalidate = 120, tags = [], ...fetchOptions } = options;
    const url = `${directusApiUrl}${endpoint}`;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {}),
        ...(fetchOptions.headers as Record<string, string> || {}),
    };

    console.log('[serverDirectusFetch] Requesting:', {
        url,
        hasAuth: !!apiKey,
        tokenPrefix: apiKey ? `${apiKey.substring(0, 5)}...` : 'NONE'
    });

    if (!apiKey) {
        console.warn('[serverDirectusFetch] No DIRECTUS_ADMIN_TOKEN found in environment variables.');
    }

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
                hasAuth: !!headers['Authorization']
            });
            throw new Error(`Directus API error: ${response.status} ${response.statusText} - ${errorText}`);
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
