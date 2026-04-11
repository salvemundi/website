import { cookies } from 'next/headers';
import { getSystemDirectus } from './directus';

/**
 * Get a Directus client that automatically applies the Impersonate Token.
 * Gebruik deze async functie in Next.js Server Components en Server Actions.
 */
/**
 * Get a Directus client with system-level permissions.
 * Consistent with the "no user token" policy.
 */
export async function getDirectusClient() {
    return getSystemDirectus();
}
