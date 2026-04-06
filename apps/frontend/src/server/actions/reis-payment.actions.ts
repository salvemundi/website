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
import { query } from '@/lib/db';

/**
 * Validates if the current request has access to a signup.
 * Either via a valid session (logged in user owns the signup)
 * or via a secure access_token (guest link from email).
 */
async function validateAccess(signupId: number, token?: string) {
    try {
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
            return { authorized: false, error: 'Database inconsistentie: Ongeldige aanmelding.' };
        }

        return { authorized: true, signup: validated.data };
    } catch (err) {
        return { authorized: false, error: 'Interne fout bij autorisatie check.' };
    }
}

export async function getTripSignupByToken(signupId: number, token?: string) {
    try {
        const access = await validateAccess(signupId, token);
        if (!access.authorized || !access.signup) return { success: false, error: access.error };

        const directus = getSystemDirectus();
        const signup = access.signup;

        // 2. Fetch Trip and Activities
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

        // 3. Robust Zod parsing
        const tripVal = tripSchema.safeParse(tripRaw);
        if (!tripVal.success) {
            console.error('[getTripSignupByToken] Trip schema mismatch:', tripVal.error.format());
            return { success: false, error: 'Reisgegevens zijn niet compatibel met de huidige websiteversie.' };
        }

        const activitiesVal = tripActivitySchema.array().safeParse(allActivitiesRaw);
        if (!activitiesVal.success) {
            console.error('[getTripSignupByToken] Activities schema mismatch:', activitiesVal.error.format());
            return { success: false, error: 'Sommige reisactiviteiten bevatten ongeldige data.' };
        }

        const selectionsVal = tripSignupActivitySchema.array().safeParse(selectedActivitiesRaw);
        if (!selectionsVal.success) {
            console.error('[getTripSignupByToken] Selections schema mismatch:', selectionsVal.error.format());
            return { success: false, error: 'Je eerdere activiteitskeuzes konden niet worden geladen.' };
        }

        return {
            success: true,
            data: {
                signup,
                trip: tripVal.data,
                allActivities: activitiesVal.data,
                selectedActivities: selectionsVal.data
            }
        };

    } catch (err: any) {
        console.error('Error fetching signup by token:', err);
        return { success: false, error: 'Er is een fout opgetreden bij het ophalen van je gegevens. Probeer het later opnieuw.' };
    }
}

export async function updateSignupDetails(signupId: number, data: ReisPaymentEnrichment, token?: string) {
    try {
        const access = await validateAccess(signupId, token);
        if (!access.authorized || !access.signup) {
            return { success: false, error: access.error };
        }

        const validated = reisPaymentEnrichmentSchema.safeParse(data);
        if (!validated.success) {
            return { success: false, error: 'Vul alle verplichte velden correct in.', fieldErrors: validated.error.flatten().fieldErrors };
        }

        const fields = Object.keys(validated.data);
        const values = Object.values(validated.data);
        const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');

        await query(`UPDATE trip_signups SET ${setClause} WHERE id = $1`, [signupId, ...values]);

        getSystemDirectus().request(updateItem('trip_signups', signupId, validated.data as any)).catch(err => {
            console.error('Directus sync error:', err);
        });

        return { success: true };
    } catch (err: any) {
        console.error('Error updating signup details:', err);
        return { success: false, error: 'Opslaan mislukt door een serverfout.' };
    }
}

export async function syncSignupActivities(signupId: number, selections: { activityId: number, options: any }[], token?: string) {
    try {
        const access = await validateAccess(signupId, token);
        if (!access.authorized || !access.signup) return { success: false, error: access.error };

        const redis = await getRedis();
        const lockKey = `lock:trip-activity-sync:${signupId}`;
        let lockAcquired = false;

        // 1. Simple 10s spin-lock
        for (let i = 0; i < 20; i++) {
            const res = await (redis as any).set(lockKey, 'locked', 'EX', 10, 'NX');
            if (res === 'OK') {
                lockAcquired = true;
                break;
            }
            await new Promise(r => setTimeout(r, 500));
        }

        if (!lockAcquired) {
            return { success: false, error: 'Systeem is bezig. Probeer het over een paar seconden opnieuw.' };
        }

        try {
            // 1. Get current activities for this signup (SQL for consistency)
            const currentRes = await query(
                'SELECT id, trip_activity_id FROM trip_signup_activities WHERE trip_signup_id = $1',
                [signupId]
            );
            const current = currentRes.rows || [];

            const toRemove = current
                .filter(c => !selections.find(s => s.activityId === Number(c.trip_activity_id)))
                .map(c => Number(c.id));

            // 2. Perform sync via SQL
            if (toRemove.length > 0) {
                await query('DELETE FROM trip_signup_activities WHERE id = ANY($1::int[])', [toRemove]);
            }

            for (const s of selections) {
                const existing = current.find(c => Number(c.trip_activity_id) === s.activityId);
                if (existing) {
                    await query(
                        'UPDATE trip_signup_activities SET selected_options = $1 WHERE id = $2',
                        [JSON.stringify(s.options), existing.id]
                    );
                } else {
                    await query(
                        'INSERT INTO trip_signup_activities (trip_signup_id, trip_activity_id, selected_options) VALUES ($1, $2, $3)',
                        [signupId, s.activityId, JSON.stringify(s.options)]
                    );
                }
            }

            return { success: true };
        } finally {
            await redis.del(lockKey);
        }
    } catch (err) {
        console.error('Error syncing signup activities:', err);
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
                paymentType,
                isConfirmedByUser: true
            })
        });

        if (!response.ok) {
            const errData = await response.json();
            return { success: false, error: errData.error || 'Betaalverzoek mislukt.' };
        }

        const data = await response.json();
        return { success: true, checkoutUrl: data.checkoutUrl };

    } catch (err) {
        console.error('Error initiating trip payment:', err);
        return { success: false, error: 'Interne fout bij starten betaling.' };
    }
}

/**
 * Fetches the payment status for a specific Mollie ID from the finance service.
 * @param mollieId The Mollie transaction ID (or session token depending on implementation)
 */
export async function getPaymentStatusAction(mollieId: string) {
    try {
        const FINANCE_SERVICE_URL = process.env.FINANCE_SERVICE_URL || 'http://finance-service:3001';
        const response = await fetch(`${FINANCE_SERVICE_URL}/api/finance/status/${mollieId}`);
        
        if (!response.ok) {
            console.error('[getPaymentStatusAction] Finance service returned error:', response.status);
            return { success: false, error: 'Status ophalen mislukt bij betaalservice.' };
        }

        const data = await response.json();
        return { 
            success: true, 
            payment_status: data.payment_status as 'paid' | 'open' | 'expired' | 'failed' | 'canceled'
        };
    } catch (err) {
        console.error('[reis-payment.actions#getPaymentStatusAction] Error:', err);
        return { success: false, error: 'Interne fout bij ophalen betaalstatus.' };
    }
}
