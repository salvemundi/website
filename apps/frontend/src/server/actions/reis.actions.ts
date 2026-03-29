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
    USER_FULL_FIELDS,
    TRIP_ID_FIELDS
} from '@salvemundi/validations';

import { getSystemDirectus } from '@/lib/directus';
import { readItems, createItem, readUsers } from '@directus/sdk';
import { auth } from '@/server/auth/auth';
import { headers as nextHeaders } from 'next/headers';

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
        const directus = getSystemDirectus();
        const data = await directus.request(readItems('feature_flags', {
            filter: { name: { _eq: 'trip_registration' } },
            fields: [...FEATURE_FLAG_FIELDS],
            limit: 1
        }));

        if (!data || data.length === 0) return null;
        const flag = (data[0] as any);

        return {
            id: 'reis',
            show: flag.is_active,
            disabled_message: flag.message
        };
    } catch (err: any) {
        if (err?.response?.status !== 403) {
            console.error('[reis.actions#getReisSiteSettings] Error:', err);
        }
        return null;
    }
}

export async function getCurrentUserProfileAction(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
        const session = await auth.api.getSession({ headers: await nextHeaders() });
        if (!session || !session.user) return { success: false, error: "Niet ingelogd" };

        const directus = getSystemDirectus();
        const userEmail = session.user.email;

        const users = await directus.request(readUsers({
            filter: { email: { _eq: userEmail } },
            fields: [...USER_FULL_FIELDS] as any,
            limit: 1
        }));

        if (!users || users.length === 0) return { success: false, error: "Gebruiker niet gevonden" };

        return { success: true, data: users[0] };
    } catch (err) {
        console.error('[reis.actions#getCurrentUserProfileAction] Error:', err);
        return { success: false, error: "Profiel ophalen mislukt" };
    }
}

export async function getUpcomingTrips(): Promise<ReisTrip[]> {
    try {
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
        const data = await getSystemDirectus().request(readItems('trip_signups', {
            filter: { 
                _and: [
                    { trip_id: { _eq: tripId } },
                    { status: { _in: ['registered', 'confirmed'] } }
                ]
            },
            fields: [...TRIP_ID_FIELDS],
            limit: -1
        }));
        return data?.length || 0;
    } catch (err) {
        console.error('[reis.actions#getTripParticipantsCount] Error:', err);
        return 0;
    }
}

export async function getUserTripSignup(tripId: number): Promise<ReisTripSignup | null> {
    try {
        const session = await auth.api.getSession({ headers: await nextHeaders() });
        if (!session || !session.user) return null;

        const userEmail = session.user.email;
        const data = await getSystemDirectus().request(readItems('trip_signups', {
            filter: { 
                _and: [
                    { trip_id: { _eq: tripId } },
                    { email: { _eq: userEmail } }
                ]
            },
            fields: [...TRIP_SIGNUP_FIELDS] as any,
            limit: 1
        }));

        if (!data || data.length === 0) return null;
        return data[0] as any;
    } catch (err) {
        console.error('[reis.actions#getUserTripSignup] Error:', err);
        return null;
    }
}

export async function getTripSignups(tripId: number): Promise<ReisTripSignup[]> {
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

    const existingSignups = await getTripSignups(tripId);
    const existing = existingSignups.find(s => s.email.toLowerCase() === email.toLowerCase() && s.status !== 'cancelled');
    if (existing) {
        return { success: false, message: 'Er is al een actieve aanmelding gevonden met dit e-mailadres.' };
    }

    const trips = await getUpcomingTrips();
    const targetTrip = trips.find(t => t.id === tripId);
    if (!targetTrip) {
        return { success: false, message: 'Reis niet gevonden.' };
    }

    const participantsCount = existingSignups.filter(s => s.status === 'confirmed' || s.status === 'registered').length;
    const shouldBeWaitlisted = participantsCount >= targetTrip.max_participants;

    const userId = session?.user?.id;
    const isCommitteeMember = !!(session?.user as any)?.committees?.length;

    const payload = {
        trip_id: tripId,
        first_name: parsed.data.first_name,
        last_name: parsed.data.last_name,
        email: parsed.data.email,
        phone_number: parsed.data.phone_number,
        date_of_birth: parsed.data.date_of_birth,
        terms_accepted: parsed.data.terms_accepted,
        status: shouldBeWaitlisted ? 'waitlist' : 'registered' as any,
        role: isCommitteeMember ? 'crew' : 'participant' as any,
        deposit_paid: false,
        full_payment_paid: false,
    } as any;

    try {
        const directus = getSystemDirectus();
        await directus.request(createItem('trip_signups', payload));

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
    } catch (err) {
        console.error('[reis.actions#createTripSignup] Error:', err);
        return { success: false, message: 'Interne serverfout tijdens inschrijving.' };
    }
}



