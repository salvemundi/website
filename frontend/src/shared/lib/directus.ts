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

    // Debug: log request info (don't print sensitive tokens)
    try {
        console.debug('[directusFetch] Request', { method: options?.method || 'GET', url });
    } catch (e) {
        // ignore logging failures
    }

    let response: Response;
    try {
        response = await fetch(url, {
            ...options,
            headers,
        });
    } catch (networkErr) {
        console.error('[directusFetch] Network error when fetching', url, networkErr);
        throw networkErr;
    }

    // Handle 401 Unauthorized specifically
    if (response.status === 401) {
        // If we were using a session token and got a 401, the token is invalid or expired.
        // We strictly clear it to prevent persistent authentication errors on subsequent loads.
        if (usingSessionToken && typeof window !== 'undefined') {
            console.warn('[directusFetch] Session token rejected (401). Clearing invalid token to restore public access.');
            localStorage.removeItem('auth_token');
        }
    }

    console.debug('[directusFetch] Response status', { url, status: response.status, ok: response.ok });

    if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
            // Avoid dumping HTML into the error message
            throw new Error(`Directus API error: ${response.status} ${response.statusText} (Server returned HTML, likely a proxy or gateway error)`);
        }
        const errorText = await response.text();
        console.error('[directusFetch] API error body preview', { url, status: response.status, body: errorText.slice ? errorText.slice(0, 1000) : errorText });
        throw new Error(`Directus API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const json = await response.json();
    try {
        const dataPreview = Array.isArray(json.data) ? `array(${json.data.length})` : (json.data && typeof json.data === 'object' ? 'object' : typeof json.data);
        console.debug('[directusFetch] Response OK', { url, status: response.status, data: dataPreview });
    } catch (e) {
        // ignore
    }

    return json.data as T;
}

// Legacy exports
export const directus = null;
export const loginWithApiKey = async () => Promise.resolve();
