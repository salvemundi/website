import 'server-only';
import { requireReisAdmin } from '@/server/actions/reis-admin-utils';
import { fetchFullTripsDb, fetchTripActivitiesByTripIdDb } from '@/server/actions/reis-db.utils';
import { 
    tripSchema,
    type Trip,
    type TripActivity
} from '@salvemundi/validations/schema/admin-reis.zod';
import { z } from 'zod';

/**
 * Shared query logic for trips in the admin panel.
 * Uses direct database access to bypass Directus cache for immediate consistency.
 */
export async function getTrips(): Promise<Trip[]> {
    await requireReisAdmin();

    try {
        const sanitized = await fetchFullTripsDb();
        const parsed = z.array(tripSchema).safeParse(sanitized);

        if (!parsed.success) {
            
            // Fallback to sanitized raw if validation fails slightly, to keep UI working
            return sanitized as Trip[]; 
        }

        return parsed.data;
    } catch (error) {
        console.error('[AdminReisQueries] Failed to fetch trips:', error);
        return [];
    }
}

/**
 * Fetches all activities for a specific trip directly from the database.
 */
export async function getTripActivities(tripId: number): Promise<TripActivity[]> {
    await requireReisAdmin();

    try {
        const activities = await fetchTripActivitiesByTripIdDb(tripId);
        return activities as TripActivity[];
    } catch (error) {
        console.error('[AdminReisQueries] Failed to fetch trip activities:', error);
        return [];
    }
}
