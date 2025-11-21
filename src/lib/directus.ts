// Directus REST API configuration
// In dev we default to the Vite proxy so the app keeps working over LAN/IP without CORS issues.
const envDirectusUrl = import.meta.env.VITE_DIRECTUS_URL;
const fallbackDirectusUrl = 'https://admin.salvemundi.nl';
const useDevProxy = import.meta.env.DEV && import.meta.env.VITE_DIRECTUS_USE_PROXY !== 'false';

// When using the proxy, requests stay same-origin with the dev server (no CORS preflights).
export const directusUrl = useDevProxy ? '/api' : (envDirectusUrl || fallbackDirectusUrl);

const apiKey = import.meta.env.VITE_DIRECTUS_API_KEY;

// Create a simple fetch wrapper for Directus REST API
export async function directusFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${directusUrl}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
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
