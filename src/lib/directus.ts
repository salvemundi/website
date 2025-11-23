// Directus REST API configuration
// Use the environment variable directly - CORS should be configured on Directus server
export const directusUrl = import.meta.env.VITE_DIRECTUS_URL || 'https://admin.salvemundi.nl';

const apiKey = import.meta.env.VITE_DIRECTUS_API_KEY || '';

// Create a simple fetch wrapper for Directus REST API
export async function directusFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${directusUrl}${endpoint}`;

  // Resolve Authorization header order:
  // 1) explicit Authorization in options.headers
  // 2) session token stored as 'auth_token' in localStorage (user is logged in)
  // 3) VITE API key (if configured)
  let authHeader: string | undefined;
  let authSource = 'none';
  if (options?.headers && (options.headers as any).Authorization) {
    authHeader = (options.headers as any).Authorization as string;
    authSource = 'explicit';
  } else {
    try {
      const sessionToken = localStorage.getItem('auth_token');
      if (sessionToken) {
        authHeader = `Bearer ${sessionToken}`;
        authSource = 'session';
      }
    } catch (e) {
      // localStorage may be unavailable in some environments; ignore
    }

    if (!authHeader && apiKey) {
      authHeader = `Bearer ${apiKey}`;
      authSource = 'apiKey';
    }
  }

  // Mask token for safe logging (do not log full secret). Only log in dev.
  if (import.meta.env.DEV) {
    try {
      const tokenToMask = authHeader?.replace(/^Bearer\s+/i, '') || '';
      const masked = tokenToMask
        ? `${tokenToMask.slice(0,6)}...${tokenToMask.slice(-4)}`
        : '(none)';
      // Use console.log for local dev weblogs; don't expose full tokens in any logs.
      console.log(`[directusFetch] ${endpoint} authSource=${authSource} token=${masked}`);
    } catch (e) {
      // ignore logging issues
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

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Directus API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const json = await response.json();
  return json.data as T;
}

// Legacy exports (kept for compatibility, but not used)
export const directus = null;
export const loginWithApiKey = async () => Promise.resolve();

