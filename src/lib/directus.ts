// Directus REST API configuration
// Always use proxy when running locally (dev or preview) to avoid CORS issues
// In production deployment, set VITE_DIRECTUS_URL or it will also use /api proxy
const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
export const directusUrl = isLocalhost
  ? '/api'  // Use proxy for localhost (both dev and preview)
  : (import.meta.env.VITE_DIRECTUS_URL || '/api');

const apiKey = import.meta.env.VITE_DIRECTUS_API_KEY || 'nEnHgseLaPzNgUQ0kCPQvjj2kFhA3kL3';

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

