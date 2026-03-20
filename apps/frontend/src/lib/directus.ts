import { createDirectus, rest, staticToken } from '@directus/sdk';

/**
 * Directus utility for V7.
 * Provides the official SDK client configured for internal use.
 */

const directusUrl = process.env.INTERNAL_DIRECTUS_URL!;

const getDirectusToken = () => process.env.DIRECTUS_STATIC_TOKEN!;

export const directus = createDirectus(directusUrl)
    .with(staticToken(getDirectusToken()))
    .with(rest());

// Legacy support for direct fetch if needed, but preferred to use the SDK 'directus' object
export async function directusFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${directusUrl}${endpoint}`;
    
    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getDirectusToken()}`,
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
