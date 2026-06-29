'use server';

import { z } from 'zod';

import { type Activiteit } from '@salvemundi/validations/schema/activity.zod';
import { eventSignupFormSchema, type EventSignupForm } from '@salvemundi/validations/schema/activity.zod';
import { type EventSignup } from '@salvemundi/validations/directus/schema';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import { type EnrichedUser } from '@/types/auth';
import { revalidateTag } from 'next/cache';

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
import { safeConsoleError } from '@/server/utils/logger';

interface FinancePaymentResponse {
    checkoutUrl?: string;
}

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
    } catch (error: unknown) {
        const typedError = error instanceof Error ? error : new Error(String(error));
        safeConsoleError('[public-activiteit.actions.ts][getActivities] ', `Failed to fetch user signups for activities: ${typedError.message}`);
        return activities;
    }
}

export async function getActivityById(id: string): Promise<Activiteit | null> {
    const cleanId = id.includes('-') ? id.split('-')[0] : id;
    if (!/^\d+$/.test(cleanId)) return null;
    return await getActivityByIdInternal(cleanId);
}

export async function getActivityBySlug(slug: string): Promise<Activiteit | null> {
    return await getActivityBySlugInternal(slug);
}

export async function checkUserSignupStatus(eventId: number, email: string, userId?: string | null) {
    try {
        const { db, schema } = await import('@salvemundi/db');
        const { eq, and, or, ilike, ne, desc, isNotNull } = await import('drizzle-orm');

        const rows = await db.select({
            id: schema.event_signups.id,
            qr_token: schema.event_signups.qr_token,
            payment_status: schema.event_signups.payment_status
        }).from(schema.event_signups)
        .where(
            and(
                eq(schema.event_signups.event_id, eventId),
                or(
                    ilike(schema.event_signups.participant_email, email),
                    and(
                        isNotNull(schema.event_signups.directus_relations),
                        eq(schema.event_signups.directus_relations, userId || '')
                    )
                ),
                ne(schema.event_signups.payment_status, 'failed')
            )
        )
        .orderBy(desc(schema.event_signups.created_at))
        .limit(1);

        if (rows.length > 0) {
            const row = rows[0];

            return {
                isSignedUp: true,
                id: row.id,
                qrToken: row.qr_token || '',
                paymentStatus: row.payment_status || 'open'
            };
        }
        return { isSignedUp: false };
    } catch (error: unknown) {
        const typedError = error instanceof Error ? error : new Error(String(error));
        safeConsoleError('[public-activiteit.actions.ts][checkUserSignupStatus] ', `Failed to check user signup status: ${typedError.message}`);
        throw new Error('Er is een fout opgetreden bij het controleren van uw inschrijving');
    }
}

export async function signupForActivity(data: EventSignupForm) {
    const { rateLimit } = await import('@/server/utils/ratelimit');
    const { success } = await rateLimit('event-signup', 10, 600);
    if (!success) {
        return { success: false, error: 'Te veel aanmeldingen vanaf dit IP-adres. Probeer het over een kwartier opnieuw.' };
    }

    const parsed = eventSignupFormSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, errors: z.flattenError(parsed.error).fieldErrors };
    }

    if (parsed.data.website) {
        return { success: false, error: 'Spam detected' };
    }

    try {
        const session = await getEnrichedSession();
        const userId = session?.user.id;

        const activity = await getActivityById(String(parsed.data.event_id));
        if (!activity) return { success: false, error: 'Activiteit niet gevonden' };

        if (activity.registration_deadline) {
            const deadline = new Date(activity.registration_deadline);
            if (new Date() > deadline) {
                return { success: false, error: 'De inschrijfdeadline voor deze activiteit is verstreken.' };
            }
        }

        if (activity.only_members && !userId) {
            return { success: false, error: 'Deze activiteit is alleen voor leden.' };
        }

        const user = session?.user as unknown as EnrichedUser | undefined;
        const isMember = user ? user.membership_status === 'active' : false;
        const priceRaw = (isMember ? activity.price_members : activity.price_non_members);
        const price = Number(priceRaw);

        const { db, schema } = await import('@salvemundi/db');
        const { eq, and, ilike, ne } = await import('drizzle-orm');

        const rows = await db.select({
            id: schema.event_signups.id
        }).from(schema.event_signups).where(
            and(
                eq(schema.event_signups.event_id, parsed.data.event_id),
                ilike(schema.event_signups.participant_email, parsed.data.email),
                ne(schema.event_signups.payment_status, 'failed')
            )
        ).limit(1);

        if (rows.length > 0) {
            return { success: false, error: 'U bent al aangemeld voor deze activiteit.' };
        }

        const qrToken = `r-${parsed.data.event_id}-${crypto.randomUUID()}`;

        const payload: Partial<EventSignup> = {
            event_id: parsed.data.event_id,
            participant_name: parsed.data.name,
            participant_email: parsed.data.email,
            participant_phone: parsed.data.phoneNumber,
            payment_status: price > 0 ? 'open' : 'paid',
            qr_token: qrToken,
            directus_relations: userId || null,
            is_member: isMember
        };

        const signupId = await createEventSignupDb(payload);
        if (!signupId) throw new Error('Could not write to database');

        revalidateTag(`event_signups_${parsed.data.event_id}`, 'max');

        if (price > 0) {
            const financeUrl = `${getFinanceServiceUrl()}/api/finance/create`;
            const paymentRes = await fetchWithTimeout(financeUrl, {
                method: 'POST',
                headers: getInternalHeaders(),
                timeout: 10000,
                body: JSON.stringify({
                    amount: price,
                    description: `Signup: ${activity.name}`,
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
            const paymentData = (await paymentRes.json()) as FinancePaymentResponse;
            if (paymentRes.ok && paymentData.checkoutUrl) {
                return { success: true, checkoutUrl: paymentData.checkoutUrl };
            }

            safeConsoleError('[public-activiteit.actions.ts][signupForActivity] ', `Payment creation failed. Status: ${paymentRes.status}, Response: ${JSON.stringify(paymentData)}`);

            try {
                await deleteEventSignupDb(signupId);
            } catch (deleteError: unknown) {
                const typedDeleteError = deleteError instanceof Error ? deleteError : new Error(String(deleteError));
                safeConsoleError('[public-activiteit.actions.ts][signupForActivity] ', `Failed to delete signup ${signupId}: ${typedDeleteError.message}`);
                throw new Error('Er is een fout opgetreden bij het aanmelden voor deze activiteit');
            }

            return { success: false, error: 'Er is een fout opgetreden bij het aanmelden voor deze activiteit' };
        } else {
            const { getRedis } = await import('@/server/auth/redis-client');
            const redis = await getRedis();

            const eventPayload = {
                event: 'ACTIVITY_SIGNUP_SUCCESS',
                timestamp: new Date().toISOString(),
                email: parsed.data.email,
                name: parsed.data.name,
                eventName: activity.name,
                eventDate: activity.event_date,
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
        const typedError = error instanceof Error ? error : new Error(String(error));
        if ((typedError as { code?: string }).code === '23505') {
            return { success: false, error: 'U bent al aangemeld voor deze activiteit.' };
        }

        safeConsoleError('[public-activiteit.actions.ts][signupForActivity] ', `Unexpected error: ${typedError.message} - ${String(error)}`);

        return { success: false, error: 'Er is een fout opgetreden bij die inschrijving.' };
    }
}


