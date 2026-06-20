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

export async function getTrips(): Promise<Trip[]> {
    await requireAdminResource(AdminResource.Reis);
    const sanitized = await fetchFullTripsDb();
    const parsed = z.array(tripSchema).safeParse(sanitized);

    if (!parsed.success) {
        safeConsoleError('admin-reis.queries.ts][getTrips]', `Validation failed for trips: ${parsed.error.message}`);
        return sanitized as Trip[];
    }

    return parsed.data;
}

export async function getTripActivities(tripId: number): Promise<TripActivity[]> {
    await requireAdminResource(AdminResource.Reis);
    return await fetchTripActivitiesByTripIdDb(tripId) as TripActivity[];
}