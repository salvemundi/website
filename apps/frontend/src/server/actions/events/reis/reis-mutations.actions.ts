'use server';

import 'server-only';
import { revalidatePath } from 'next/cache';
import {
    reisSignupFormSchema,
    type ReisSignupForm
} from '@salvemundi/validations/schema/reis.zod';
import { getSystemDirectus } from '@/lib/directus';
import { createItem } from '@directus/sdk';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import { logAdminAction } from '@/server/actions/infrastructure/audit.actions';
import { safeConsoleError } from '@/server/utils/logger';
import {
    fetchUserSignupStatusDb,
    insertTripSignupDb,
    deleteTripSignupDb
} from '@/server/internal/reis-db.utils';
import { fetchUserCommitteesDb, type Committee } from '@/server/internal/user-db.utils';
import { getRedis } from '@/server/auth/redis-client';
import { randomUUID } from 'crypto';
import { normalizeDate } from '@/lib/utils/date-utils';
import { getReisSiteSettings, getUpcomingTrips, getTripSignupsInternal } from './reis-queries.actions';

const getMailUrl = () => process.env.MAIL_SERVICE_URL;

const getServiceHeaders = (): HeadersInit => {
    const token = process.env.INTERNAL_SERVICE_TOKEN;
    if (!token) throw new Error('INTERNAL_SERVICE_TOKEN is missing');
    return {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
};

export async function createTripSignup(data: ReisSignupForm, tripId: number): Promise<{ success: boolean; message?: string }> {
    const { rateLimit } = await import('@/server/utils/ratelimit');
    const { success: rateLimitSuccess } = await rateLimit('trip-signup', 10, 600); // 10 pogingen per 10 min
    if (!rateLimitSuccess) {
        return { success: false, message: 'Te veel aanmeldingen vanaf dit IP-adres. Probeer het over een kwartier opnieuw.' };
    }

    // Normalize DD-MM-YYYY to YYYY-MM-DD before validation
    data.date_of_birth = normalizeDate(data.date_of_birth) || data.date_of_birth;

    const parsed = reisSignupFormSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, message: 'Ongeldige invoer. Controleer de velden en probeer het opnieuw.' };
    }

    if (parsed.data.website) {
        return { success: false, message: 'Spam gedetecteerd.' };
    }

    const session = await getEnrichedSession();

    const [existingSignups, siteSettings] = await Promise.all([
        getTripSignupsInternal(tripId),
        getReisSiteSettings()
    ]);

    const isReisEnabled = siteSettings?.show ?? true;
    if (!isReisEnabled) {
        return { success: false, message: 'Inschrijvingen voor de reis zijn momenteel gesloten.' };
    }

    const userId = session?.user?.id;
    // Logged in users: check for existing signup
    if (userId) {
        const existing = existingSignups.find(s => s.directus_relations === userId && s.status !== 'cancelled');
        if (existing) {
            return { success: false, message: 'Je bent al aangemeld voor deze reis.' };
        }
    }

    const trips = await getUpcomingTrips();
    const targetTrip = trips.find(t => t.id === tripId);
    if (!targetTrip) {
        return { success: false, message: 'Reis niet gevonden.' };
    }

    const now = new Date();
    const registrationStartDate = targetTrip.registration_start_date ? new Date(targetTrip.registration_start_date) : null;

    const isRegistrationDateReached = Boolean(registrationStartDate && now >= registrationStartDate);

    const canSignUp = (targetTrip.registration_open || isRegistrationDateReached) && !targetTrip.allow_final_payments;

    if (!canSignUp) {
        if (targetTrip.allow_final_payments) {
            return { success: false, message: 'De inschrijving voor deze reis is gesloten omdat de betalingsfase is begonnen.' };
        }
        const dateText = registrationStartDate ? ` op ${registrationStartDate.toLocaleString('nl-NL')}` : '';
        return { success: false, message: `De inschrijving voor deze reis is nog niet geopend${dateText}.` };
    }


    const userCommittees = userId ? await fetchUserCommitteesDb(userId) : [];
    const isReisCommitteeMember = userCommittees.some((c: Committee) => c.azure_group_id === '4c027a6d-0307-4aee-b719-23d67bcd0959'); // Reiscommissie UUID

    const redis = await getRedis();
    const lockKey = `lock:trip:${tripId}:signup`;
    const lockToken = Math.random().toString(36).substring(2);
    let lockAcquired = false;

    // Retry mechanism for the lock (spin-lock with backoff)
    for (let i = 0; i < 10; i++) {
        const result = await redis.set(lockKey, lockToken, 'PX', 10000, 'NX'); // 10s TTL
        if (result === 'OK') {
            lockAcquired = true;
            break;
        }
        await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
    }

    if (!lockAcquired) {
        return { success: false, message: 'De server is momenteel erg druk. Probeer het over een paar seconden opnieuw.' };
    }

    try {
        const [existingSignups, siteSettings] = await Promise.all([
            getTripSignupsInternal(tripId),
            getReisSiteSettings()
        ]);

        const isReisEnabled = siteSettings?.show ?? true;
        if (!isReisEnabled) {
            return { success: false, message: 'Inschrijvingen voor de reis zijn momenteel gesloten.' };
        }

        if (userId) {
            const existing = existingSignups.find(s => s.directus_relations === userId && s.status !== 'cancelled');
            if (existing) {
                return { success: false, message: 'Je bent al aangemeld voor deze reis.' };
            }
        }

        const trips = await getUpcomingTrips();
        const targetTrip = trips.find(t => t.id === tripId);
        if (!targetTrip) {
            return { success: false, message: 'Reis niet gevonden.' };
        }

        const now = new Date();
        const registrationStartDate = targetTrip.registration_start_date ? new Date(targetTrip.registration_start_date) : null;

        const registrationDateReached = Boolean(registrationStartDate && now >= registrationStartDate);

        const canSignUp = (targetTrip.registration_open || registrationDateReached) && !targetTrip.allow_final_payments;

        if (!canSignUp) {
            return { success: false, message: 'De inschrijving voor deze reis is momenteel niet geopend.' };
        }

        const participantsCount = existingSignups.filter(s => s.status === 'confirmed' || s.status === 'registered').length;
        const shouldBeWaitlisted = participantsCount >= targetTrip.max_participants;

        const payload = {
            trip_id: Number(tripId),
            first_name: parsed.data.first_name,
            last_name: parsed.data.last_name,
            email: parsed.data.email,
            phone_number: parsed.data.phone_number,
            date_of_birth: parsed.data.date_of_birth,
            terms_accepted: parsed.data.terms_accepted,
            directus_relations: userId || null,
            status: shouldBeWaitlisted ? ('waitlist' as const) : ('registered' as const),
            role: isReisCommitteeMember ? ('crew' as const) : ('participant' as const),
            deposit_paid: false,
            full_payment_paid: false,
            access_token: randomUUID(),
            created_at: new Date().toISOString()
        };

        const signupId = await insertTripSignupDb(payload);
        if (!signupId) throw new Error('Database insert failed');

        try {
            await getSystemDirectus().request(createItem('trip_signups', { ...payload, id: signupId }));
        } catch (error: unknown) {
            const errorObj = error as { errors?: { extensions?: { code?: string }, message?: string }[], message?: string };
            const firstError = errorObj.errors?.[0];
            const isUniqueError =
                firstError?.extensions?.code === 'RECORD_NOT_UNIQUE' ||
                firstError?.message?.toLowerCase().includes('unique') ||
                (errorObj.message || '').toLowerCase().includes('unique');

            if (isUniqueError) {
                try {
                    const existing = await fetchUserSignupStatusDb(userId || payload.email, tripId);
                    const matchesTrip = existing && Number(existing.trip_id) === Number(payload.trip_id);
                    const matchesUser = existing && userId && existing.directus_relations === userId;
                    const matchesEmail = existing && !userId && existing.email === payload.email;

                    if (matchesTrip && (matchesUser || matchesEmail)) {
                        return { success: true };
                    }
                } catch (error: unknown) {
                    safeConsoleError(`[Reis-Mutations-Action][createTripSignup] Failed to fetch user signup status:`, error);
                }
            }

            await deleteTripSignupDb(signupId);
            await logAdminAction('trip_signup_rollback', 'ERROR', { context: 'reis', trip_id: tripId, id: signupId, error: String(error), action: 'rollback_delete' });
            return { success: false, message: 'Synchronisatie met CMS mislukt. Inschrijving niet voltooid.' };
        }

        revalidatePath('/reis');
        revalidatePath('/beheer/reis');

        const statusDisplay = payload.status === 'waitlist' ? 'Wachtlijst' : 'Geregistreerd (Beoordeling)';
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://salvemundi.nl';

        fetch(`${getMailUrl()}/api/mail/send`, {
            method: 'POST',
            headers: getServiceHeaders(),
            body: JSON.stringify({
                templateId: 'trip-signup',
                to: payload.email,
                data: {
                    firstName: payload.first_name,
                    status: payload.status,
                    statusDisplay: statusDisplay,
                    siteUrl: siteUrl
                }
            })
        }).catch((error: unknown) => {
            safeConsoleError(`[Reis-Mutations-Action][createTripSignup] Failed to send trip signup email:`, error);
        });

        return { success: true };
    } catch (error: unknown) {
        safeConsoleError(`[Reis-Mutations-Action][createTripSignup] Failed to create trip signup for trip ${tripId}:`, error);
        const message = error instanceof Error ? error.message : 'Interne serverfout tijdens inschrijving.';
        return { success: false, message: message };
    } finally {
        const currentToken = await redis.get(lockKey);
        if (currentToken === lockToken) {
            await redis.del(lockKey);
        }
    }
}

export async function revalidateReisAction() {
    try {
        const { revalidatePath, revalidateTag } = await import('next/cache');
        revalidateTag('reis-status', 'max');

        revalidatePath('/reis');
        revalidatePath('/beheer/reis');
        return { success: true };
    } catch (error: unknown) {
        safeConsoleError(`[Reis-Mutations-Action][revalidateReisAction] Failed to revalidate reis:`, error);
        return { success: false };
    }
}
