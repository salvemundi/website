import { cookies } from 'next/headers';
import { getUserDirectus, getSystemDirectus } from './directus';

/**
 * Get a Directus client that automatically applies the Impersonate Token.
 * Gebruik deze async functie in Next.js Server Components en Server Actions.
 */
export async function getDirectusClient() {
    try {
        const cookieStore = await cookies();
        const testToken = cookieStore.get('directus_test_token')?.value;

        // Als er een test token actief is, imiteer dan die gebruiker
        if (testToken) {
            return getUserDirectus(testToken);
        }
    } catch (error) {
        // cookies() gooit een error als deze buiten een request context wordt aangeroepen 
        // (bijv. in een achtergrond-worker). We vangen dit netjes op.
    }

    // Fallback naar de system token als er geen test-cookie is
    return getSystemDirectus();
}
