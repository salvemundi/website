'use server';

import 'server-only';
import {
    reisTripSchema,
    type ReisSiteSettings,
    type ReisTrip,
    type ReisTripSignup
} from '@salvemundi/validations/schema/reis.zod';
import { query } from '@/lib/database';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import {
    fetchUserSignupStatusDb,
    fetchPublicTripsDb,
    fetchAllTripSignupsDb
} from '@/server/internal/reis-db.utils';
import { fetchUserProfileByEmailDb } from '@/server/internal/user-db.utils';
import { safeConsoleError } from '@/server/utils/logger';

interface DbFeatureFlagRow {
    is_active: boolean;
    message: string | null;
}

interface ParticipantCountRow {
    count: number;
}

export async function getReisSiteSettings(): Promise<ReisSiteSettings | null> {
    try {
        const { rows } = await query<DbFeatureFlagRow>('SELECT is_active, message FROM feature_flags WHERE name = $1 LIMIT 1', ['trip_registration']);

        if (rows.length === 0) return null;
        const flag = rows[0];

        return {
            id: 'reis',
            show: flag.is_active,
            disabled_message: flag.message
        };
    } catch (error: unknown) {
        safeConsoleError('[reis-queries.actions.ts][getReisSiteSettings] Failed to fetch site settings:', error);
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
        safeConsoleError(`[reis-queries.actions.ts][getUpcomingTrips] Failed to parse trips:`, parsed.error);
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
        const { rows } = await query<ParticipantCountRow>(
            `SELECT COUNT(*)::int as count FROM trip_signups 
             WHERE trip_id = $1 AND status IN ('registered', 'confirmed')`,
            [tripId]
        );
        return rows[0]?.count ?? 0;
    } catch (error: unknown) {
        safeConsoleError(`[reis-queries.actions.ts][getTripParticipantsCount] Failed to get participant count for trip ${tripId}:`, error);
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