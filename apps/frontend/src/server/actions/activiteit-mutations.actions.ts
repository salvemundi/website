'use server';

import { 
    eventSignupFormSchema, 
    type EventSignupForm,
    eventSignupSchema
} from '@salvemundi/validations';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import { revalidateTag } from 'next/cache';

import { getSystemDirectus } from '@/lib/directus';
import { createItem } from '@directus/sdk';
import { getFinanceServiceUrl, getInternalHeaders, fetchWithTimeout } from './activiteit-utils';
import { getActivityById } from './activiteit-queries.actions';

export async function signupForActivity(data: EventSignupForm) {
    const { rateLimit } = await import('../utils/ratelimit');
    const { success } = await rateLimit('event-signup', 3, 300);
    if (!success) {
        return { success: false, error: 'Te veel verzoeken. Probeer het over 5 minuten opnieuw.' };
    }

    const parsed = eventSignupFormSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, errors: parsed.error.flatten().fieldErrors };
    }

    if (parsed.data.website) {
        return { success: false, error: 'Spam gedetecteerd' };
    }

    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });
        const userId = session?.user?.id;

        const activity = await getActivityById(String(parsed.data.event_id));
        if (!activity) return { success: false, error: 'Activiteit niet gevonden' };

        if (activity.only_members && !userId) {
            return { success: false, error: 'Deze activiteit is alleen voor leden.' };
        }

        const user = session?.user;
        const isMember = (user as { membership_status?: string }).membership_status === 'active';
        const price = (isMember ? activity.price_members : activity.price_non_members) ?? 0;

        const qrToken = `r-${parsed.data.event_id}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const directus = getSystemDirectus();
        
        // Define payload with explicit sign-up properties
        const payload = {
            event_id: parsed.data.event_id,
            participant_name: parsed.data.name,
            participant_email: parsed.data.email,
            participant_phone: parsed.data.phoneNumber,
            payment_status: (price ?? 0) > 0 ? ('open' as const) : ('paid' as const),
            qr_token: qrToken
        };

        const signupResponse = await directus.request(createItem('event_signups', payload));

        const { id: signupId } = eventSignupSchema.pick({ id: true }).parse(signupResponse);

        revalidateTag(`event_signups_${parsed.data.event_id}`, 'default');

        if ((price ?? 0) > 0) {
            const financeUrl = `${getFinanceServiceUrl()}/api/payments/create`;
            const paymentRes = await fetchWithTimeout(financeUrl, {
                method: 'POST',
                headers: getInternalHeaders(),
                body: JSON.stringify({
                    amount: price,
                    description: `Inschrijving: ${activity.titel}`,
                    registrationId: signupId,
                    registrationType: 'event_signup',
                    email: parsed.data.email,
                    firstName: parsed.data.name,
                    isContribution: false,
                    redirectUrl: `${process.env.PUBLIC_URL}/activiteiten/bevestiging?id=${signupId}`
                })
            });
            const paymentData = await paymentRes.json();
            if (paymentRes.ok && paymentData.checkoutUrl) {
                return { success: true, checkoutUrl: paymentData.checkoutUrl };
            }
            
            // Cleanup on Failure
            console.error('[Activities] Payment service error:', paymentData);
            try {
                const { deleteItem } = await import('@directus/sdk');
                await getSystemDirectus().request(deleteItem('event_signups', signupId));
                console.log(`[Activities] Cleaned up failed signup ${signupId}`);
            } catch (cleanupErr) {
                console.error(`[Activities] Cleanup failed for ${signupId}:`, cleanupErr);
            }

            return { success: false, error: 'Er kon geen betaling worden aangemaakt voor deze inschrijving.' };
        } else {
            const { getRedis } = await import('@/server/auth/redis-client');
            const redis = await getRedis();
            
            const eventPayload = {
                event: 'ACTIVITY_SIGNUP_SUCCESS',
                timestamp: new Date().toISOString(),
                email: parsed.data.email,
                name: parsed.data.name,
                eventName: activity.titel,
                eventDate: activity.datum_start,
                signupId: signupId
            };

            await redis.xadd('v7:events', '*', 'payload', JSON.stringify(eventPayload));
            
            return { success: true, message: 'Inschrijving geslaagd!' };
        }
    } catch (error) {
        console.error('[Activities] Signup error:', error);
        return { success: false, error: 'Er is een fout opgetreden bij de inschrijving.' };
    }
}
