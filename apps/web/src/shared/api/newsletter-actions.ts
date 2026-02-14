'use server';

import { mutateDirectus } from '@/shared/lib/server-directus';

/**
 * Server Action to subscribe an email to the newsletter.
 * This directly calls the Directus API using the service token.
 */
export async function subscribeToNewsletterAction(email: string) {
    if (!email) {
        return { success: false, error: 'E-mailadres is verplicht' };
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { success: false, error: 'Voer een geldig e-mailadres in' };
    }

    try {
        // Use the intro_newsletter_subscribers collection
        await mutateDirectus('/items/intro_newsletter_subscribers', 'POST', { email });

        return { success: true };
    } catch (error: any) {
        console.error('[NewsletterAction] Error:', error.message);

        // If it's a conflict (email already exists), Directus might return 400 or similar
        // For now, we'll return a generic success if it was already subscribed or a generic error
        if (error.message?.includes('400') || error.message?.includes('already exists')) {
            return { success: true, alreadySubscribed: true };
        }

        return { success: false, error: 'Inschrijven mislukt. Probeer het later opnieuw.' };
    }
}
