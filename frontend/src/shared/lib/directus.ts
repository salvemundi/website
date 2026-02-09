const isServer = typeof window === 'undefined';

// Use absolute URL on server, relative proxy on client
export const directusUrl = isServer
    ? (process.env.DIRECTUS_URL || 'https://admin.salvemundi.nl')
    : '/api';

// Public access should be anonymous or via session. Do not use a static public key.
const apiKey = '';

// Secret token for server-to-server communication (directus proxy bypass)
// Only used when running on the server
const API_SERVICE_TOKEN = isServer
    ? (process.env.DIRECTUS_API_TOKEN || process.env.DIRECTUS_TOKEN || process.env.DIRECTUS_API_KEY || '')
    : '';

// Helper to check if JWT token is about to expire (within 60 seconds)
export function isTokenExpiringSoon(token: string): boolean {
    try {
        if (!token) return true;
        const parts = token.split('.');
        if (parts.length !== 3) return true;

        const payload = JSON.parse(atob(parts[1]));
        const exp = payload.exp;
        if (!exp) return true;

        // Check if token expires within 60 seconds
        const nowSeconds = Math.floor(Date.now() / 1000);
        return (exp - nowSeconds) < 60;
    } catch (e) {
        return true;
    }
}

// Shared singleton promise for token refresh
let refreshPromise: Promise<boolean> | null = null;

// The actual refresh implementation - can be called from anywhere
export async function performTokenRefresh(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    // If a refresh is already in progress, return the existing promise

    if (refreshPromise) {
        return refreshPromise;
    }

    refreshPromise = (async () => {
        try {
            const refreshToken = localStorage.getItem('refresh_token');
            if (!refreshToken) {
                return false;
            }

            const response = await fetch(`${directusUrl}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: refreshToken, mode: 'json' }),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.data?.access_token) {
                    localStorage.setItem('auth_token', data.data.access_token);
                    if (data.data.refresh_token) {
                        localStorage.setItem('refresh_token', data.data.refresh_token);
                    }
                    return true;
                }
            } else {
                // Only log if it's not a standard expired token case to avoid noise
                if (response.status !== 401) {
                    // console.warn(`[directusFetch] Token refresh failed (${response.status})`);
                }
            }
            return false;
        } catch (error) {
            // console.error('[directusFetch] Unexpected error during token refresh:', error);
            return false;
        } finally {
            refreshPromise = null;
        }
    })();

    return refreshPromise;
}

// Proactive token refresh - returns the new access token or null if failed
async function ensureFreshToken(): Promise<string | null> {
    if (typeof window === 'undefined') return null;

    try {
        let authToken = localStorage.getItem('auth_token');
        const refreshToken = localStorage.getItem('refresh_token');

        if (!authToken || !refreshToken) return authToken;

        // Check for proactive refresh
        if (isTokenExpiringSoon(authToken)) {
            const success = await performTokenRefresh();
            if (success) {
                authToken = localStorage.getItem('auth_token');
            }
        }
        return authToken;
    } catch (e) {
        return localStorage.getItem('auth_token');
    }
}




// Create a fetch wrapper for Directus REST API with automatic token refresh
export async function directusFetch<T>(endpoint: string, options?: RequestInit, _isRetry = false): Promise<T> {
    const url = `${directusUrl}${endpoint}`;

    // Resolve Authorization header order:
    // 1) Explicit Authorization in options.headers
    // 2) Session token stored as 'auth_token' in localStorage
    // 3) Public Access (fallback)
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
                // Proactively refresh token if it's about to expire (before making the request)
                const freshToken = await ensureFreshToken();
                const sessionToken = freshToken || localStorage.getItem('auth_token');
                if (sessionToken) {
                    authHeader = `Bearer ${sessionToken}`;
                    usingSessionToken = true;
                }
            }
        } catch (e) {
            // localStorage may be unavailable
        }

        if (!authHeader) {
            // Server-side fallback: Use service token if available
            if (isServer && API_SERVICE_TOKEN) {
                authHeader = `Bearer ${API_SERVICE_TOKEN}`;
            }
            // Final fallback: Use public API key
            else if (apiKey) {
                authHeader = `Bearer ${apiKey}`;
            }
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

    let response: Response;
    try {
        response = await fetch(url, {
            ...options,
            headers,
        });
    } catch (err) {
        // console.error('[directusFetch] Network error when fetching', { url, method: options?.method || 'GET', error: err });
        throw err;
    }

    // Handle 401 Unauthorized specifically
    if (response.status === 401) {
        // If we were using a session token and got a 401, the token is invalid or expired.
        // Try to refresh the token if we haven't already retried.
        if (usingSessionToken && typeof window !== 'undefined' && !_isRetry) {
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
                const success = await performTokenRefresh();

                if (success) {
                    // Refresh succeeded, retry original request with new token
                    const newToken = localStorage.getItem('auth_token');
                    if (newToken) {
                        const newOptions = { ...options };
                        const newHeaders = new Headers(options?.headers || {});
                        newHeaders.set('Authorization', `Bearer ${newToken}`);
                        newOptions.headers = newHeaders;
                        return directusFetch<T>(endpoint, newOptions, true);
                    }
                } else {
                    // Refresh failed, clear session to prevent loops
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('refresh_token');
                    window.dispatchEvent(new CustomEvent('auth:expired'));
                }
            } else {
                // If we are here, no refresh token existed to begin with, or logic flow failed.
                // console.warn('[directusFetch] 401 with session token but no refresh capability/token');
                localStorage.removeItem('auth_token');
                localStorage.removeItem('refresh_token');
                window.dispatchEvent(new CustomEvent('auth:expired'));
            }
        } else if (usingSessionToken && typeof window !== 'undefined') {
            // Already retried and failed (recursive call), or window undefined
            // console.warn('[directusFetch] 401 on retry, session is definitely invalid');
            localStorage.removeItem('auth_token');
            localStorage.removeItem('refresh_token');
            window.dispatchEvent(new CustomEvent('auth:expired'));
            // Stop the loop
            throw new Error('Session expired: Retry failed');
        }

    }

    if (!response.ok) {
        const contentType = response.headers.get('content-type');

        // Check for suppression header (case-insensitive)
        const suppressLog = Object.entries(headers).some(([k, v]) => k.toLowerCase() === 'x-suppress-log' && String(v).toLowerCase() === 'true');

        if (contentType && contentType.includes('text/html')) {
            // Avoid dumping HTML into the error message
            const msg = `Directus API error: ${response.status} ${response.statusText} (Server returned HTML, likely a proxy or gateway error)`;
            if (!suppressLog) {
                // console.error('[directusFetch] Non-OK HTML response', { url, status: response.status, statusText: response.statusText });
            }
            throw new Error(msg);
        }
        const errorText = await response.text();

        if (!suppressLog) {
            try {
                // console.error('[directusFetch] Non-OK response', { url, status: response.status, statusText: response.statusText, body: errorText, usingSessionToken });
            } catch (e) {
                // ignore logging errors
            }

            // Add diagnostic logging for 403 Forbidden responses (development/dev environment only)
            const isDev = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_SITE_TAG === 'dev';
            if (response.status === 403 && isDev) {
                (async () => {
                    try {
                        // Prepare headers for diagnostic calls but avoid printing secret tokens
                        const diagnosticHeaders: Record<string, string> = { ...headers };
                        if (diagnosticHeaders.Authorization) {
                            diagnosticHeaders.Authorization = usingSessionToken ? '[session token]' : apiKey ? '[api key]' : '[present]';
                        }

                        const details: any = { authType: usingSessionToken ? 'session' : apiKey ? 'apiKey' : 'none' };

                        // Fetch current user info (users/me)
                        try {
                            const meResp = await fetch(`${directusUrl}/users/me`, { headers: diagnosticHeaders });
                            const meText = await meResp.text();
                            try {
                                details.user = meResp.ok ? JSON.parse(meText).data : { status: meResp.status, body: meText };
                            } catch (e) {
                                details.user = { status: meResp.status, body: meText };
                            }
                        } catch (e) {
                            details.userError = String(e);
                        }

                        // Fetch permissions for the `event_signups` collection to see what rights exist
                        try {
                            const permsResp = await fetch(`${directusUrl}/permissions?filter[collection][_eq]=event_signups`, { headers: diagnosticHeaders });
                            const permsText = await permsResp.text();
                            try {
                                details.permissions = permsResp.ok ? JSON.parse(permsText).data : { status: permsResp.status, body: permsText };
                            } catch (e) {
                                details.permissions = { status: permsResp.status, body: permsText };
                            }
                        } catch (e) {
                            details.permissionsError = String(e);
                        }

                        // console.error('[directusFetch] 403 diagnostics', { url, details });
                    } catch (diagErr) {
                        // console.error('[directusFetch] Error fetching 403 diagnostic info', diagErr);
                    }
                })();
            }
        }

        throw new Error(`Directus API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    // Handle 204 No Content
    if (response.status === 204) {
        return {} as T;
    }

    let json: any;
    try {
        const text = await response.text();
        if (!text) return {} as T;
        json = JSON.parse(text);

        // Defensive: JSON.parse may return null, which is a valid JSON value but not an object we expect.
        if (json === null || typeof json !== 'object') {
            throw new Error('Directus API returned unexpected response: null or non-object. This often indicates a proxy/auth error or a misconfigured Directus endpoint.');
        }
    } catch (err) {
        // console.error('[directusFetch] Failed parsing JSON response', { url, error: err });
        throw err;
    }

    // If Directus returns the standard envelope { data: ... }, return that.
    // Otherwise, return the raw JSON (some endpoints may return arrays or objects
    // directly). This prevents returning `undefined` when `data` is missing.
    if (Object.prototype.hasOwnProperty.call(json, 'data')) {
        return json.data as T;
    }

    return json as T;
}

// Legacy exports
export const directus = null;
export const loginWithApiKey = async () => Promise.resolve();
