/**
 * Directus utility for V7.
 * Provides a fetch wrapper that handles internal URLs and static tokens.
 */

const getDirectusUrl = () =>
    process.env.INTERNAL_DIRECTUS_URL || 'http://v7-core-directus:8055';

const getDirectusHeaders = () => {
    const token = process.env.DIRECTUS_STATIC_TOKEN;
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    };
};

export async function directusFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${getDirectusUrl()}${endpoint}`;
    
    const response = await fetch(url, {
        ...options,
        headers: {
            ...getDirectusHeaders(),
            ...options.headers,
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Directus error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const json = await response.json();
    return json.data as T;
}

export const createDirectusClient = () => {
    return {
        fetch: directusFetch,
    };
};
