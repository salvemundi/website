// Directus REST API configuration
export const directusUrl = (
  import.meta.env.DEV
    ? '/api'
    : (import.meta.env.VITE_DIRECTUS_URL || 'https://admin.salvemundi.nl')
);

const apiKey = import.meta.env.VITE_DIRECTUS_API_KEY || '';

// Create a simple fetch wrapper for Directus REST API
export async function directusFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${directusUrl}${endpoint}`;

  // Resolve Authorization header order:
  // 1) Explicit Authorization in options.headers
  // 2) Session token stored as 'auth_token' in localStorage
  // 3) VITE API key (fallback for public access)
  let authHeader: string | undefined;
  let authSource = 'none';
  let usingSessionToken = false;

  if (options?.headers && (options.headers as any).Authorization) {
    authHeader = (options.headers as any).Authorization as string;
    authSource = 'explicit';
  } else {
    try {
      const sessionToken = localStorage.getItem('auth_token');
      if (sessionToken) {
        authHeader = `Bearer ${sessionToken}`;
        authSource = 'session';
        usingSessionToken = true;
      }
    } catch (e) {
      // localStorage may be unavailable
    }

    if (!authHeader && apiKey) {
      authHeader = `Bearer ${apiKey}`;
      authSource = 'apiKey';
    }
  }

  // Mask token for logging (Dev only)
  if (import.meta.env.DEV) {
    try {
      const tokenToMask = authHeader?.replace(/^Bearer\s+/i, '') || '';
      const masked = tokenToMask
        ? `${tokenToMask.slice(0,6)}...${tokenToMask.slice(-4)}`
        : '(none)';
      // console.log(`[directusFetch] ${endpoint} authSource=${authSource} token=${masked}`);
    } catch (e) { }
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
    if (usingSessionToken) {
      console.warn('[directusFetch] Session token rejected (401). Clearing invalid token to restore public access.');
      localStorage.removeItem('auth_token');
    }
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Directus API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const json = await response.json();
  return json.data as T;
}

// Legacy exports
export const directus = null;
export const loginWithApiKey = async () => Promise.resolve();