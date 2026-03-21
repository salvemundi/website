'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import {
    reisSiteSettingsSchema,
    reisTripSchema,
    reisTripSignupSchema,
    reisSignupFormSchema,
    type ReisSiteSettings,
    type ReisTrip,
    type ReisTripSignup,
    type ReisSignupForm,
} from '@salvemundi/validations';

import { directusRequest } from '@/lib/directus';
import { readItems, createItem, updateItem } from '@directus/sdk';
import { auth } from '@/server/auth/auth';
import { headers as nextHeaders } from 'next/headers';

export async function getReisSiteSettings(): Promise<ReisSiteSettings | null> {
    try {
        const data = await directusRequest(readItems('site_settings', {
            filter: { id: { _eq: 'reis' } },
            limit: 1
        }));
        
        if (!data || data.length === 0) return null;

        const parsed = reisSiteSettingsSchema.safeParse(data[0]);
        if (!parsed.success) {
            console.error('[reis.actions#getReisSiteSettings] Validation failed', parsed.error.flatten().fieldErrors);
            return null;
        }
        return parsed.data;
    } catch (err) {
        console.error('[reis.actions#getReisSiteSettings] Error:', err);
        return null;
    }
}

export async function getUpcomingTrips(): Promise<ReisTrip[]> {
    try {
        const data = await directusRequest(readItems('trips', {
            filter: { status: { _eq: 'published' } },
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

export async function getTripSignups(tripId: number): Promise<ReisTripSignup[]> {
    try {
        const data = await directusRequest(readItems('trip_signups', {
            filter: { trip_id: { _eq: tripId } },
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

    // Check if user already exists
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

    // Server-side role calculation
    const isCommitteeMember = (session?.user as any)?.committees?.length > 0;

    const payload = {
        trip_id: tripId,
        first_name: parsed.data.first_name,
        middle_name: parsed.data.middle_name || null,
        last_name: parsed.data.last_name,
        email: parsed.data.email,
        phone_number: parsed.data.phone_number,
        date_of_birth: parsed.data.date_of_birth,
        terms_accepted: parsed.data.terms_accepted,
        status: shouldBeWaitlisted ? 'waitlist' : 'registered' as any,
        role: isCommitteeMember ? 'crew' : 'participant' as any,
        deposit_paid: false,
        full_payment_paid: false,
    };

    try {
        await directusRequest(createItem('trip_signups', payload));

        revalidatePath('/reis');
        revalidatePath('/beheer/reis');
        return { success: true };
    } catch (err) {
        console.error('[reis.actions#createTripSignup] Error:', err);
        return { success: false, message: 'Interne serverfout tijdens inschrijving.' };
    }
}

export async function cancelTripSignup(signupId: number): Promise<{ success: boolean; message?: string }> {
    const session = await auth.api.getSession({ headers: await nextHeaders() });

    if (!session || !session.user) {
        console.error('[reis.actions#cancelTripSignup] Unauthorized attempt to cancel signup.');
        return { success: false, message: 'Je moet ingelogd zijn om een aanmelding te annuleren.' };
    }

    try {
        const trip = await directusRequest(readItems('trip_signups', {
            filter: { id: { _eq: signupId } },
            limit: 1
        }));

        if (!trip || trip.length === 0) {
            return { success: false, message: 'Aanmelding niet gevonden.' };
        }

        const signup = trip[0];

    
        if (signup.email !== session.user.email) {
            console.error('[reis.actions#cancelTripSignup] Email mismatch for cancellation.');
            return { success: false, message: 'Je kunt alleen je eigen aanmelding annuleren.' };
        }

        await directusRequest(updateItem('trip_signups', signupId, { status: 'cancelled' as any }));

        if (signup.trip_id) {
            revalidatePath('/beheer/reis');
        }
        revalidatePath('/reis');
        return { success: true };
    } catch (err) {
        console.error('[reis.actions#cancelTripSignup] Error:', err);
        return { success: false, message: 'Interne serverfout bij annuleren.' };
    }
}


