'use server';

import { type Activiteit } from '@salvemundi/validations/schema/activity.zod';
import { eventSignupFormSchema, type EventSignupForm } from '@salvemundi/validations/schema/activity.zod';
import { type DbEventSignup } from '@salvemundi/validations/directus/schema';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import { type EnrichedUser } from '@/types/auth';
import { revalidateTag } from 'next/cache';

import { getSystemDirectus } from '@/lib/directus';
import { deleteItem } from '@directus/sdk';
import {
    getActivitiesInternal,
    getActivityByIdInternal,
    getActivityBySlugInternal
} from "@/server/queries/admin-event.queries";
import {
    createEventSignupDb,
    deleteEventSignupDb,
    fetchUserEventSignupsDb
} from '@/server/internal/event-db.utils';
import { fetchUserPubCrawlSignupsDb } from '@/server/internal/kroegentocht-db.utils';
import { getFinanceServiceUrl, getInternalHeaders, fetchWithTimeout } from '@/server/internal/activiteit-utils';

/**
 * Fetches all published activities directly from the database (SQL-first).
 */
export async function getActivities(email?: string): Promise<(Activiteit & { is_signed_up?: boolean })[]> {
    const activities = await getActivitiesInternal(true);

    if (!email) return activities;

    try {
        const userSignups = await fetchUserEventSignupsDb(email);
        const signedUpEventIds = new Set(userSignups.map(s => Number(s.event_id.id)));

        const pubCrawlSignups = await fetchUserPubCrawlSignupsDb(email);
        const signedUpPubCrawlIds = new Set(pubCrawlSignups.map(s => Number(s.pub_crawl_event_id.id)));

        return activities.map(activity => ({
            ...activity,
            is_signed_up: signedUpEventIds.has(Number(activity.id)) || ((activity as unknown as { type?: string }).type === 'pub_crawl' && signedUpPubCrawlIds.has(Number(activity.id)))
        }));
    } catch (error) {
        console.error('[Error] Failed to fetch user signups for activities:', error);
        return activities;
    }
}

/**
 * Fetches a single activity by ID directly from the database (SQL-first).
 */
export async function getActivityById(id: string): Promise<Activiteit | null> {
    const cleanId = id.includes('-') ? id.split('-')[0] : id;
    if (!/^\d+$/.test(cleanId)) return null;
    return await getActivityByIdInternal(cleanId);
}

/**
 * Fetches a single activity by custom URL slug or numeric ID.
 */
export async function getActivityBySlug(slug: string): Promise<Activiteit | null> {
    return await getActivityBySlugInternal(slug);
}

/**
 * Checks if a user is already signed up for an activity (By email).
 */
export async function checkUserSignupStatus(eventId: number, email: string, userId?: string | null) {
    try {
        const { query } = await import('@/lib/database');
        const { z } = await import('zod');

        const res = await query(
            `SELECT id, qr_token, payment_status FROM event_signups 
             WHERE event_id = $1 
             AND (LOWER(participant_email) = LOWER($2) OR (directus_relations IS NOT NULL AND directus_relations = $3))
             AND payment_status != 'failed' 
             ORDER BY created_at DESC LIMIT 1`,
            [eventId, email, userId || null]
        );

        if (res.rows.length > 0) {
            const row = res.rows[0];
            const schema = z.object({
                id: z.number(),
                qr_token: z.string(),
                payment_status: z.string()
            });

            const parsed = schema.parse(row);

            return {
                isSignedUp: true,
                id: parsed.id,
                qrToken: parsed.qr_token,
                paymentStatus: parsed.payment_status
            };
        }
        return { isSignedUp: false };
    } catch (_error) {
        return { isSignedUp: false };
    }
}

/**
 * Sign up for an activity (Directus Event).
 */
export async function signupForActivity(data: EventSignupForm) {
    const { rateLimit } = await import('@/server/utils/ratelimit');
    const { success } = await rateLimit('event-signup', 10, 600);
    if (!success) {
        return { success: false, error: 'Te veel aanmeldingen vanaf dit IP-adres. Probeer het over een kwartier opnieuw.' };
    }

    const parsed = eventSignupFormSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, errors: parsed.error.flatten().fieldErrors };
    }

    if (parsed.data.website) {
        return { success: false, error: 'Spam detected' };
    }

    try {
        const session = await getEnrichedSession();
        const userId = session?.user?.id;

        const activity = await getActivityById(String(parsed.data.event_id));
        if (!activity) return { success: false, error: 'Activiteit niet gevonden' };

        if (activity.only_members && !userId) {
            return { success: false, error: 'Deze activiteit is alleen voor leden.' };
        }

        const user = session?.user as unknown as EnrichedUser;
        const isMember = user?.membership_status === 'active';
        const price = (isMember ? activity.price_members : activity.price_non_members) ?? 0;

        const { query } = await import('@/lib/database');
        const existingCheck = await query(
            `SELECT id FROM event_signups 
             WHERE event_id = $1 AND LOWER(participant_email) = LOWER($2)
             AND payment_status != 'failed' LIMIT 1`,
            [parsed.data.event_id, parsed.data.email]
        );

        if (existingCheck.rows.length > 0) {
            return { success: false, error: 'U bent al aangemeld voor deze activiteit.' };
        }

        const qrToken = `r-${parsed.data.event_id}-${crypto.randomUUID()}`;

        const payload: Partial<DbEventSignup> = {
            event_id: parsed.data.event_id,
            participant_name: parsed.data.name,
            participant_email: parsed.data.email,
            participant_phone: parsed.data.phoneNumber,
            payment_status: (price ?? 0) > 0 ? 'open' : 'paid',
            qr_token: qrToken,
            directus_relations: userId || null,
            is_member: isMember
        };

        const signupId = await createEventSignupDb(payload);
        if (!signupId) throw new Error('Could not write to database');

        revalidateTag(`event_signups_${parsed.data.event_id}`, 'max');

        if ((price ?? 0) > 0) {
            const financeUrl = `${getFinanceServiceUrl()}/api/payments/create`;
            const paymentRes = await fetchWithTimeout(financeUrl, {
                method: 'POST',
                headers: getInternalHeaders(),
                body: JSON.stringify({
                    amount: price,
                    description: `Signup: ${activity.titel}`,
                    registrationId: signupId,
                    registrationType: 'event_signup',
                    email: parsed.data.email,
                    firstName: parsed.data.name,
                    phoneNumber: parsed.data.phoneNumber,
                    userId: userId,
                    isContribution: false,
                    redirectUrl: `${process.env.PUBLIC_URL}/activiteiten/bevestiging?id=${signupId}`
                })
            });
            const paymentData = await paymentRes.json();
            if (paymentRes.ok && paymentData.checkoutUrl) {
                return { success: true, checkoutUrl: paymentData.checkoutUrl };
            }

            try {
                await deleteEventSignupDb(signupId);
                getSystemDirectus().request(deleteItem('event_signups', signupId)).catch(() => { });
            } catch (_error) { }

            return { success: false, error: 'Could not create payment for this signup.' };
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
                signupId: signupId,
                qrToken: qrToken,
                accessToken: qrToken
            };

            await redis.xadd('v7:events', '*', 'payload', JSON.stringify(eventPayload));

            return {
                success: true,
                message: 'Inschrijving geslaagd!',
                signupId: signupId,
                qrToken: qrToken
            };
        }
    } catch (error: unknown) {
        if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
            return { success: false, error: 'U bent al aangemeld voor deze activiteit.' };
        }

        return { success: false, error: 'Er is een fout opgetreden bij de inschrijving.' };
    }
}
