'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { 
    TRIP_FIELDS, 
    TRIP_SIGNUP_FIELDS, 
    TRIP_ACTIVITY_FIELDS,
    TRIP_SIGNUP_ACTIVITY_FIELDS,
    reisPaymentEnrichmentSchema,
    tripSchema,
    tripSignupSchema,
    tripActivitySchema,
    tripSignupActivitySchema,
    type ReisPaymentEnrichment
} from '@salvemundi/validations';
import { getSystemDirectus } from '@/lib/directus';
import { 
    readItem, 
    readItems, 
    updateItem, 
    createItem, 
    deleteItems 
} from '@directus/sdk';
import { auth } from '@/server/auth/auth';
import { headers as nextHeaders } from 'next/headers';
import { getRedis } from '@/server/auth/redis-client';

/**
 * Validates if the current request has access to a signup.
 * Either via a valid session (logged in user owns the signup)
 * or via a secure access_token (guest link from email).
 */
async function validateAccess(signupId: number, token?: string) {
    const directus = getSystemDirectus();
    const headers = await nextHeaders();
    const session = await auth.api.getSession({ headers });

    const filter: any = { id: { _eq: signupId } };
    
    // If guest token provided, use it
    if (token) {
        filter.access_token = { _eq: token };
    } 
    // Otherwise, require session and check ownership
    else if (session?.user?.id) {
        filter.directus_relations = { _eq: session.user.id };
    } 
    else {
        return { authorized: false, error: 'Geen toegang. Log in of gebruik de link uit de e-mail.' };
    }

    const signup = await directus.request(readItems('trip_signups', {
        filter,
        fields: [...TRIP_SIGNUP_FIELDS] as any,
        limit: 1
    }));

    if (!signup || signup.length === 0) {
        return { authorized: false, error: 'Aanmelding niet gevonden of ongeldig token.' };
    }

    const validated = tripSignupSchema.safeParse(signup[0]);
    if (!validated.success) {
        console.error('[reis-payment.actions#validateAccess] Schema mismatch:', validated.error.format());
        return { authorized: false, error: 'Database inconsistentie: Ongeldige aanmelding.' };
    }

    return { authorized: true, signup: validated.data };
}

export async function getTripSignupByToken(signupId: number, token?: string) {
    try {
        const access = await validateAccess(signupId, token);
        if (!access.authorized || !access.signup) return { success: false, error: access.error };

        const directus = getSystemDirectus();
        const signup = access.signup;

        // Fetch Trip and Activities
        const [tripRaw, allActivitiesRaw, selectedActivitiesRaw] = await Promise.all([
            directus.request(readItem('trips', signup.trip_id as number, { fields: [...TRIP_FIELDS] as any })),
            directus.request(readItems('trip_activities', {
                filter: { trip_id: { _eq: signup.trip_id }, is_active: { _eq: true } },
                fields: [...TRIP_ACTIVITY_FIELDS] as any,
                sort: ['display_order'] as any
            })),
            directus.request(readItems('trip_signup_activities', {
                filter: { trip_signup_id: { _eq: signupId } },
                fields: [...TRIP_SIGNUP_ACTIVITY_FIELDS] as any
            }))
        ]);

        // Strict Zod parsing of database results
        const trip = tripSchema.parse(tripRaw);
        const allActivities = tripActivitySchema.array().parse(allActivitiesRaw);
        const selectedActivities = tripSignupActivitySchema.array().parse(selectedActivitiesRaw);

        return {
            success: true,
            data: {
                signup,
                trip,
                allActivities,
                selectedActivities
            }
        };

    } catch (err) {
        console.error('[reis-payment.actions#getTripSignupByToken] Error:', err);
        return { success: false, error: 'Interne serverfout bij ophalen gegevens.' };
    }
}

export async function updateSignupDetails(signupId: number, data: ReisPaymentEnrichment, token?: string) {
    try {
        const access = await validateAccess(signupId, token);
        if (!access.authorized || !access.signup) return { success: false, error: access.error };

        const validated = reisPaymentEnrichmentSchema.safeParse(data);
        if (!validated.success) {
            return { success: false, error: 'Validatie mislukt.', fieldErrors: validated.error.flatten().fieldErrors };
        }

        const directus = getSystemDirectus();
        await directus.request(updateItem('trip_signups', signupId, validated.data));

        return { success: true };
    } catch (err) {
        console.error('[reis-payment.actions#updateSignupDetails] Error:', err);
        return { success: false, error: 'Opslaan mislukt.' };
    }
}

export async function syncSignupActivities(signupId: number, selections: { activityId: number, options: any }[], token?: string) {
    try {
        const access = await validateAccess(signupId, token);
        if (!access.authorized || !access.signup) return { success: false, error: access.error };

        const redis = await getRedis();
        const lockKey = `lock:trip-activity-sync:${signupId}`;
        let lockAcquired = false;

        // 1. Simple 10s spin-lock to prevent double-sync
        for (let i = 0; i < 20; i++) {
            const res = await (redis as any).set(lockKey, 'locked', 'EX', 10, 'NX');
            if (res === 'OK') {
                lockAcquired = true;
                break;
            }
            await new Promise(r => setTimeout(r, 500));
        }

        if (!lockAcquired) {
            return { success: false, error: 'Het systeem is momenteel bezig met het verwerken van je aanvraag. Probeer het over een paar seconden opnieuw.' };
        }

        try {
            const directus = getSystemDirectus();

            // 1. Get current activities for this signup
            const current = await directus.request(readItems('trip_signup_activities', {
                filter: { trip_signup_id: { _eq: signupId } },
                fields: ['id', 'trip_activity_id'] as any
            }));

            const toRemove = current
                .filter(c => !selections.find(s => s.activityId === c.trip_activity_id))
                .map(c => c.id);

            const toUpsert = selections;

            // 2. Perform sync (atomic would be nice, but Directus SDK triggers individual calls)
            if (toRemove.length > 0) {
                await directus.request(deleteItems('trip_signup_activities', toRemove));
            }

            for (const s of toUpsert) {
                const existing = current.find(c => c.trip_activity_id === s.activityId);
                if (existing) {
                    await directus.request(updateItem('trip_signup_activities', existing.id, {
                        selected_options: s.options
                    }));
                } else {
                    await directus.request(createItem('trip_signup_activities', {
                        trip_signup_id: signupId,
                        trip_activity_id: s.activityId,
                        selected_options: s.options
                    }));
                }
            }

            return { success: true };
        } finally {
            await redis.del(lockKey);
        }
    } catch (err) {
        console.error('[reis-payment.actions#syncSignupActivities] Error:', err);
        return { success: false, error: 'Synchroniseren van activiteiten mislukt.' };
    }
}

export async function initiateTripPaymentAction(signupId: number, paymentType: 'deposit' | 'final', token?: string) {
    try {
        const access = await validateAccess(signupId, token);
        if (!access.authorized || !access.signup) return { success: false, error: access.error };

        const FINANCE_SERVICE_URL = process.env.FINANCE_SERVICE_URL || 'http://finance-service:3001';
        
        const response = await fetch(`${FINANCE_SERVICE_URL}/api/finance/trip-payment-request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                signupId,
                tripId: access.signup.trip_id,
                paymentType
            })
        });

        if (!response.ok) {
            const errData = await response.json();
            return { success: false, error: errData.error || 'Betaalverzoek mislukt.' };
        }

        const data = await response.json();
        return { success: true, checkoutUrl: data.checkoutUrl };

    } catch (err) {
        console.error('[reis-payment.actions#initiateTripPaymentAction] Error:', err);
        return { success: false, error: 'Interne fout bij starten betaling.' };
    }
}
