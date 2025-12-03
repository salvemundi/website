// Directus REST API configuration
export const directusUrl = (
    process.env.NODE_ENV === 'development'
        ? '/api'
        : (process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://admin.salvemundi.nl')
);

const apiKey = process.env.NEXT_PUBLIC_DIRECTUS_API_KEY || '';

// Create a simple fetch wrapper for Directus REST API
export async function directusFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${directusUrl}${endpoint}`;

    // Resolve Authorization header order:
    // 1) Explicit Authorization in options.headers
    // 2) Session token stored as 'auth_token' in localStorage
    // 3) VITE API key (fallback for public access)
    let authHeader: string | undefined;
    let usingSessionToken = false;

    if (options?.headers && (options.headers as any).Authorization) {
        authHeader = (options.headers as any).Authorization as string;
    } else {
        try {
            if (typeof window !== 'undefined') {
                const sessionToken = localStorage.getItem('auth_token');
                if (sessionToken) {
                    authHeader = `Bearer ${sessionToken}`;

                    usingSessionToken = true;
                }
            }
        } catch (e) {
            // localStorage may be unavailable
        }

        if (!authHeader && apiKey) {
            authHeader = `Bearer ${apiKey}`;

        }
    }



    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
        ...(options?.headers as Record<string, string>),
    };

    const response = await fetch(url, {
        ...options,
        headers,
    });

    // Handle 401 Unauthorized specifically
    if (response.status === 401) {
        // If we were using a session token and got a 401, the token is invalid or expired.
        // We strictly clear it to prevent persistent authentication errors on subsequent loads.
        if (usingSessionToken && typeof window !== 'undefined') {
            console.warn('[directusFetch] Session token rejected (401). Clearing invalid token to restore public access.');
            localStorage.removeItem('auth_token');
        }
    }

    if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
            // Avoid dumping HTML into the error message
            throw new Error(`Directus API error: ${response.status} ${response.statusText} (Server returned HTML, likely a proxy or gateway error)`);
        }
        const errorText = await response.text();
        throw new Error(`Directus API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const json = await response.json();
    return json.data as T;
}

// Legacy exports
export const directus = null;
export const loginWithApiKey = async () => Promise.resolve();
