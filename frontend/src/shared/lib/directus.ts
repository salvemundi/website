// Directus REST API configuration
// Always use the /api proxy to avoid CORS issues
export const directusUrl = '/api';

const apiKey = process.env.NEXT_PUBLIC_DIRECTUS_API_KEY || '';

// Note: debug logging removed to avoid leaking secrets in the browser

// Singleton promise for token refresh to handle multiple simultaneous 401s
let refreshPromise: Promise<boolean> | null = null;

// Helper to check if JWT token is about to expire (within 60 seconds)
function isTokenExpiringSoon(token: string): boolean {
    try {
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

// Proactive token refresh - returns the new access token or null if failed
async function ensureFreshToken(): Promise<string | null> {
    if (typeof window === 'undefined') return null;

    try {
        const currentToken = localStorage.getItem('auth_token');
        const refreshToken = localStorage.getItem('refresh_token');

        if (!currentToken || !refreshToken) return currentToken;

        // If token is still fresh, return it
        if (!isTokenExpiringSoon(currentToken)) return currentToken;

        console.log('[directusFetch] Token expiring soon, proactively refreshing...');

        // Use singleton pattern to avoid multiple simultaneous refreshes
        if (!refreshPromise) {
            refreshPromise = (async () => {
                try {
                    const refreshResponse = await fetch(`${directusUrl}/auth/refresh`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ refresh_token: refreshToken }),
                    });

                    if (refreshResponse.ok) {
                        const data = await refreshResponse.json();
                        const payload = data.data || data;

                        if (payload.access_token && payload.refresh_token) {
                            localStorage.setItem('auth_token', payload.access_token);
                            localStorage.setItem('refresh_token', payload.refresh_token);
                            window.dispatchEvent(new CustomEvent('auth:refreshed', { detail: payload }));
                            console.log('[directusFetch] Proactive token refresh successful');
                            return true;
                        }
                    }
                    return false;
                } catch (error) {
                    console.error('[directusFetch] Proactive token refresh failed', error);
                    return false;
                } finally {
                    refreshPromise = null;
                }
            })();
        }

        const success = await refreshPromise;
        if (success) {
            return localStorage.getItem('auth_token');
        }
        return currentToken; // Return old token if refresh failed, let the request try anyway
    } catch (e) {
        return localStorage.getItem('auth_token');
    }
}

// Create a simple fetch wrapper for Directus REST API
// Added _isRetry parameter to prevent infinite loops during token refresh
export async function directusFetch<T>(endpoint: string, options?: RequestInit, _isRetry = false): Promise<T> {
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

    let response: Response;
    try {
        response = await fetch(url, {
            ...options,
            headers,
        });
    } catch (err) {
        console.error('[directusFetch] Network error when fetching', { url, method: options?.method || 'GET', error: err });
        throw err;
    }

    // Handle 401 Unauthorized specifically
    if (response.status === 401) {
        // If we were using a session token and got a 401, the token is invalid or expired.
        // Try to refresh the token if we haven't already retried.
        if (usingSessionToken && typeof window !== 'undefined' && !_isRetry) {
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
                try {
                    // Use singleton promise to ensure only one refresh happens at a time
                    if (!refreshPromise) {
                        console.log('[directusFetch] Token expired, attempting refresh...');
                        refreshPromise = (async () => {
                            try {
                                const refreshResponse = await fetch(`${directusUrl}/auth/refresh`, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                        refresh_token: refreshToken,
                                    }),
                                });

                                if (refreshResponse.ok) {
                                    const data = await refreshResponse.json();
                                    const payload = data.data || data;

                                    if (payload.access_token && payload.refresh_token) {
                                        console.log('[directusFetch] Token refreshed successfully');
                                        localStorage.setItem('auth_token', payload.access_token);
                                        localStorage.setItem('refresh_token', payload.refresh_token);

                                        // Emit event to notify other components (like AuthProvider) of the new token
                                        window.dispatchEvent(new CustomEvent('auth:refreshed', { detail: payload }));
                                        return true;
                                    }
                                }
                                return false;
                            } catch (error) {
                                console.error('[directusFetch] Error during token refresh', error);
                                return false;
                            } finally {
                                refreshPromise = null;
                            }
                        })();
                    }

                    const success = await refreshPromise;
                    if (success) {
                        // Retry the original request with the new token
                        return directusFetch(endpoint, options, true);
                    } else {
                        console.warn('[directusFetch] Token refresh failed, clearing session');
                        // Refresh failed explicitly
                        localStorage.removeItem('auth_token');
                        localStorage.removeItem('refresh_token');
                        window.dispatchEvent(new CustomEvent('auth:expired'));

                        throw new Error('Session expired: Token refresh failed');
                    }
                } catch (refreshErr) {
                    console.error('[directusFetch] Error during token refresh coordination', refreshErr);
                    // Critical failure ensuring cleanup
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('refresh_token');
                    window.dispatchEvent(new CustomEvent('auth:expired'));
                    throw refreshErr;
                }
            }
            // If we are here, no refresh token existed to begin with, or logic flow failed.
            console.warn('[directusFetch] 401 with session token but no refresh capability/logic');
            localStorage.removeItem('auth_token');
            localStorage.removeItem('refresh_token');
            window.dispatchEvent(new CustomEvent('auth:expired'));
            // Do not force reload immediately here to allow graceful UI handling if possible, 
            // but usually a 401 in this state means we are done.
        } else if (usingSessionToken && typeof window !== 'undefined') {
            // Already retried and failed (recursive call), or window undefined
            console.warn('[directusFetch] 401 on retry, session is definitely invalid');
            localStorage.removeItem('auth_token');
            localStorage.removeItem('refresh_token');
            window.dispatchEvent(new CustomEvent('auth:expired'));
            // Stop the loop
            throw new Error('Session expired: Retry failed');
        }
    }

    if (!response.ok) {
        const contentType = response.headers.get('content-type');

        // Check for suppression header
        const suppressLog = headers['X-Suppress-Log'] === 'true' || headers['x-suppress-log'] === 'true';

        if (contentType && contentType.includes('text/html')) {
            // Avoid dumping HTML into the error message
            const msg = `Directus API error: ${response.status} ${response.statusText} (Server returned HTML, likely a proxy or gateway error)`;
            if (!suppressLog) {
                console.error('[directusFetch] Non-OK HTML response', { url, status: response.status, statusText: response.statusText });
            }
            throw new Error(msg);
        }
        const errorText = await response.text();

        if (!suppressLog) {
            try {
                console.error('[directusFetch] Non-OK response', { url, status: response.status, statusText: response.statusText, body: errorText, usingSessionToken });
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

                        console.error('[directusFetch] 403 diagnostics', { url, details });
                    } catch (diagErr) {
                        console.error('[directusFetch] Error fetching 403 diagnostic info', diagErr);
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
    } catch (err) {
        console.error('[directusFetch] Failed parsing JSON response', { url, error: err });
        throw err;
    }
    return json.data as T;
}

// Legacy exports
export const directus = null;
export const loginWithApiKey = async () => Promise.resolve();
