'use server';

import 'server-only';
import {
    reisTripSchema,
    type ReisSiteSettings,
    type ReisTrip,
    type ReisTripSignup
} from '@salvemundi/validations/schema/trip.zod';
import { db, schema } from '@salvemundi/db';
import { eq, inArray, count, lt, desc, and, or, isNull } from 'drizzle-orm';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import { fetchUserSignupStatusDb, fetchAllTripSignupsDb } from '@/server/internal/reis/reis-signup-db.utils';
import { fetchPublicTripsDb } from '@/server/internal/reis/reis-trip-db.utils';;
import { fetchUserProfileByEmailDb } from '@/server/internal/leden/leden-db.utils';
import { safeConsoleError } from '@/server/utils/logger';
import { getFeatureFlagSettings } from '../../admin/admin-utils.actions';

export async function getReisSiteSettings(): Promise<ReisSiteSettings & { canToggleVisibility?: boolean } | null> {
    const settings = await getFeatureFlagSettings('/reis');
    return {
        id: 'reis',
        show: settings.show,
        disabled_message: settings.disabled_message,
        canToggleVisibility: settings.canToggleVisibility
    };
}

export async function getCurrentUserProfileAction(): Promise<{ success: boolean; data?: unknown; error?: string }> {
    const session = await getEnrichedSession();
    if (!session) return { success: false, error: "Niet ingelogd" };

    const userEmail = session.user.email.toLowerCase();
    if (!userEmail) return { success: false, error: "Geen e-mailadres gevonden in sessie" };

    const user = await fetchUserProfileByEmailDb(userEmail);

    if (!user) {
        return { success: false, error: "Gebruiker niet gevonden in systeem" };
    }

    return { success: true, data: user };
}

export async function getUpcomingTrips(): Promise<ReisTrip[]> {
    const data = await fetchPublicTripsDb();

    const parsed = reisTripSchema.array().safeParse(data);
    if (!parsed.success) {
        safeConsoleError(`[trip-queries.actions.ts][getUpcomingTrips] Failed to parse trips:`, parsed.error);
        return data as unknown as ReisTrip[];
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
        const { and } = await import('drizzle-orm');
        const rows = await db.select({
            count: count()
        }).from(schema.trip_signups)
        .where(
            and(
                eq(schema.trip_signups.trip_id, tripId),
                inArray(schema.trip_signups.status, ['registered', 'confirmed'])
            )
        );
        return rows[0]?.count ?? 0;
    } catch (error: unknown) {
        safeConsoleError(`[trip-queries.actions.ts][getTripParticipantsCount] Failed to get participant count for trip ${tripId}:`, error);
        return 0;
    }
}

export async function getUserTripSignup(tripId: number): Promise<ReisTripSignup | null> {
    const session = await getEnrichedSession();

    if (!session) {
        return null;
    }

    const userId = session.user.id;
    return await fetchUserSignupStatusDb(userId, tripId);
}

export async function getTripSignupsInternal(tripId: number): Promise<ReisTripSignup[]> {
    return await fetchAllTripSignupsDb(tripId);
}

export async function getLatestPastTrip(): Promise<ReisTrip | null> {
    try {
        const todayStr = new Date().toISOString().split('T')[0];
        
        // Find published (or status-null) trips that have already ended
        const data = await db.select()
            .from(schema.trips)
            .where(
                and(
                    or(eq(schema.trips.status, 'published'), isNull(schema.trips.status)),
                    lt(schema.trips.end_date, todayStr)
                )
            )
            .orderBy(desc(schema.trips.end_date))
            .limit(1);

        if (data.length === 0) return null;

        const trip = data[0];
        const formattedTrip = {
            ...trip,
            max_participants: trip.max_participants !== null ? Number(trip.max_participants) : 0,
            max_crew: trip.max_crew !== null ? Number(trip.max_crew) : 0,
            base_price: trip.base_price !== null ? String(trip.base_price) : "0",
            crew_discount: trip.crew_discount !== null ? String(trip.crew_discount) : "0",
            deposit_amount: trip.deposit_amount !== null ? String(trip.deposit_amount) : "0",
            registration_open: !!trip.registration_open,
            is_bus_trip: !!trip.is_bus_trip,
            allow_final_payments: !!trip.allow_final_payments,
        };

        const parsed = reisTripSchema.safeParse(formattedTrip);
        if (!parsed.success) {
            safeConsoleError(`[trip-queries.actions.ts][getLatestPastTrip] Failed to parse trip:`, parsed.error);
            return formattedTrip as unknown as ReisTrip;
        }

        return parsed.data;
    } catch (error) {
        safeConsoleError('[trip-queries.actions.ts][getLatestPastTrip] Error:', error);
        return null;
    }
}