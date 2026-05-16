import 'server-only';
import { requireAdminResource } from '@/server/auth/auth-utils';
import { AdminResource } from '@/shared/lib/permissions-config';
import { fetchFullTripsDb, fetchTripActivitiesByTripIdDb } from '@/server/internal/reis-db.utils';
import {
    tripSchema,
    type Trip,
    type TripActivity
} from '@salvemundi/validations/schema/admin-reis.zod';
import { z } from 'zod';
import { safeConsoleError } from '@/server/utils/logger';

/**
 * Shared query logic for trips in the admin panel.
 * Uses direct database access to bypass Directus cache for immediate consistency.
 */
export async function getTrips(): Promise<Trip[]> {
    await requireAdminResource(AdminResource.Reis);
    const sanitized = await fetchFullTripsDb();
    const parsed = z.array(tripSchema).safeParse(sanitized);

    if (!parsed.success) {
        // Log validation error but return sanitized as fallback if needed, or throw
        safeConsoleError('[AdminReisQueries] Validation failed for trips:', parsed.error);
        return sanitized as Trip[];
    }

    return parsed.data;
}

/**
 * Fetches all activities for a specific trip directly from the database.
 */
export async function getTripActivities(tripId: number): Promise<TripActivity[]> {
    await requireAdminResource(AdminResource.Reis);
    return await fetchTripActivitiesByTripIdDb(tripId) as TripActivity[];
}
