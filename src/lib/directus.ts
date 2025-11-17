// Directus REST API configuration
// Use the environment variable directly - CORS should be configured on Directus server
export const directusUrl = import.meta.env.VITE_DIRECTUS_URL || 'https://admin.salvemundi.nl';

const apiKey = import.meta.env.VITE_DIRECTUS_API_KEY || 'Dp8exZFEp1l9Whq2o2-5FYeiGoKFwZ2m';

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

