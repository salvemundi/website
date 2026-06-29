'use server';

import 'server-only';
import {
    reisTripSchema,
    type ReisSiteSettings,
    type ReisTrip,
    type ReisTripSignup
} from '@salvemundi/validations/schema/trip.zod';
import { db, schema } from '@salvemundi/db';
import { eq, inArray, count } from 'drizzle-orm';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import {
    fetchUserSignupStatusDb,
    fetchPublicTripsDb,
    fetchAllTripSignupsDb
} from '@/server/internal/trip-db.utils';
import { fetchUserProfileByEmailDb } from '@/server/internal/user-db.utils';
import { safeConsoleError } from '@/server/utils/logger';

export async function getReisSiteSettings(): Promise<ReisSiteSettings | null> {
    try {
        const rows = await db.select({
            is_active: schema.feature_flags.is_active,
            message: schema.feature_flags.message
        }).from(schema.feature_flags)
        .where(eq(schema.feature_flags.name, 'trip_registration'))
        .limit(1);

        if (rows.length === 0) return null;
        const flag = rows[0];

        return {
            id: 'reis',
            show: flag.is_active,
            disabled_message: flag.message
        };
    } catch (error: unknown) {
        safeConsoleError('[trip-queries.actions.ts][getReisSiteSettings] Failed to fetch site settings:', error);
        return null;
    }
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