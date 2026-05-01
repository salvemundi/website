'use server';

import { revalidatePath } from 'next/cache';
import {
    reisSiteSettingsSchema,
    reisTripSchema,
    reisTripSignupSchema,
    reisSignupFormSchema,
    type ReisSiteSettings,
    type ReisTrip,
    type ReisTripSignup,
    type ReisSignupForm,
} from '@salvemundi/validations/schema/reis.zod';
import { 
    FEATURE_FLAG_FIELDS, 
    TRIP_FIELDS, 
    TRIP_SIGNUP_FIELDS, 
    SAFE_TRIP_SIGNUP_FIELDS, 
    USER_FULL_FIELDS, 
    TRIP_ID_FIELDS,
    TRIP_ACTIVITY_FIELDS 
} from '@salvemundi/validations/directus/fields';
import { COMMITTEES } from '@/shared/lib/permissions-config';

import { getSystemDirectus } from '@/lib/directus';
import { readItems, createItem, readUsers } from '@directus/sdk';
import { query } from '@/lib/database';
import { auth } from '@/server/auth/auth';
import { headers as nextHeaders } from 'next/headers';
import { logAdminAction } from './audit.actions';
import { 
    fetchUserSignupStatusDb, 
    fetchPublicTripsDb, 
    insertTripSignupDb, 
    deleteTripSignupDb,
    fetchAllTripSignupsDb,
    fetchTripSignupByIdDb, 
    fetchTripByIdDb, 
    fetchTripActivitiesByTripIdDb,
    fetchSelectedSignupActivitiesDb
} from './reis-db.utils';
import { fetchUserProfileByEmailDb, fetchUserCommitteesDb } from './user-db.utils';
import { getRedis } from '@/server/auth/redis-client';
import { randomUUID } from 'crypto';
import { normalizeDate } from '@/lib/utils/date-utils';

const getMailUrl = () => process.env.MAIL_SERVICE_URL;

const getServiceHeaders = (): HeadersInit => {
    const token = process.env.INTERNAL_SERVICE_TOKEN;
    if (!token) throw new Error('INTERNAL_SERVICE_TOKEN is missing');
    return {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
};

export async function getReisSiteSettings(): Promise<ReisSiteSettings | null> {
    const { rows } = await query('SELECT is_active, message FROM feature_flags WHERE name = $1 LIMIT 1', ['trip_registration']);
    const flag = rows?.[0];

    if (!flag) return null;

    return {
        id: 'reis',
        show: !!flag.is_active,
        disabled_message: flag.message
    };
}

export async function getCurrentUserProfileAction(): Promise<{ success: boolean; data?: Record<string, unknown>; error?: string }> {
    try {
        const headers = await nextHeaders();
        const session = await auth.api.getSession({ headers });
        if (!session || !session.user) return { success: false, error: "Niet ingelogd" };

        const userEmail = session.user.email?.toLowerCase();
        if (!userEmail) return { success: false, error: "Geen e-mailadres gevonden in sessie" };

        const user = await fetchUserProfileByEmailDb(userEmail);

        if (!user) {
            return { success: false, error: "Gebruiker niet gevonden in systeem" };
        }

        return { success: true, data: user };
    } catch (err) {
        return { success: false, error: "Profiel ophalen mislukt" };
    }
}

export async function getUpcomingTrips(): Promise<ReisTrip[]> {
    // 1. Direct SQL for speed and bypass cache
    const data = await fetchPublicTripsDb();

    const parsed = reisTripSchema.array().safeParse(data ?? []);
    if (!parsed.success) {
        console.error('[Validation Error] getUpcomingTrips:', parsed.error);
        return (data ?? []) as ReisTrip[];
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const validTrips = parsed.data.filter((trip: ReisTrip) => {
        if (trip.end_date) {
            const endDate = new Date(trip.end_date);
            endDate.setHours(23, 59, 59, 999);
            return endDate >= today;
        }

        const dateStr = trip.start_date;
        if (!dateStr) return false;
        const eventDate = new Date(dateStr);
        eventDate.setHours(23, 59, 59, 999);
        return eventDate >= today;
    });

    return validTrips;
}

export async function getTripParticipantsCount(tripId: number): Promise<number> {
    try {
        const { rows } = await query(
            `SELECT COUNT(*)::int as count FROM trip_signups 
             WHERE trip_id = $1 AND status IN ('registered', 'confirmed')`,
            [tripId]
        );
        return rows?.[0]?.count || 0;
    } catch (err) {
        
        return 0;
    }
}

export async function getUserTripSignup(tripId: number): Promise<ReisTripSignup | null> {
    try {
        const headers = await nextHeaders();
        const session = await auth.api.getSession({ headers });
        
        if (!session || !session.user) {
            return null;
        }

        const userId = session.user.id;
        return await fetchUserSignupStatusDb(userId, tripId);
    } catch (err) {
        
        return null;
    }
}

/**
 * Fetches all signups for a specific trip.
 * @internal This function is not exported to prevent it from becoming a public Server Action.
 */
async function getTripSignups(tripId: number): Promise<ReisTripSignup[]> {
    try {
        return await fetchAllTripSignupsDb(tripId);
    } catch (err) {
        
        return [];
    }
}

export async function createTripSignup(data: ReisSignupForm, tripId: number): Promise<{ success: boolean; message?: string }> {
    const { rateLimit } = await import('../utils/ratelimit');
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

    const { email } = parsed.data;
    const session = await auth.api.getSession({ headers: await nextHeaders() });

    const [existingSignups, siteSettings] = await Promise.all([
        getTripSignups(tripId),
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

    const registrationStartDate = targetTrip.registration_start_date ? new Date(targetTrip.registration_start_date) : null;
    const now = new Date();
    
    // Default to true if no date is set, so the toggle works immediately
    const isRegistrationDateReached = registrationStartDate ? now >= registrationStartDate : true;
    
    // canSignUp is true ONLY if both the trip switch (registration_open) AND the start date are satisfied.
    const canSignUp = Boolean(targetTrip.registration_open && isRegistrationDateReached);

    if (!canSignUp) {
        return { success: false, message: 'De inschrijving voor deze reis is momenteel niet geopend.' };
    }

    const participantsCount = existingSignups.filter(s => s.status === 'confirmed' || s.status === 'registered').length;
    const shouldBeWaitlisted = participantsCount >= targetTrip.max_participants;

    const userCommittees = userId ? await fetchUserCommitteesDb(userId) : [];
    const isReisCommitteeMember = userCommittees.some((c: { azure_group_id?: string | null }) => c.azure_group_id === '4c027a6d-0307-4aee-b719-23d67bcd0959'); // Reiscommissie UUID

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
            getTripSignups(tripId),
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

        const registrationStartDate = targetTrip.registration_start_date ? new Date(targetTrip.registration_start_date) : null;
        const now = new Date();
        const isRegistrationDateReached = registrationStartDate ? now >= registrationStartDate : true;
        const canSignUp = Boolean(targetTrip.registration_open && isRegistrationDateReached);

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
        } catch (err: unknown) {
            const errorObj = err as { errors?: { extensions?: { code?: string }, message?: string }[], message?: string };
            const firstError = errorObj.errors?.[0];
            const isUniqueError = 
                firstError?.extensions?.code === 'RECORD_NOT_UNIQUE' || 
                firstError?.message?.toLowerCase().includes('unique') || 
                (errorObj.message || '').toLowerCase().includes('unique');
            
            if (isUniqueError) {
                try {
                    const existing = await fetchUserSignupStatusDb(userId || '', tripId);
                    const matchesTrip = existing && Number(existing.trip_id) === Number(payload.trip_id);
                    const matchesUser = existing && userId && existing.directus_relations === userId;
                    const matchesEmail = existing && !userId && existing.email === payload.email;

                    if (matchesTrip && (matchesUser || matchesEmail)) {
                        return { success: true };
                    }
                } catch (checkErr) {}
            }

            await deleteTripSignupDb(signupId);
            await logAdminAction('trip_signup_rollback', 'ERROR', { id: signupId, error: String(err), action: 'rollback_delete' });
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
        }).catch(() => {});

        return { success: true };
    } catch (err: unknown) {
        console.error('[ReisActions] Critical error in signup:', err);
        return { success: false, message: 'Interne serverfout tijdens inschrijving.' };
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
    } catch (err) {
        return { success: false };
    }
}
