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
    FEATURE_FLAG_FIELDS,
    TRIP_FIELDS,
    TRIP_SIGNUP_FIELDS,
    SAFE_TRIP_SIGNUP_FIELDS,
    USER_FULL_FIELDS,
    TRIP_ID_FIELDS
} from '@salvemundi/validations';

import { getSystemDirectus } from '@/lib/directus';
import { readItems, createItem, readUsers } from '@directus/sdk';
import { query } from '@/lib/db';
import { auth } from '@/server/auth/auth';
import { headers as nextHeaders } from 'next/headers';
import { fetchUserSignupStatusDb } from './reis-db.utils';
import { getRedis } from '@/server/auth/redis-client';
import { randomUUID } from 'crypto';

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
    try {
        const { rows } = await query('SELECT is_active, message FROM feature_flags WHERE name = $1 LIMIT 1', ['trip_registration']);
        const flag = rows?.[0];

        if (!flag) return null;

        return {
            id: 'reis',
            show: !!flag.is_active,
            disabled_message: flag.message
        };
    } catch (err: any) {
        console.error('[reis.actions#getReisSiteSettings] SQL Error:', err);
        return null;
    }
}

export async function getCurrentUserProfileAction(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
        const headers = await nextHeaders(); // Force dynamic
        const session = await auth.api.getSession({ headers });
        if (!session || !session.user) return { success: false, error: "Niet ingelogd" };

        const directus = getSystemDirectus();
        const userEmail = session.user.email?.toLowerCase();

        if (!userEmail) return { success: false, error: "Geen e-mailadres gevonden in sessie" };

        const users = await directus.request(readUsers({
            filter: { 
                email: { _icontains: userEmail } 
            },
            fields: [
                'id', 'first_name', 'last_name', 'email', 'avatar', 
                'membership_status', 'phone_number', 'date_of_birth', 
                'entra_id', 'membership_expiry', 'description', 
                'location', 'title', 'tags', 'admin_access'
            ] as any,
            limit: 1
        }));

        if (!users || users.length === 0) {
            console.warn(`[ReisAction] User not found in Directus for email: ${userEmail}`);
            return { success: false, error: "Gebruiker niet gevonden in Directus" };
        }

        return { success: true, data: users[0] };
    } catch (err) {
        console.error('[reis.actions#getCurrentUserProfileAction] Error:', err);
        return { success: false, error: "Profiel ophalen mislukt" };
    }
}

export async function getUpcomingTrips(): Promise<ReisTrip[]> {
    try {
        await nextHeaders(); // Force dynamic
        const data = await getSystemDirectus().request(readItems('trips', {
            filter: {
                _or: [
                    { status: { _eq: 'published' } },
                    { status: { _null: true } }
                ]
            },
            fields: [...TRIP_FIELDS],
            sort: ['start_date']
        }));

        const parsed = reisTripSchema.array().safeParse(data ?? []);
        if (!parsed.success) {
            console.error('[reis.actions#getUpcomingTrips] Validation failed', parsed.error.flatten().fieldErrors);
            return [];
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const validTrips = parsed.data.filter((trip: ReisTrip) => {
            if (trip.end_date) {
                const endDate = new Date(trip.end_date);
                endDate.setHours(23, 59, 59, 999);
                return endDate >= today;
            }

            const dateStr = trip.event_date || trip.start_date;
            if (!dateStr) return false;
            const eventDate = new Date(dateStr);
            eventDate.setHours(23, 59, 59, 999);
            return eventDate >= today;
        });

        validTrips.sort((a: ReisTrip, b: ReisTrip) => {
            const dateA = new Date((a.event_date || a.start_date)!);
            const dateB = new Date((b.event_date || b.start_date)!);
            return dateA.getTime() - dateB.getTime();
        });

        return validTrips;
    } catch (err) {
        console.error('[reis.actions#getUpcomingTrips] Error:', err);
        return [];
    }
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
        console.error('[reis.actions#getTripParticipantsCount] Error:', err);
        return 0;
    }
}

export async function getUserTripSignup(tripId: number): Promise<ReisTripSignup | null> {
    try {
        const headers = await nextHeaders(); // Force dynamic
        const session = await auth.api.getSession({ headers });
        
        if (!session || !session.user) {
            return null;
        }

        const userId = session.user.id;

        // 1. Direct DB fetch for absolute consistency (Source of Truth)
        const dbResult = await fetchUserSignupStatusDb(userId, tripId);
        if (dbResult) return dbResult;

        // 2. Fallback to Directus if DB query returns nothing or fails
        const directus = getSystemDirectus();
        const data = await directus.request(readItems('trip_signups', {
            filter: { 
                trip_id: { _eq: tripId },
                directus_relations: { _eq: userId },
                status: { _neq: 'cancelled' }
            } as any,
            fields: [...SAFE_TRIP_SIGNUP_FIELDS] as any,
            limit: 1
        }));

        if (!data || data.length === 0) {
            return null;
        }

        return data[0] as any;
    } catch (err) {
        console.error('[reis.actions#getUserTripSignup] Error:', err);
        return null;
    }
}

/**
 * Fetches all signups for a specific trip.
 * @internal This function is not exported to prevent it from becoming a public Server Action.
 */
async function getTripSignups(tripId: number): Promise<ReisTripSignup[]> {
    try {
        const data = await getSystemDirectus().request(readItems('trip_signups', {
            filter: { trip_id: { _eq: tripId } },
            fields: [...TRIP_SIGNUP_FIELDS] as any,
            limit: -1
        }));

        const parsed = reisTripSignupSchema.array().safeParse(data ?? []);
        if (!parsed.success) {
            console.error('[reis.actions#getTripSignups] Validation failed', parsed.error.flatten().fieldErrors);
            return [];
        }
        return parsed.data;
    } catch (err) {
        console.error('[reis.actions#getTripSignups] Error:', err);
        return [];
    }
}

export async function createTripSignup(data: ReisSignupForm, tripId: number): Promise<{ success: boolean; message?: string }> {
    const session = await auth.api.getSession({ headers: await nextHeaders() });
    
    const parsed = reisSignupFormSchema.safeParse(data);
    if (!parsed.success) {
        console.error('[reis.actions#createTripSignup] Zod validation failed:', parsed.error.flatten().fieldErrors);
        return { success: false, message: 'Ongeldige invoer. Controleer de velden en probeer het opnieuw.' };
    }

    const { email } = parsed.data;

    const [existingSignups, siteSettings] = await Promise.all([
        getTripSignups(tripId),
        getReisSiteSettings()
    ]);

    // 1. Global site-level check
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

    // 2. Trip-specific registration check
    const registrationStartDate = targetTrip.registration_start_date ? new Date(targetTrip.registration_start_date) : null;
    const now = new Date();
    const isRegistrationDateReached = registrationStartDate ? now >= registrationStartDate : false;
    const canSignUp = targetTrip.registration_open || isRegistrationDateReached;

    if (!canSignUp) {
        return { success: false, message: 'De inschrijving voor deze reis is momenteel niet geopend.' };
    }

    const participantsCount = existingSignups.filter(s => s.status === 'confirmed' || s.status === 'registered').length;
    const shouldBeWaitlisted = participantsCount >= targetTrip.max_participants;

    const isCommitteeMember = !!(session?.user as any)?.committees?.length;

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
        
        // 1. Global site-level check inside lock
        const isReisEnabled = siteSettings?.show ?? true;
        if (!isReisEnabled) {
            return { success: false, message: 'Inschrijvingen voor de reis zijn momenteel gesloten.' };
        }

        // 2. Re-check for logged-in users inside lock
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

        // 3. Trip-specific registration check inside lock
        const registrationStartDate = targetTrip.registration_start_date ? new Date(targetTrip.registration_start_date) : null;
        const now = new Date();
        const isRegistrationDateReached = registrationStartDate ? now >= registrationStartDate : false;
        const canSignUp = targetTrip.registration_open || isRegistrationDateReached;

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
            directus_relations: userId || null, // Link to the user who created the signup (BetterAuth ID)
            status: shouldBeWaitlisted ? ('waitlist' as const) : ('registered' as const),
            role: isCommitteeMember ? ('crew' as const) : ('participant' as const),
            deposit_paid: false,
            full_payment_paid: false,
            access_token: randomUUID(),
        };
        
        const directus = getSystemDirectus();
        const result = await directus.request(createItem('trip_signups', payload));
        
        // Ensure the path is revalidated immediately so the status page reflects the new record
        const { revalidatePath, ...cacheFunctions } = await import('next/cache');
        const cache = cacheFunctions as any;
        if (cache.updateTag) cache.updateTag('reis-status');
        else if (cache.revalidateTag) cache.revalidateTag('reis-status', 'max');
        
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
        }).catch(e => console.error('[reis.actions#createTripSignup] Mail trigger failed', e));

        return { success: true };
    } catch (err: any) {
        // Detailed error logging for Directus SDK failures
        const errorDetails = err.errors ? JSON.stringify(err.errors, null, 2) : err.message;
        console.error(`[reis.actions#createTripSignup] Directus Error:`, errorDetails);
        
        return { success: false, message: 'Interne serverfout tijdens inschrijving.' };
    } finally {
        // Safe lock release: only delete if the token still matches (to avoid deleting someone else's lock if we timed out)
        const currentToken = await redis.get(lockKey);
        if (currentToken === lockToken) {
            await redis.del(lockKey);
        }
    }
}

export async function revalidateReisAction() {
    try {
        const { revalidatePath, ...cacheFunctions } = await import('next/cache');
        const cache = cacheFunctions as any;
        if (cache.updateTag) cache.updateTag('reis-status');
        else if (cache.revalidateTag) cache.revalidateTag('reis-status', 'max');
        
        revalidatePath('/reis');
        revalidatePath('/beheer/reis');
        return { success: true };
    } catch (err) {
        console.error('[reis.actions#revalidateReisAction] Error:', err);
        return { success: false };
    }
}
