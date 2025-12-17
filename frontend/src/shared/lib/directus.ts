// Directus REST API configuration
// Always use the /api proxy to avoid CORS issues
export const directusUrl = '/api';

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

    if (options?.headers) {
        // Support Headers, array tuples, and plain objects
        if (options.headers instanceof Headers) {
            const maybe = options.headers.get('Authorization');
            if (maybe) authHeader = maybe;
        } else if (Array.isArray(options.headers)) {
            const headerArr = options.headers as [string, string][];
            for (const [k, v] of headerArr) {
                if (k.toLowerCase() === 'authorization' && v) authHeader = v;
            }
        } else if (typeof options.headers === 'object') {
            const hdrs = options.headers as Record<string, string>;
            if (hdrs.Authorization) authHeader = hdrs.Authorization;
            else if (hdrs.authorization) authHeader = hdrs.authorization;
        }
    }

    if (!authHeader) {
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

    // Normalize incoming headers into a plain object for the fetch call
    const incomingHeaders: Record<string, string> = {};
    if (options?.headers) {
        if (options.headers instanceof Headers) {
            options.headers.forEach((v, k) => (incomingHeaders[k] = v));
        } else if (Array.isArray(options.headers)) {
            for (const [k, v] of options.headers as [string, string][]) incomingHeaders[k] = v;
        } else if (typeof options.headers === 'object') {
            Object.assign(incomingHeaders, options.headers as Record<string, string>);
        }
    }

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
        ...incomingHeaders,
    };

        // Debug logging removed to avoid leaking masked tokens

    const response = await fetch(url, {
        ...options,
        headers,
    });

    // Handle 401 Unauthorized specifically
    if (response.status === 401) {
        // If we were using a session token and got a 401, the token is invalid or expired.
        // We strictly clear it to prevent persistent authentication errors on subsequent loads.
        if (usingSessionToken && typeof window !== 'undefined') {
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
        try {
            // non-OK response details suppressed
        } catch (e) {
            // ignore
        }
        throw new Error(`Directus API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const json = await response.json();
    return json.data as T;
}

// Legacy exports
export const directus = null;
export const loginWithApiKey = async () => Promise.resolve();
