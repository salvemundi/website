'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { 
    TRIP_FIELDS, 
    TRIP_SIGNUP_FIELDS, 
    TRIP_ACTIVITY_FIELDS,
    TRIP_SIGNUP_ACTIVITY_FIELDS
} from '@salvemundi/validations/directus/fields';
import { 
    reisPaymentEnrichmentSchema
} from '@salvemundi/validations/schema/reis.zod';
import {
    tripSchema,
    tripSignupSchema,
    tripActivitySchema,
    tripSignupActivitySchema
} from '@salvemundi/validations/schema/admin-reis.zod';
import { type ReisPaymentEnrichment } from '@salvemundi/validations/schema/reis.zod';
import { query } from '@/lib/database';
import { 
    fetchTripSignupByIdDb, 
    fetchTripByIdDb, 
    fetchTripActivitiesByTripIdDb,
    fetchSelectedSignupActivitiesDb
} from './reis-db.utils';
import { auth } from '@/server/auth/auth';
import { headers as nextHeaders } from 'next/headers';
import { getRedis } from '@/server/auth/redis-client';
import { normalizeDate } from '@/lib/utils/date-utils';

/**
 * Validates if the current request has access to a signup.
 * Either via a valid session (logged in user owns the signup)
 * or via a secure access_token (guest link from email).
 */
async function validateAccess(signupId: number, token?: string) {
    try {
        const headers = await nextHeaders();
        const session = await auth.api.getSession({ headers });

        const signup = await fetchTripSignupByIdDb(signupId);
        if (!signup) {
            return { authorized: false, error: 'Aanmelding niet gevonden.' };
        }
        
        // 1. Guest access via token
        if (token && signup.access_token === token) {
            return { authorized: true, signup };
        } 
        
        // 2. Logged in user access via ownership
        if (session?.user?.id && signup.directus_relations === session.user.id) {
            return { authorized: true, signup };
        } 
        
        return { authorized: false, error: 'Geen toegang. Log in of gebruik de link uit de e-mail.' };
    } catch (err) {
        return { authorized: false, error: 'Interne fout bij autorisatie check.' };
    }
}

export async function getTripSignupByToken(signupId: number, token?: string) {
    try {
        const access = await validateAccess(signupId, token);
        if (!access.authorized || !access.signup) return { success: false, error: access.error };

        const signup = access.signup;

        // 2. Fetch Trip and Activities via SQL
        const [tripRaw, allActivitiesRaw, selectedActivitiesRaw] = await Promise.all([
            fetchTripByIdDb(signup.trip_id),
            fetchTripActivitiesByTripIdDb(signup.trip_id),
            fetchSelectedSignupActivitiesDb(signupId)
        ]);

        if (!tripRaw) return { success: false, error: 'Reisgegevens niet gevonden.' };

        // 3. Robust Zod parsing
        const tripVal = tripSchema.safeParse(tripRaw);
        if (!tripVal.success) {
            
            return { success: false, error: 'Reisgegevens zijn niet compatibel.' };
        }

        const activitiesVal = tripActivitySchema.array().safeParse(allActivitiesRaw.filter(a => a.is_active));
        if (!activitiesVal.success) {
            
            return { success: false, error: 'Sommige reisactiviteiten bevatten ongeldige data.' };
        }

        const selectionsVal = tripSignupActivitySchema.array().safeParse(selectedActivitiesRaw);
        if (!selectionsVal.success) {
            
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
        
        return { success: false, error: 'Er is een fout opgetreden bij het ophalen van je gegevens. Probeer het later opnieuw.' };
    }
}

export async function updateSignupDetails(signupId: number, data: ReisPaymentEnrichment, token?: string) {
    try {
        const access = await validateAccess(signupId, token);
        if (!access.authorized || !access.signup) {
            return { success: false, error: access.error };
        }

        if (data.date_of_birth) {
            data.date_of_birth = normalizeDate(data.date_of_birth) as any;
        }

        const validated = reisPaymentEnrichmentSchema.safeParse(data);
        if (!validated.success) {
            return { success: false, error: 'Vul alle verplichte velden correct in.', fieldErrors: validated.error.flatten().fieldErrors };
        }

        const fields = Object.keys(validated.data);
        const values = Object.values(validated.data);
        const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');

        await query(`UPDATE trip_signups SET ${setClause} WHERE id = $1`, [signupId, ...values]);

        // Shadow Write (Directus)
        const { getSystemDirectus } = await import('@/lib/directus');
        const { updateItem } = await import('@directus/sdk');
        getSystemDirectus().request(updateItem('trip_signups', signupId, validated.data)).catch(err => {
            
        });

        return { success: true };
    } catch (err: any) {
        
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
            const res = await redis.set(lockKey, 'locked', 'EX', 10, 'NX');
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
            
            return { success: false, error: 'Status ophalen mislukt bij betaalservice.' };
        }

        const data = await response.json();
        return { 
            success: true, 
            payment_status: data.payment_status as 'paid' | 'open' | 'expired' | 'failed' | 'canceled'
        };
    } catch (err) {
        
        return { success: false, error: 'Interne fout bij ophalen betaalstatus.' };
    }
}
