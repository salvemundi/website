'use server';

import { z } from 'zod';

import {
    reisPaymentEnrichmentSchema
} from '@salvemundi/validations/schema/trip.zod';
import {
    tripSchema,
    tripActivitySchema,
    tripSignupActivitySchema
} from '@salvemundi/validations/schema/admin-trip.zod';
import { type ReisPaymentEnrichment } from '@salvemundi/validations/schema/trip.zod';
import { db, schema } from '@salvemundi/db';
import { eq } from 'drizzle-orm';
import { fetchTripSignupByIdDb, fetchSelectedSignupActivitiesDb } from '@/server/internal/reis/reis-signup-db.utils';
import { fetchTripByIdDb } from '@/server/internal/reis/reis-trip-db.utils';
import { fetchTripActivitiesByTripIdDb } from '@/server/internal/reis/reis-activity-db.utils';;
import { getEnrichedSession } from '@/server/auth/auth-utils';
import { getRedis } from '@/server/auth/redis-client';
import { normalizeDate } from '@/lib/utils/date-utils';
import { safeConsoleError } from '@/server/utils/logger';

interface TripPaymentErrorResponse {
    message?: string;
}

interface TripPaymentSuccessResponse {
    checkoutUrl: string;
}

interface PaymentStatusResponse {
    payment_status: 'paid' | 'open' | 'expired' | 'failed' | 'canceled';
}

async function validateAccess(signupId: number, token?: string) {
    try {
        const session = await getEnrichedSession();

        const signup = await fetchTripSignupByIdDb(signupId);
        if (!signup) {
            return { authorized: false, error: 'Aanmelding niet gevonden.' };
        }

        if (token && signup.access_token === token) {
            return { authorized: true, signup };
        }

        if (session?.user.id && signup.directus_relations === session.user.id) {
            return { authorized: true, signup };
        }

        return { authorized: false, error: 'Geen toegang. Log in of gebruik de link uit de e-mail.' };
    } catch {
        return { authorized: false, error: 'Interne fout bij autorisatie check.' };
    }
}

export async function getTripSignupByToken(signupId: number, token?: string) {
    try {
        const access = await validateAccess(signupId, token);
        if (!access.authorized || !access.signup) return { success: false, error: access.error };

        const signup = access.signup;

        if (!signup.trip_id) return { success: false, error: 'Reisgegevens niet gekoppeld aan inschrijving.' };

        const [tripRaw, allActivitiesRaw, selectedActivitiesRaw] = await Promise.all([
            fetchTripByIdDb(signup.trip_id),
            fetchTripActivitiesByTripIdDb(signup.trip_id),
            fetchSelectedSignupActivitiesDb(signupId)
        ]);

        if (!tripRaw) return { success: false, error: 'Reisgegevens niet gevonden.' };

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

    } catch {

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
            data.date_of_birth = normalizeDate(data.date_of_birth) as string;
        }

        const validated = reisPaymentEnrichmentSchema.safeParse(data);
        if (!validated.success) {
            return { success: false, error: 'Vul alle verplichte velden correct in.', fieldErrors: z.flattenError(validated.error).fieldErrors };
        }

        const { is_bus_trip: _, ...dbData } = validated.data;

        await db.update(schema.trip_signups).set(dbData).where(eq(schema.trip_signups.id, signupId));

        return { success: true };
    } catch (error: unknown) {
        safeConsoleError(`[trip-payment.actions.ts][updateSignupDetails] Failed to update signup ${signupId}:`, error);
        return { success: false, error: 'Opslaan mislukt door een serverfout.' };
    }
}

export async function syncSignupActivities(signupId: number, selections: { activityId: number, options: { [key: string]: unknown } }[], token?: string) {
    try {
        const access = await validateAccess(signupId, token);
        if (!access.authorized || !access.signup) return { success: false, error: access.error };

        const redis = await getRedis();
        const lockKey = `lock:trip-activity-sync:${signupId}`;
        let lockAcquired = false;

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
            const currentRows = await db.select({
                id: schema.trip_signup_activities.id,
                trip_activity_id: schema.trip_signup_activities.trip_activity_id
            }).from(schema.trip_signup_activities)
            .where(eq(schema.trip_signup_activities.trip_signup_id, signupId));

            const toRemove = currentRows
                .filter(c => !selections.find(s => s.activityId === Number(c.trip_activity_id)))
                .map(c => Number(c.id));

            // 2. Perform sync via Drizzle
            if (toRemove.length > 0) {
                const { inArray } = await import('drizzle-orm');
                await db.delete(schema.trip_signup_activities).where(inArray(schema.trip_signup_activities.id, toRemove));
            }

            for (const s of selections) {
                const existing = currentRows.find(c => Number(c.trip_activity_id) === s.activityId);
                if (existing) {
                    await db.update(schema.trip_signup_activities)
                        .set({ selected_options: s.options })
                        .where(eq(schema.trip_signup_activities.id, existing.id));
                } else {
                    await db.insert(schema.trip_signup_activities).values({
                        trip_signup_id: signupId,
                        trip_activity_id: s.activityId,
                        selected_options: s.options
                    });
                }
            }

            return { success: true };
        } finally {
            await redis.del(lockKey);
        }
    } catch {

        return { success: false, error: 'Synchroniseren van activiteiten mislukt.' };
    }
}

export async function initiateTripPaymentAction(signupId: number, paymentType: 'deposit' | 'final', token?: string) {
    try {
        const access = await validateAccess(signupId, token);
        if (!access.authorized || !access.signup) return { success: false, error: access.error };

        const FINANCE_SERVICE_URL = process.env.FINANCE_SERVICE_URL;
        if (!FINANCE_SERVICE_URL) return { success: false, error: 'Betaalservice niet geconfigureerd.' };

        const internalToken = (process.env.INTERNAL_SERVICE_TOKEN || '').replace(/^"|"$/g, '').trim();
        const response = await fetch(`${FINANCE_SERVICE_URL}/api/finance/trip-payment-request`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${internalToken}`
            },
            body: JSON.stringify({
                signupId,
                tripId: access.signup.trip_id,
                paymentType,
                isConfirmedByUser: true
            })
        });

        if (!response.ok) {
            const errData = (await response.json()) as TripPaymentErrorResponse & { error?: string };
            safeConsoleError(`[trip-payment.actions.ts][initiateTripPaymentAction] Finance service returned status ${response.status}:`, errData);
            return { success: false, error: errData.message || errData.error || 'Betaalverzoek mislukt.' };
        }

        const data = (await response.json()) as TripPaymentSuccessResponse;
        return { success: true, checkoutUrl: data.checkoutUrl };

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        safeConsoleError('[trip-payment.actions.ts][initiateTripPaymentAction] Exception in initiateTripPaymentAction:', error);
        return { success: false, error: `Interne fout bij starten betaling: ${errorMessage}` };
    }
}

export async function getPaymentStatusAction(mollieId: string) {
    try {
        const FINANCE_SERVICE_URL = process.env.FINANCE_SERVICE_URL;
        if (!FINANCE_SERVICE_URL) return { success: false, error: 'Betaalservice niet geconfigureerd.' };

        const internalToken = (process.env.INTERNAL_SERVICE_TOKEN || '').replace(/^"|"$/g, '').trim();
        const response = await fetch(`${FINANCE_SERVICE_URL}/api/finance/status/${mollieId}`, {
            headers: {
                'Authorization': `Bearer ${internalToken}`
            }
        });

        if (!response.ok) {

            return { success: false, error: 'Status ophalen mislukt bij betaalservice.' };
        }

        const data = (await response.json()) as PaymentStatusResponse;
        return {
            success: true,
            payment_status: data.payment_status
        };
    } catch {

        return { success: false, error: 'Interne fout bij ophalen betaalstatus.' };
    }
}
